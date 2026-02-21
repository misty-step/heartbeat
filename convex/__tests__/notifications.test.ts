import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend, createTestSubscription } from "../../tests/convex";
import { sendEmail } from "../lib/email";

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

// Function to advance fake timers (used by convex-test's finishAllScheduledFunctions)
const advanceTimers = () => vi.advanceTimersByTime(1);

// Use fake timers to properly handle scheduled functions
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper to create a monitor
async function createTestMonitor(
  t: ReturnType<typeof setupBackend>,
  overrides = {},
) {
  // Ensure subscription exists
  await createTestSubscription(t, user.subject);
  const monitor = await t.withIdentity(user).mutation(api.monitors.create, {
    name: "Test Monitor",
    url: "https://example.com",
    method: "GET",
    interval: 60,
    timeout: 10000,
    projectSlug: "test-project",
    ...overrides,
  });
  return monitor!._id;
}

// Helper to create an incident and drain scheduled functions
async function createTestIncident(
  t: ReturnType<typeof setupBackend>,
  monitorId: string,
) {
  await t.mutation(internal.monitoring.openIncident, { monitorId });
  // Drain scheduled notification action to avoid unhandled errors
  await t.finishAllScheduledFunctions(advanceTimers);
  const incidents = await t
    .withIdentity(user)
    .query(api.incidents.getForMonitor, { monitorId });
  return incidents[0]._id;
}

// Helper to set up user notification settings
async function setupUserSettings(
  t: ReturnType<typeof setupBackend>,
  overrides = {},
) {
  await t.withIdentity(user).mutation(api.userSettings.update, {
    emailNotifications: true,
    notifyOnDown: true,
    notifyOnRecovery: true,
    throttleMinutes: 5,
    ...overrides,
  });
}

describe("getIncident (internal)", () => {
  test("returns incident by ID", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    const incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });

    expect(incident).toBeDefined();
    expect(incident!._id).toEqual(incidentId);
    expect(incident!.monitorId).toEqual(monitorId);
    expect(incident!.status).toBe("investigating");
  });

  test("returns resolved incident", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Resolve it
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });
    expect(incident).toBeDefined();
    expect(incident!.status).toBe("resolved");
  });
});

describe("markNotified", () => {
  test("sets notifiedAt timestamp on incident", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Initially no notifiedAt
    let incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });
    expect(incident!.notifiedAt).toBeUndefined();

    // Mark as notified
    await t.mutation(internal.notifications.markNotified, { incidentId });

    // Now should have notifiedAt
    incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });
    expect(incident!.notifiedAt).toBeDefined();
    expect(incident!.notifiedAt).toBeGreaterThan(0);
  });

  test("can be called multiple times", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Mark notified multiple times - should not throw
    await t.mutation(internal.notifications.markNotified, { incidentId });
    await t.mutation(internal.notifications.markNotified, { incidentId });

    const incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });
    expect(incident!.notifiedAt).toBeDefined();
  });
});

describe("openIncident behavior", () => {
  test("creates incident with correct title and description", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t, { name: "Production API" });

    // Set up 3 failures first
    for (let i = 0; i < 3; i++) {
      await t.mutation(internal.monitoring.updateMonitorStatus, {
        monitorId,
        success: false,
        responseTime: 0,
      });
    }

    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(1);
    expect(incidents[0].title).toBe("Production API is down");
    expect(incidents[0].description).toContain("3 consecutive checks");
    expect(incidents[0].status).toBe("investigating");
    expect(incidents[0].startedAt).toBeDefined();
  });

  test("does not create duplicate incident if one already exists", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Open first incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Try to open another
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Should still only have one
    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(1);
  });

  test("can create new incident after previous one is resolved", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Open and resolve first incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Open second incident
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(2);
    expect(incidents.filter((i) => i.status === "investigating")).toHaveLength(
      1,
    );
  });
});

