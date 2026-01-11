import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend } from "../../tests/convex";

const user = { name: "Test", subject: "user_test", issuer: "clerk" };

// Function to advance fake timers (used by convex-test's finishAllScheduledFunctions)
const advanceTimers = () => vi.advanceTimersByTime(1);

// Use fake timers for tests that trigger the scheduler
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper to create a monitor and return its ID
async function createTestMonitor(
  t: ReturnType<typeof setupBackend>,
  projectSlug = "test-project",
  name = "Test Monitor",
) {
  const monitor = await t.withIdentity(user).mutation(api.monitors.create, {
    name,
    url: "https://example.com",
    method: "GET",
    interval: 60,
    timeout: 10000,
    projectSlug,
  });
  return monitor!._id;
}

describe("getForMonitor", () => {
  test("returns empty array for monitor with no incidents", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(0);
  });

  test("returns incidents for monitor", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create an incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(1);
    expect(incidents[0].status).toBe("investigating");
  });

  test("returns incidents in descending order", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create and resolve first incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Create second incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(2);
    // Most recent (investigating) first
    expect(incidents[0].status).toBe("investigating");
    expect(incidents[1].status).toBe("resolved");
  });

  test("respects limit parameter", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create multiple incidents
    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.monitoring.openIncident, { monitorId });
      await t.finishAllScheduledFunctions(advanceTimers);
      await t.mutation(internal.monitoring.resolveIncident, { monitorId });
      await t.finishAllScheduledFunctions(advanceTimers);
    }

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, {
        monitorId,
        limit: 2,
      });
    expect(incidents).toHaveLength(2);
  });
});
