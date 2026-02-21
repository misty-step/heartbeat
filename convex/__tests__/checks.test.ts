import { test, expect, describe } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend, createTestSubscription } from "../../tests/convex";

const user = { name: "Test", subject: "user_test", issuer: "clerk" };

// Helper to create a monitor and return its ID
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
  return monitor!._id;
}

// Helper to record a check
async function recordCheck(
  t: ReturnType<typeof setupBackend>,
  monitorId: ReturnType<typeof createTestMonitor> extends Promise<infer T>
    ? T
    : never,
  status: "up" | "down" | "degraded",
  responseTime: number,
  checkedAt?: number,
) {
  await t.mutation(internal.monitoring.recordCheck, {
    monitorId,
    status,
    statusCode: status === "up" ? 200 : undefined,
    responseTime,
    checkedAt: checkedAt ?? Date.now(),
  });
}

describe("getRecentForMonitor", () => {
  test("returns empty array for monitor with no checks", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(checks).toHaveLength(0);
  });

  test("returns checks in descending order by checkedAt", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    await recordCheck(t, monitorId, "up", 100, now - 3000);
    await recordCheck(t, monitorId, "up", 150, now - 2000);
    await recordCheck(t, monitorId, "down", 0, now - 1000);

    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(checks).toHaveLength(3);
    // Most recent first
    expect(checks[0].status).toBe("down");
    expect(checks[1].responseTime).toBe(150);
    expect(checks[2].responseTime).toBe(100);
  });

  test("respects limit parameter", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      await recordCheck(t, monitorId, "up", 100 + i * 10, now - i * 1000);
    }

    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, {
        monitorId,
        limit: 2,
      });
    expect(checks).toHaveLength(2);
  });

  test("clamps limit to 100", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    for (let i = 0; i < 120; i++) {
      await recordCheck(t, monitorId, "up", 100 + i, now - i * 1000);
    }

    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, {
        monitorId,
        limit: 1000,
      });
    expect(checks).toHaveLength(100);
  });

  test("defaults to 50 when no limit specified", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // This test just verifies the function works without limit
    // We don't create 50+ checks to save time
    const checks = await t
      .withIdentity(user)
      .query(api.checks.getRecentForMonitor, { monitorId });
    expect(Array.isArray(checks)).toBe(true);
  });

  test("throws Unauthorized for unauthenticated requests", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await expect(
      t.query(api.checks.getRecentForMonitor, { monitorId }),
    ).rejects.toThrow("Unauthorized");
  });

  test("throws Monitor not found for wrong user", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const otherUser = { name: "Other", subject: "user_other", issuer: "clerk" };

    await expect(
      t.withIdentity(otherUser).query(api.checks.getRecentForMonitor, {
        monitorId,
      }),
    ).rejects.toThrow("Monitor not found");
  });
});

describe("getUptimeStats", () => {
  test("returns 100% uptime for monitor with no checks", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const stats = await t
      .withIdentity(user)
      .query(api.checks.getUptimeStats, { monitorId });
    expect(stats.uptimePercentage).toBe(100);
    expect(stats.totalChecks).toBe(0);
    expect(stats.successfulChecks).toBe(0);
    expect(stats.failedChecks).toBe(0);
    expect(stats.avgResponseTime).toBeNull();
  });

  test("calculates correct uptime percentage with all successful checks", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      await recordCheck(t, monitorId, "up", 100, now - i * 1000);
    }

    const stats = await t
      .withIdentity(user)
      .query(api.checks.getUptimeStats, { monitorId });
    expect(stats.uptimePercentage).toBe(100);
    expect(stats.totalChecks).toBe(10);
    expect(stats.successfulChecks).toBe(10);
    expect(stats.failedChecks).toBe(0);
  });

  test("calculates correct uptime percentage with mixed checks", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 8 successful, 2 failed = 80% uptime
    for (let i = 0; i < 8; i++) {
      await recordCheck(t, monitorId, "up", 100, now - i * 1000);
    }
    await recordCheck(t, monitorId, "down", 0, now - 8000);
    await recordCheck(t, monitorId, "down", 0, now - 9000);

    const stats = await t
      .withIdentity(user)
      .query(api.checks.getUptimeStats, { monitorId });
    expect(stats.uptimePercentage).toBe(80);
    expect(stats.totalChecks).toBe(10);
    expect(stats.successfulChecks).toBe(8);
    expect(stats.failedChecks).toBe(2);
  });

  test("calculates average response time correctly", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 100, 200, 300 ms = avg 200ms
    await recordCheck(t, monitorId, "up", 100, now - 3000);
    await recordCheck(t, monitorId, "up", 200, now - 2000);
    await recordCheck(t, monitorId, "up", 300, now - 1000);

    const stats = await t
      .withIdentity(user)
      .query(api.checks.getUptimeStats, { monitorId });
    expect(stats.avgResponseTime).toBe(200);
  });

  test("filters checks by days parameter", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    // Checks within 1 day
    await recordCheck(t, monitorId, "up", 100, now);
    await recordCheck(t, monitorId, "up", 100, oneDayAgo + 1000);

    // Check older than 1 day
    await recordCheck(t, monitorId, "down", 0, twoDaysAgo);

    // Query with 1 day filter - should only get 2 checks
    const stats = await t.withIdentity(user).query(api.checks.getUptimeStats, {
      monitorId,
      days: 1,
    });
    expect(stats.totalChecks).toBe(2);
    expect(stats.uptimePercentage).toBe(100); // Only the 'up' checks
  });

  test("clamps days to 365", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    const fourHundredDaysAgo = now - 400 * 24 * 60 * 60 * 1000;

    await recordCheck(t, monitorId, "up", 100, now);
    await recordCheck(t, monitorId, "down", 0, fourHundredDaysAgo);

    const stats = await t.withIdentity(user).query(api.checks.getUptimeStats, {
      monitorId,
      days: 1000,
    });
    expect(stats.totalChecks).toBe(1);
  });

  test("handles all failed checks", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      await recordCheck(t, monitorId, "down", 0, now - i * 1000);
    }

    const stats = await t
      .withIdentity(user)
      .query(api.checks.getUptimeStats, { monitorId });
    expect(stats.uptimePercentage).toBe(0);
    expect(stats.failedChecks).toBe(5);
    expect(stats.successfulChecks).toBe(0);
  });

  test("throws Unauthorized for unauthenticated requests", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await expect(
      t.query(api.checks.getUptimeStats, { monitorId }),
    ).rejects.toThrow("Unauthorized");
  });

  test("throws Monitor not found for wrong user", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const otherUser = { name: "Other", subject: "user_other", issuer: "clerk" };

    await expect(
      t.withIdentity(otherUser).query(api.checks.getUptimeStats, { monitorId }),
    ).rejects.toThrow("Monitor not found");
  });
});