describe("resolveIncident behavior", () => {
  test("resolves open incident with timestamp", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents[0].status).toBe("resolved");
    expect(incidents[0].resolvedAt).toBeDefined();
    expect(incidents[0].resolvedAt).toBeGreaterThanOrEqual(
      incidents[0].startedAt,
    );
  });

  test("no-op if no open incident exists", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // Should not throw
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(0);
  });

  test("does not resolve already resolved incident", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidentsBefore = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, {
        monitorId,
      });
    const resolvedAtBefore = incidentsBefore[0].resolvedAt;

    // Try to resolve again
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidentsAfter = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, {
        monitorId,
      });
    // resolvedAt should not change (no incident to resolve)
    expect(incidentsAfter[0].resolvedAt).toEqual(resolvedAtBefore);
  });
});

describe("user settings integration", () => {
  test("user settings are created via update", async () => {
    const t = setupBackend();

    await setupUserSettings(t, { throttleMinutes: 15 });

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings).toBeDefined();
    expect(settings!.throttleMinutes).toBe(15);
    expect(settings!.emailNotifications).toBe(true);
  });

  test("settings are user-isolated", async () => {
    const t = setupBackend();

    await setupUserSettings(t, { throttleMinutes: 10 });

    // Query for a different user
    const otherSettings = await t.query(internal.userSettings.getByUserId, {
      userId: "other_user",
    });

    expect(otherSettings).toBeNull();
  });

  test("getByUserId returns null for user without settings", async () => {
    const t = setupBackend();

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: "nonexistent_user",
    });

    expect(settings).toBeNull();
  });
});

describe("notification preferences via settings", () => {
  test("emailNotifications can be disabled", async () => {
    const t = setupBackend();

    await setupUserSettings(t, { emailNotifications: false });

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings!.emailNotifications).toBe(false);
  });

  test("notifyOnDown can be disabled", async () => {
    const t = setupBackend();

    await setupUserSettings(t, { notifyOnDown: false });

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings!.notifyOnDown).toBe(false);
  });

  test("notifyOnRecovery can be disabled", async () => {
    const t = setupBackend();

    await setupUserSettings(t, { notifyOnRecovery: false });

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings!.notifyOnRecovery).toBe(false);
  });

  test("throttleMinutes can be configured", async () => {
    const t = setupBackend();

    await setupUserSettings(t, { throttleMinutes: 30 });

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings!.throttleMinutes).toBe(30);
  });

  test("webhookUrl can be set", async () => {
    const t = setupBackend();

    await t.withIdentity(user).mutation(api.userSettings.update, {
      webhookUrl: "https://example.com/webhook",
    });

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings!.webhookUrl).toBe("https://example.com/webhook");
  });
});

describe("incident lifecycle tracking", () => {
  test("incident timestamps are properly set", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    const beforeCreate = Date.now();
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents[0].startedAt).toBeGreaterThanOrEqual(beforeCreate);
    expect(incidents[0].resolvedAt).toBeUndefined();
  });

  test("resolution timestamp is set on resolve", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);
    const beforeResolve = Date.now();
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents[0].resolvedAt).toBeGreaterThanOrEqual(beforeResolve);
  });

  test("multiple incidents are tracked separately", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);

    // First incident cycle
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);
    await t.mutation(internal.monitoring.resolveIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Second incident cycle
    await t.mutation(internal.monitoring.openIncident, { monitorId });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, { monitorId });
    expect(incidents).toHaveLength(2);

    const resolved = incidents.filter((i) => i.status === "resolved");
    const investigating = incidents.filter((i) => i.status === "investigating");
    expect(resolved).toHaveLength(1);
    expect(investigating).toHaveLength(1);
  });
});

describe("monitor-incident relationship", () => {
  test("incident references correct monitor", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    const incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });

    expect(incident!.monitorId).toEqual(monitorId);
  });

  test("incidents are isolated per monitor", async () => {
    const t = setupBackend();
    const monitor1Id = await createTestMonitor(t, { name: "Monitor 1" });
    const monitor2Id = await createTestMonitor(t, { name: "Monitor 2" });

    await t.mutation(internal.monitoring.openIncident, {
      monitorId: monitor1Id,
    });
    await t.finishAllScheduledFunctions(advanceTimers);
    await t.mutation(internal.monitoring.openIncident, {
      monitorId: monitor2Id,
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    const incidents1 = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, {
        monitorId: monitor1Id,
      });
    const incidents2 = await t
      .withIdentity(user)
      .query(api.incidents.getForMonitor, {
        monitorId: monitor2Id,
      });

    expect(incidents1).toHaveLength(1);
    expect(incidents2).toHaveLength(1);
    expect(incidents1[0].title).toBe("Monitor 1 is down");
    expect(incidents2[0].title).toBe("Monitor 2 is down");
  });
});

