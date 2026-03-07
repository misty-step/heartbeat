import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { createTestSubscription, setupBackend } from "../../tests/convex";

const user = { name: "Test", subject: "user_test", issuer: "clerk" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-03T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function createPublicMonitor(
  t: ReturnType<typeof setupBackend>,
  options: { name: string; url: string },
) {
  await createTestSubscription(t, user.subject);
  const monitor = await t.withIdentity(user).mutation(api.monitors.create, {
    name: options.name,
    url: options.url,
    method: "GET",
    interval: 60,
    timeout: 10000,
    projectSlug: "public-project",
    visibility: "public",
  });
  return monitor!._id;
}

describe("isItDown.listTrackedTargets", () => {
  test("returns fallback tracked targets before seeding", async () => {
    const t = setupBackend();
    const targets = await t.query(api.isItDown.listTrackedTargets, {});

    expect(targets.length).toBeGreaterThan(0);
    expect(targets.some((target) => target.hostname === "github.com")).toBe(
      true,
    );
  });
});

describe("isItDown.getStatusForTarget", () => {
  test("returns no_data when no probes exist", async () => {
    const t = setupBackend();

    const result = await t.query(api.isItDown.getStatusForTarget, {
      target: "example.com",
    });

    expect(result.verdict).toBe("no_data");
    expect(result.recentChecks).toHaveLength(0);
  });

  test("uses the exact normalized target URL for probe evidence", async () => {
    const t = setupBackend();
    const checkedAt = Date.now();

    await t.mutation(internal.isItDown.recordServiceCheck, {
      hostname: "example.com",
      url: "https://example.com",
      status: "up",
      statusCode: 200,
      responseTime: 120,
      source: "on_demand",
      checkedAt,
    });
    await t.mutation(internal.isItDown.recordServiceCheck, {
      hostname: "example.com",
      url: "https://example.com",
      status: "up",
      statusCode: 204,
      responseTime: 140,
      source: "on_demand",
      checkedAt: checkedAt - 1000,
    });
    await t.mutation(internal.isItDown.recordServiceCheck, {
      hostname: "example.com",
      url: "http://example.com:8080",
      status: "down",
      statusCode: 503,
      responseTime: 900,
      source: "on_demand",
      checkedAt: checkedAt - 2000,
    });

    const result = await t.query(api.isItDown.getStatusForTarget, {
      target: "http://example.com:8080/health",
    });

    expect(result.probeUrl).toBe("http://example.com:8080");
    expect(result.recentChecks).toHaveLength(1);
    expect(result.recentFailureCount).toBe(1);
    expect(result.recentSuccessCount).toBe(0);
  });

  test("active incidents override probe success signals", async () => {
    const t = setupBackend();
    const monitorId = await createPublicMonitor(t, {
      name: "Example API",
      url: "https://example.com",
    });

    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.isItDown.recordServiceCheck, {
      hostname: "example.com",
      url: "https://example.com",
      status: "up",
      statusCode: 200,
      responseTime: 120,
      source: "on_demand",
      checkedAt: Date.now(),
    });

    const result = await t.query(api.isItDown.getStatusForTarget, {
      target: "https://example.com",
    });

    expect(result.verdict).toBe("likely_down_for_everyone");
    expect(result.activeIncidents).toHaveLength(1);
  });
});

describe("isItDown.probePublicTarget", () => {
  test("runs probes and returns likely_local_issue for successful checks", async () => {
    const t = setupBackend();
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const probeResult = await t.action(api.isItDown.probePublicTarget, {
      target: "https://example.com",
    });
    const snapshot = await t.query(api.isItDown.getStatusForTarget, {
      target: "example.com",
    });

    expect(probeResult.ok).toBe(true);
    expect(snapshot.verdict).toBe("likely_local_issue");
    expect(snapshot.recentChecks.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  test("reuses a fresh cached probe for the same normalized target URL", async () => {
    const t = setupBackend();
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await t.mutation(internal.isItDown.recordServiceCheck, {
      hostname: "example.com",
      url: "http://example.com:8080",
      status: "up",
      statusCode: 200,
      responseTime: 120,
      source: "on_demand",
      checkedAt: Date.now(),
    });

    const probeResult = await t.action(api.isItDown.probePublicTarget, {
      target: "http://example.com:8080/health",
    });

    expect(probeResult.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
