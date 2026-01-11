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
async function createTestMonitor(t: ReturnType<typeof setupBackend>) {
  const monitor = await t.withIdentity(user).mutation(api.monitors.create, {
    name: "Test Monitor",
    url: "https://example.com",
    method: "GET",
    interval: 60,
    timeout: 10000,
    projectSlug: "test-project",
  });
  return monitor!._id;
}

describe("updateMonitorStatus", () => {
  test("successful check resets failure counter to 0", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Simulate successful check
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: true,
      responseTime: 150,
    });

    // Verify monitor state
    const monitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitor.consecutiveFailures).toBe(0);
    expect(monitor.lastResponseTime).toBe(150);
    expect(monitor.lastCheckAt).toBeDefined();
  });

  test("failed check increments failure counter", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Simulate failed check
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: false,
      responseTime: 0,
    });

    // Verify failure count increased
    const monitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitor.consecutiveFailures).toBe(1);
  });

  test("second failure increments counter without triggering incident", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Two consecutive failures
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: false,
      responseTime: 0,
    });
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: false,
      responseTime: 0,
    });

    const monitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitor.consecutiveFailures).toBe(2);

    // No incident should exist yet (openIncident not directly called)
    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(0);
  });

  test("third failure sets counter to 3", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Three consecutive failures
    for (let i = 0; i < 3; i++) {
      await t.mutation(internal.monitoring.updateMonitorStatus, {
        monitorId,
        success: false,
        responseTime: 0,
      });
    }
    // Run scheduled openIncident triggered by 3rd failure
    await t.finishAllScheduledFunctions(advanceTimers);

    const monitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitor.consecutiveFailures).toBe(3);
  });

  test("success resets failures even from high count", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Build up failures (triggers openIncident at 3rd failure)
    for (let i = 0; i < 5; i++) {
      await t.mutation(internal.monitoring.updateMonitorStatus, {
        monitorId,
        success: false,
        responseTime: 0,
      });
    }
    await t.finishAllScheduledFunctions(advanceTimers);

    // Now succeed (triggers resolveIncident since was down)
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: true,
      responseTime: 200,
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Verify recovery
    const monitor = await t
      .withIdentity(user)
      .query(api.monitors.get, { id: monitorId });
    expect(monitor.consecutiveFailures).toBe(0);
    expect(monitor.lastResponseTime).toBe(200);
  });

  test("throws error for non-existent monitor", async () => {
    const t = setupBackend();

    // Create and immediately delete a monitor to get an invalid ID
    const monitorId = await createTestMonitor(t);
    await t.withIdentity(user).mutation(api.monitors.remove, { id: monitorId });

    await expect(
      t.mutation(internal.monitoring.updateMonitorStatus, {
        monitorId,
        success: true,
        responseTime: 100,
      }),
    ).rejects.toThrow("not found");
  });
});

describe("openIncident", () => {
  test("creates incident with correct title and description", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Set up monitor state with failures
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: false,
      responseTime: 0,
    });

    await t.mutation(internal.monitoring.openIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(1);
    expect(incidents[0].status).toBe("investigating");
    expect(incidents[0].title).toBe("Test Monitor is down");
    expect(incidents[0].startedAt).toBeDefined();
  });

  test("does not create duplicate incident if one already exists", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Open first incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    // Try to open another
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    // Should still only have one
    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(1);
  });

  test("can create new incident after previous one is resolved", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Open and resolve first incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });

    // Open second incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(2);
    expect(incidents.filter((i) => i.status === "investigating")).toHaveLength(
      1,
    );
  });
});

describe("resolveIncident", () => {
  test("resolves open incident", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents[0].status).toBe("resolved");
    expect(incidents[0].resolvedAt).toBeDefined();
  });

  test("no-op if no open incident exists", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Should not throw
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });

    const incidents = await t.query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(0);
  });
});

describe("recordCheck", () => {
  test("records check with all fields", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const now = Date.now();

    await t.mutation(internal.monitoring.recordCheck, {
      monitorId,
      status: "up",
      statusCode: 200,
      responseTime: 150,
      checkedAt: now,
    });

    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({
      monitorId,
      status: "up",
      statusCode: 200,
      responseTime: 150,
    });
  });

  test("records check with error message", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const now = Date.now();

    await t.mutation(internal.monitoring.recordCheck, {
      monitorId,
      status: "down",
      responseTime: 5000,
      errorMessage: "Connection timeout",
      checkedAt: now,
    });

    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(checks[0].errorMessage).toBe("Connection timeout");
    expect(checks[0].status).toBe("down");
  });
});

describe("getDueMonitors", () => {
  test("returns never-checked monitors as due", async () => {
    const t = setupBackend();
    await createTestMonitor(t);

    const dueMonitors = await t.query(internal.monitoring.getDueMonitors);
    expect(dueMonitors).toHaveLength(1);
  });

  test("excludes recently checked monitors", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Mark as recently checked
    await t.mutation(internal.monitoring.updateMonitorStatus, {
      monitorId,
      success: true,
      responseTime: 100,
    });

    const dueMonitors = await t.query(internal.monitoring.getDueMonitors);
    expect(dueMonitors).toHaveLength(0);
  });

  test("excludes disabled monitors", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Disable the monitor
    await t.withIdentity(user).mutation(api.monitors.update, {
      id: monitorId,
      enabled: false,
    });

    const dueMonitors = await t.query(internal.monitoring.getDueMonitors);
    expect(dueMonitors).toHaveLength(0);
  });
});