describe("sendIncidentNotification throttling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("blocks re-notification within throttle window", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Set up user settings with 5 minute throttle
    await setupUserSettings(t, { throttleMinutes: 5 });

    // Mark incident as notified 1 minute ago (within 5 min throttle)
    const oneMinuteAgo = Date.now() - 60 * 1000;
    await t.mutation(internal.notifications.markNotified, {
      incidentId,
    });
    // Override notifiedAt to be 1 minute ago by patching directly
    await t.mutation(internal.notifications.testSetNotifiedAt, {
      incidentId,
      notifiedAt: oneMinuteAgo,
    });

    // Clear mocks after setup
    vi.clearAllMocks();

    // Try to send another "opened" notification
    await t.action(internal.notifications.sendIncidentNotification, {
      incidentId,
      type: "opened",
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Email should NOT have been called (throttled)
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test("allows notification after throttle window expires", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Set up user settings with 5 minute throttle
    await setupUserSettings(t, { throttleMinutes: 5 });

    // Mark incident as notified 6 minutes ago (past 5 min throttle)
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
    await t.mutation(internal.notifications.markNotified, {
      incidentId,
    });
    await t.mutation(internal.notifications.testSetNotifiedAt, {
      incidentId,
      notifiedAt: sixMinutesAgo,
    });

    // Clear mocks after setup
    vi.clearAllMocks();

    // Try to send another "opened" notification
    await t.action(internal.notifications.sendIncidentNotification, {
      incidentId,
      type: "opened",
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Email SHOULD have been called (throttle expired)
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  test("throttling only applies to 'opened' notifications", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Set up user settings with 5 minute throttle
    await setupUserSettings(t, { throttleMinutes: 5 });

    // Mark incident as notified 1 minute ago (within throttle)
    const oneMinuteAgo = Date.now() - 60 * 1000;
    await t.mutation(internal.notifications.markNotified, {
      incidentId,
    });
    await t.mutation(internal.notifications.testSetNotifiedAt, {
      incidentId,
      notifiedAt: oneMinuteAgo,
    });

    // Clear mocks after setup
    vi.clearAllMocks();

    // Send "resolved" notification - should NOT be throttled
    await t.action(internal.notifications.sendIncidentNotification, {
      incidentId,
      type: "resolved",
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Email SHOULD have been called (resolved ignores throttle)
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  test("allows first notification when notifiedAt is undefined", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Set up user settings with 5 minute throttle
    await setupUserSettings(t, { throttleMinutes: 5 });

    // Do NOT mark as notified - notifiedAt is undefined
    const incident = await t.query(internal.notifications.getIncident, {
      incidentId,
    });
    expect(incident!.notifiedAt).toBeUndefined();

    // Clear mocks after setup
    vi.clearAllMocks();

    // Send "opened" notification - should NOT be throttled
    await t.action(internal.notifications.sendIncidentNotification, {
      incidentId,
      type: "opened",
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Email SHOULD have been called (first notification)
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  test("respects custom throttle minutes setting", async () => {
    const t = setupBackend();
    const monitorId = await createTestMonitor(t);
    const incidentId = await createTestIncident(t, monitorId);

    // Set up user settings with 30 minute throttle
    await setupUserSettings(t, { throttleMinutes: 30 });

    // Mark incident as notified 20 minutes ago (within 30 min throttle)
    const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;
    await t.mutation(internal.notifications.markNotified, {
      incidentId,
    });
    await t.mutation(internal.notifications.testSetNotifiedAt, {
      incidentId,
      notifiedAt: twentyMinutesAgo,
    });

    // Clear mocks after setup
    vi.clearAllMocks();

    // Try to send another "opened" notification
    await t.action(internal.notifications.sendIncidentNotification, {
      incidentId,
      type: "opened",
    });
    await t.finishAllScheduledFunctions(advanceTimers);

    // Email should NOT have been called (still within 30 min throttle)
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
