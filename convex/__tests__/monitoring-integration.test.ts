import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend, createTestSubscription } from "../../tests/convex";

vi.mock("../lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/email")>();
  return {
    ...actual,
    sendEmail: vi.fn(async () => ({ success: true, id: "email_test" })),
  };
});

const user = {
  name: "Test User",
  subject: "user_test",
  issuer: "clerk",
  email: "test@example.com",
};

const advanceTimers = () => vi.advanceTimersByTime(1);
const intervalMs = 60_000;
const INCIDENT_FAILURE_THRESHOLD = 3;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function createTestMonitor(t: ReturnType<typeof setupBackend>) {
  // Ensure subscription exists
  await createTestSubscription(t, user.subject);
  const monitor = await t.withIdentity(user).mutation(api.monitors.create, {
    name: "Test Monitor",
    url: "https://example.com",
    method: "GET",
    interval: 60,
    timeout: 10000,
    projectSlug: "test-project",
  });
  if (!monitor) {
    throw new Error("Test setup failed: monitor creation returned null.");
  }
  return monitor._id;
}

async function setupUserSettings(t: ReturnType<typeof setupBackend>) {
  await t.withIdentity(user).mutation(api.userSettings.update, {
    emailNotifications: true,
    notifyOnDown: true,
    notifyOnRecovery: true,
    throttleMinutes: 5,
  });
}

describe("runHeartbeat integration", () => {
  test("runs full monitoring cycle end-to-end", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    await setupUserSettings(t);

    const statusQueue = [500, 500, 500, 200];
    const fetchMock = vi.fn(async () => {
      const status = statusQueue.shift() ?? 200;
      return new Response("ok", { status });
    });
    vi.stubGlobal("fetch", fetchMock);

    const runHeartbeat = async () => {
      await t.action(internal.monitoring.runHeartbeat, {});
      await t.finishAllScheduledFunctions(advanceTimers);
    };

    for (let i = 0; i < INCIDENT_FAILURE_THRESHOLD; i += 1) {
      if (i > 0) {
        vi.advanceTimersByTime(intervalMs);
      }
      await runHeartbeat();
    }

    const monitorAfterFailures = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitorAfterFailures.consecutiveFailures).toBe(
      INCIDENT_FAILURE_THRESHOLD,
    );

    const incidentsAfterFailures = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidentsAfterFailures).toHaveLength(1);
    expect(incidentsAfterFailures[0].status).toBe("investigating");
    expect(incidentsAfterFailures[0].notifiedAt).toBeDefined();

    const checksAfterFailures = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(checksAfterFailures).toHaveLength(INCIDENT_FAILURE_THRESHOLD);
    checksAfterFailures.forEach((check) => expect(check.status).toBe("down"));

    vi.advanceTimersByTime(intervalMs);
    await runHeartbeat();

    const monitorAfterRecovery = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitorAfterRecovery.consecutiveFailures).toBe(0);
    expect(monitorAfterRecovery.lastResponseTime).toBeDefined();

    const incidentsAfterRecovery = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidentsAfterRecovery).toHaveLength(1);
    expect(incidentsAfterRecovery[0].status).toBe("resolved");
    expect(incidentsAfterRecovery[0].resolvedAt).toBeDefined();
    expect(incidentsAfterRecovery[0].notifiedAt).toBeDefined();

    const checksAfterRecovery = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(checksAfterRecovery).toHaveLength(4);
    expect(checksAfterRecovery[0].status).toBe("up");

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