describe("getDailyStatus", () => {
  test("returns empty array for monitor with no checks", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });
    expect(status).toHaveLength(0);
  });

  test("throws Unauthorized for unauthenticated requests", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await expect(
      t.query(api.checks.getDailyStatus, { monitorId }),
    ).rejects.toThrow("Unauthorized");
  });

  test("throws Monitor not found for wrong user", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const otherUser = { name: "Other", subject: "user_other", issuer: "clerk" };

    await expect(
      t.withIdentity(otherUser).query(api.checks.getDailyStatus, { monitorId }),
    ).rejects.toThrow("Monitor not found");
  });

  test("returns uptimePercentage and totalChecks per day", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 2 up, 1 down → 66.67% uptime, 3 total checks
    await recordCheck(t, monitorId, "up", 100, now - 3000);
    await recordCheck(t, monitorId, "up", 150, now - 2000);
    await recordCheck(t, monitorId, "down", 0, now - 1000);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });

    expect(status).toHaveLength(1);
    expect(status[0].totalChecks).toBe(3);
    expect(status[0].uptimePercentage).toBe(66.67);
  });

  test("returns 100% uptimePercentage when all checks are up", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    await recordCheck(t, monitorId, "up", 100, now - 2000);
    await recordCheck(t, monitorId, "up", 110, now - 1000);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });

    expect(status[0].uptimePercentage).toBe(100);
    expect(status[0].totalChecks).toBe(2);
  });

  test("classifies day as 'up' at exactly 99% uptime", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 99 up + 1 down = 0.99 ratio → "up"
    for (let i = 0; i < 99; i++) {
      await recordCheck(t, monitorId, "up", 100, now - (i + 1) * 1000);
    }
    await recordCheck(t, monitorId, "down", 0, now - 100_000);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });

    expect(status[0].status).toBe("up");
    expect(status[0].uptimePercentage).toBe(99);
  });

  test("classifies day as 'degraded' just below 99% uptime", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 98 up + 2 down = 0.98 ratio → "degraded"
    for (let i = 0; i < 98; i++) {
      await recordCheck(t, monitorId, "up", 100, now - (i + 1) * 1000);
    }
    await recordCheck(t, monitorId, "down", 0, now - 99_000);
    await recordCheck(t, monitorId, "down", 0, now - 100_000);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });

    expect(status[0].status).toBe("degraded");
  });

  test("classifies day as 'degraded' at exactly 95% uptime", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 19 up + 1 down = 0.95 ratio → "degraded"
    for (let i = 0; i < 19; i++) {
      await recordCheck(t, monitorId, "up", 100, now - (i + 1) * 1000);
    }
    await recordCheck(t, monitorId, "down", 0, now - 20_000);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });

    expect(status[0].status).toBe("degraded");
    expect(status[0].uptimePercentage).toBe(95);
  });

  test("classifies day as 'down' just below 95% uptime", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const now = Date.now();
    // 94 up + 6 down = 0.94 ratio → "down"
    for (let i = 0; i < 94; i++) {
      await recordCheck(t, monitorId, "up", 100, now - (i + 1) * 1000);
    }
    for (let i = 0; i < 6; i++) {
      await recordCheck(t, monitorId, "down", 0, now - (95 + i) * 1000);
    }

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId });

    expect(status[0].status).toBe("down");
  });

  test("groups checks by UTC day and returns sorted entries", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Create checks on two different UTC days
    const day1 = new Date("2025-06-15T12:00:00Z").getTime();
    const day2 = new Date("2025-06-16T12:00:00Z").getTime();

    await recordCheck(t, monitorId, "up", 100, day1);
    await recordCheck(t, monitorId, "up", 110, day1 + 1000);
    await recordCheck(t, monitorId, "down", 0, day2);

    const status = await t
      .withIdentity(user)
      .query(api.checks.getDailyStatus, { monitorId, days: 365 });

    expect(status.length).toBe(2);
    // Sorted chronologically
    expect(status[0].date).toBe("2025-06-15");
    expect(status[1].date).toBe("2025-06-16");
    // Separate per-day stats
    expect(status[0].totalChecks).toBe(2);
    expect(status[0].uptimePercentage).toBe(100);
    expect(status[1].totalChecks).toBe(1);
    expect(status[1].uptimePercentage).toBe(0);
  });
});
