import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend } from "../../tests/convex";

const user = { name: "Test", subject: "user_123", issuer: "clerk" };

const baseMonitorArgs = {
  name: "API",
  url: "https://internal.example.com",
  method: "GET" as const,
  interval: 60 as const,
  timeout: 10000,
  projectSlug: "public-project",
  expectedStatusCode: 200,
  expectedBodyContains: "ok",
  headers: [{ key: "Auth", value: "secret" }],
  body: '{"ping":true}',
};

const createMonitor = async (
  t: ReturnType<typeof setupBackend>,
  overrides: Partial<typeof baseMonitorArgs> & {
    visibility?: "public" | "private";
  } = {},
) => {
  const monitor = await t.withIdentity(user).mutation(api.monitors.create, {
    ...baseMonitorArgs,
    ...overrides,
  });
  return monitor!._id;
};

const recordCheck = async (
  t: ReturnType<typeof setupBackend>,
  monitorId: string,
  status: "up" | "down" | "degraded",
  responseTime: number,
  extra: {
    statusCode?: number;
    errorMessage?: string;
    checkedAt?: number;
  } = {},
) => {
  await t.mutation(internal.monitoring.recordCheck, {
    monitorId,
    status,
    responseTime,
    statusCode: extra.statusCode,
    errorMessage: extra.errorMessage,
    checkedAt: extra.checkedAt ?? Date.now(),
  });
};

// Note: insertMonitorWithoutVisibility removed - visibility is now required in schema (Phase 2)

describe("getPublicMonitorsForProject", () => {
  test("returns only safe fields for public monitors", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "public" });

    const monitors = await t.query(api.monitors.getPublicMonitorsForProject, {
      projectSlug: baseMonitorArgs.projectSlug,
    });

    expect(monitors).toHaveLength(1);
    const monitor = monitors[0];
    expect(monitor._id).toEqual(monitorId);
    expect(monitor).toEqual(
      expect.objectContaining({
        name: "API",
        status: expect.stringMatching(/up|degraded|down/),
      }),
    );
    expect(monitor).not.toHaveProperty("url");
    expect(monitor).not.toHaveProperty("headers");
    expect(monitor).not.toHaveProperty("body");
    expect(monitor).not.toHaveProperty("method");
    expect(monitor).not.toHaveProperty("userId");
    expect(monitor).not.toHaveProperty("timeout");
    expect(monitor).not.toHaveProperty("expectedStatusCode");
    expect(monitor).not.toHaveProperty("expectedBodyContains");
  });

  test("excludes private monitors", async () => {
    const t = setupBackend();
    const publicMonitor = await createMonitor(t, {
      name: "Public",
      visibility: "public",
    });
    await createMonitor(t, { name: "Private", visibility: "private" });

    const monitors = await t.query(api.monitors.getPublicMonitorsForProject, {
      projectSlug: baseMonitorArgs.projectSlug,
    });

    const ids = monitors.map((m) => m._id);
    expect(ids).toContain(publicMonitor);
    expect(monitors).toHaveLength(1);
  });
});

describe("getPublicChecksForMonitor", () => {
  test("excludes statusCode and errorMessage", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "public" });

    await recordCheck(t, monitorId, "down", 320, {
      statusCode: 500,
      errorMessage: "boom",
    });

    const checks = await t.query(api.checks.getPublicChecksForMonitor, {
      monitorId,
      limit: 10,
    });

    expect(checks).toHaveLength(1);
    const check = checks[0];
    expect(check.status).toBe("down");
    expect(check.responseTime).toBe(320);
    expect(check).not.toHaveProperty("statusCode");
    expect(check).not.toHaveProperty("errorMessage");
    expect(check).not.toHaveProperty("monitorId");
  });

  test("returns empty for private monitor", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "private" });
    await recordCheck(t, monitorId, "up", 100);

    const checks = await t.query(api.checks.getPublicChecksForMonitor, {
      monitorId,
      limit: 5,
    });

    expect(checks).toHaveLength(0);
  });
});

describe("getPublicUptimeStats", () => {
  test("omits internal counts and respects visibility", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "public" });

    await recordCheck(t, monitorId, "up", 100, { checkedAt: Date.now() });
    await recordCheck(t, monitorId, "down", 200, { checkedAt: Date.now() });

    const stats = await t.query(api.checks.getPublicUptimeStats, {
      monitorId,
      days: 7,
    });

    expect(stats.totalChecks).toBe(2);
    expect(stats.uptimePercentage).toBe(50);
    expect(stats).not.toHaveProperty("successfulChecks");
    expect(stats).not.toHaveProperty("failedChecks");
  });

  test("returns defaults for private monitor", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "private" });

    const stats = await t.query(api.checks.getPublicUptimeStats, { monitorId });

    expect(stats).toEqual({
      uptimePercentage: 100,
      totalChecks: 0,
      avgResponseTime: null,
    });
  });
});

describe("getPublicIncidentsForProject", () => {
  test("returns incidents only for public monitors without sensitive fields", async () => {
    const t = setupBackend();
    const publicMonitor = await createMonitor(t, {
      name: "Public Monitor",
      visibility: "public",
    });
    const privateMonitor = await createMonitor(t, {
      name: "Private Monitor",
      visibility: "private",
    });

    await t.mutation(internal.monitoring.openIncident, {
      monitorId: publicMonitor,
    });
    await t.mutation(internal.monitoring.openIncident, {
      monitorId: privateMonitor,
    });

    const incidents = await t.query(
      api.incidents.getPublicIncidentsForProject,
      {
        projectSlug: baseMonitorArgs.projectSlug,
        limit: 10,
      },
    );

    expect(incidents).toHaveLength(1);
    const incident = incidents[0];
    expect(incident).not.toHaveProperty("description");
    expect(incident).not.toHaveProperty("monitorId");
    // Incident title = `${monitor.name} is down`, so should contain "Public"
    expect(incident.title).toContain("Public");
  });
});

describe("getOpenIncidents - deleted", () => {
  test("query does not exist", () => {
    // Check that getOpenIncidents was removed from the API (security fix)
    const incidentQueryNames = Object.keys(api.incidents);
    expect(incidentQueryNames).not.toContain("getOpenIncidents");
  });
});

describe("getPublicMonitorByStatusSlug", () => {
  test("returns monitor by statusSlug for public monitor", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "public" });

    // Get the monitor to retrieve its statusSlug
    const fullMonitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });

    const result = await t.query(api.monitors.getPublicMonitorByStatusSlug, {
      statusSlug: fullMonitor.statusSlug!,
    });

    expect(result).not.toBeNull();
    expect(result!._id).toEqual(monitorId);
    expect(result!.name).toBe("API");
    expect(result).not.toHaveProperty("url");
    expect(result).not.toHaveProperty("headers");
  });

  test("returns null for private monitor", async () => {
    const t = setupBackend();
    const monitorId = await createMonitor(t, { visibility: "private" });

    const fullMonitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });

    const result = await t.query(api.monitors.getPublicMonitorByStatusSlug, {
      statusSlug: fullMonitor.statusSlug!,
    });

    expect(result).toBeNull();
  });

  test("returns null for non-existent statusSlug", async () => {
    const t = setupBackend();

    const result = await t.query(api.monitors.getPublicMonitorByStatusSlug, {
      statusSlug: "non-existent-slug",
    });

    expect(result).toBeNull();
  });
});
