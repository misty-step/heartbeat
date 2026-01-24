import { test, expect, describe } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend, createTestSubscription } from "../../tests/convex";

const user = {
  name: "Test User",
  subject: "user_test",
  issuer: "clerk",
  email: "test@example.com",
};

const otherUser = {
  name: "Other User",
  subject: "user_other",
  issuer: "clerk",
  email: "other@example.com",
};

describe("getSubscription", () => {
  test("returns null for unauthenticated user", async () => {
    const t = setupBackend();

    const subscription = await t.query(api.subscriptions.getSubscription, {});
    expect(subscription).toBeNull();
  });

  test("returns null when user has no subscription", async () => {
    const t = setupBackend();

    const subscription = await t
      .withIdentity(user)
      .query(api.subscriptions.getSubscription, {});
    expect(subscription).toBeNull();
  });

  test("returns subscription for user with active subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "pulse" });

    const subscription = await t
      .withIdentity(user)
      .query(api.subscriptions.getSubscription, {});
    expect(subscription).not.toBeNull();
    expect(subscription!.tier).toBe("pulse");
    expect(subscription!.status).toBe("active");
  });

  test("returns subscription regardless of status", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "expired" });

    const subscription = await t
      .withIdentity(user)
      .query(api.subscriptions.getSubscription, {});
    expect(subscription).not.toBeNull();
    expect(subscription!.status).toBe("expired");
  });
});

describe("hasActiveSubscription", () => {
  test("returns false for unauthenticated user", async () => {
    const t = setupBackend();

    const hasActive = await t.query(
      api.subscriptions.hasActiveSubscription,
      {},
    );
    expect(hasActive).toBe(false);
  });

  test("returns false when user has no subscription", async () => {
    const t = setupBackend();

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(false);
  });

  test("returns true for active subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "active" });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(true);
  });

  test("returns true for trialing subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "trialing" });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(true);
  });

  test("returns true for past_due subscription within paid period", async () => {
    const t = setupBackend();
    // Default currentPeriodEnd is 30 days in future
    await createTestSubscription(t, user.subject, { status: "past_due" });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(true);
  });

  test("returns false for past_due subscription after paid period expires", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, {
      status: "past_due",
      currentPeriodEnd: Date.now() - 1000, // Expired
    });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(false);
  });

  test("returns true for canceled subscription within paid period", async () => {
    const t = setupBackend();
    // Default currentPeriodEnd is 30 days in future
    await createTestSubscription(t, user.subject, { status: "canceled" });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(true);
  });

  test("returns false for canceled subscription after paid period expires", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, {
      status: "canceled",
      currentPeriodEnd: Date.now() - 1000, // Expired
    });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(false);
  });

  test("returns false for expired subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "expired" });

    const hasActive = await t
      .withIdentity(user)
      .query(api.subscriptions.hasActiveSubscription, {});
    expect(hasActive).toBe(false);
  });
});

describe("getUsage", () => {
  test("returns null for unauthenticated user", async () => {
    const t = setupBackend();

    const usage = await t.query(api.subscriptions.getUsage, {});
    expect(usage).toBeNull();
  });

  test("returns null when user has no subscription", async () => {
    const t = setupBackend();

    const usage = await t
      .withIdentity(user)
      .query(api.subscriptions.getUsage, {});
    expect(usage).toBeNull();
  });

  test("returns null for inactive subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "expired" });

    const usage = await t
      .withIdentity(user)
      .query(api.subscriptions.getUsage, {});
    expect(usage).toBeNull();
  });

  test("returns usage stats for pulse tier", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "pulse" });

    const usage = await t
      .withIdentity(user)
      .query(api.subscriptions.getUsage, {});
    expect(usage).not.toBeNull();
    expect(usage!.tier).toBe("pulse");
    expect(usage!.monitors).toBe(0);
    expect(usage!.monitorLimit).toBe(15);
    expect(usage!.minInterval).toBe(180);
  });

  test("returns usage stats for vital tier", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "vital" });

    const usage = await t
      .withIdentity(user)
      .query(api.subscriptions.getUsage, {});
    expect(usage).not.toBeNull();
    expect(usage!.tier).toBe("vital");
    expect(usage!.monitorLimit).toBe(75);
    expect(usage!.minInterval).toBe(60);
  });

  test("counts monitors for user", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "vital" });

    // Create a monitor
    await t.withIdentity(user).mutation(api.monitors.create, {
      name: "Test Monitor",
      url: "https://example.com",
      method: "GET",
      interval: 60,
      timeout: 10000,
      projectSlug: "test-project",
    });

    const usage = await t
      .withIdentity(user)
      .query(api.subscriptions.getUsage, {});
    expect(usage!.monitors).toBe(1);
  });
});

describe("canCreateMonitor (internal)", () => {
  test("returns not allowed when no subscription", async () => {
    const t = setupBackend();

    const result = await t.query(internal.subscriptions.canCreateMonitor, {
      userId: user.subject,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("No active subscription");
  });

  test("returns not allowed for inactive subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "expired" });

    const result = await t.query(internal.subscriptions.canCreateMonitor, {
      userId: user.subject,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("not active");
  });

  test("returns allowed for active subscription under limit", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "vital" });

    const result = await t.query(internal.subscriptions.canCreateMonitor, {
      userId: user.subject,
    });
    expect(result.allowed).toBe(true);
  });

  test("returns not allowed when at monitor limit", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "pulse" }); // 15 monitors

    // Create 15 monitors to hit limit
    for (let i = 0; i < 15; i++) {
      await t.withIdentity(user).mutation(api.monitors.create, {
        name: `Monitor ${i}`,
        url: `https://example${i}.com`,
        method: "GET",
        interval: 300,
        timeout: 10000,
        projectSlug: "test-project",
      });
    }

    const result = await t.query(internal.subscriptions.canCreateMonitor, {
      userId: user.subject,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("limit of 15");
  });
});

describe("getTierLimits (internal)", () => {
  test("returns restrictive limits when no subscription", async () => {
    const t = setupBackend();

    const limits = await t.query(internal.subscriptions.getTierLimits, {
      userId: user.subject,
    });
    expect(limits.monitors).toBe(0);
    expect(limits.minInterval).toBe(3600);
    expect(limits.statusPages).toBe(0);
  });

  test("returns restrictive limits for inactive subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "expired" });

    const limits = await t.query(internal.subscriptions.getTierLimits, {
      userId: user.subject,
    });
    expect(limits.monitors).toBe(0);
  });

  test("returns pulse tier limits", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "pulse" });

    const limits = await t.query(internal.subscriptions.getTierLimits, {
      userId: user.subject,
    });
    expect(limits.monitors).toBe(15);
    expect(limits.minInterval).toBe(180);
    expect(limits.statusPages).toBe(1);
  });

  test("returns vital tier limits", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "vital" });

    const limits = await t.query(internal.subscriptions.getTierLimits, {
      userId: user.subject,
    });
    expect(limits.monitors).toBe(75);
    expect(limits.minInterval).toBe(60);
    expect(limits.statusPages).toBe(5);
  });
});

describe("getByStripeSubscriptionId (internal)", () => {
  test("returns null when not found", async () => {
    const t = setupBackend();

    const subscription = await t.query(
      internal.subscriptions.getByStripeSubscriptionId,
      { stripeSubscriptionId: "sub_nonexistent" },
    );
    expect(subscription).toBeNull();
  });

  test("returns subscription by Stripe ID", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    const subscription = await t.query(
      internal.subscriptions.getByStripeSubscriptionId,
      { stripeSubscriptionId: `sub_test_${user.subject}` },
    );
    expect(subscription).not.toBeNull();
    expect(subscription!.userId).toBe(user.subject);
  });
});

describe("getByStripeCustomerId (internal)", () => {
  test("returns null when not found", async () => {
    const t = setupBackend();

    const subscription = await t.query(
      internal.subscriptions.getByStripeCustomerId,
      { stripeCustomerId: "cus_nonexistent" },
    );
    expect(subscription).toBeNull();
  });

  test("returns subscription by customer ID", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    const subscription = await t.query(
      internal.subscriptions.getByStripeCustomerId,
      { stripeCustomerId: `cus_test_${user.subject}` },
    );
    expect(subscription).not.toBeNull();
    expect(subscription!.userId).toBe(user.subject);
  });
});

describe("getByUserId (internal)", () => {
  test("returns null when not found", async () => {
    const t = setupBackend();

    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: "user_nonexistent",
    });
    expect(subscription).toBeNull();
  });

  test("returns subscription by user ID", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "pulse" });

    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: user.subject,
    });
    expect(subscription).not.toBeNull();
    expect(subscription!.tier).toBe("pulse");
  });
});

describe("createSubscription (internal)", () => {
  test("creates new subscription", async () => {
    const t = setupBackend();
    const now = Date.now();

    await t.mutation(internal.subscriptions.createSubscription, {
      userId: user.subject,
      stripeCustomerId: "cus_new",
      stripeSubscriptionId: "sub_new",
      tier: "vital",
      status: "trialing",
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      trialEnd: now + 14 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
    });

    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: user.subject,
    });
    expect(subscription).not.toBeNull();
    expect(subscription!.tier).toBe("vital");
    expect(subscription!.status).toBe("trialing");
    expect(subscription!.stripeSubscriptionId).toBe("sub_new");
  });

  test("updates existing subscription instead of creating duplicate", async () => {
    const t = setupBackend();
    const now = Date.now();

    // Create initial subscription
    await createTestSubscription(t, user.subject, { tier: "pulse" });

    // Try to create another - should update existing
    await t.mutation(internal.subscriptions.createSubscription, {
      userId: user.subject,
      stripeCustomerId: "cus_updated",
      stripeSubscriptionId: "sub_updated",
      tier: "vital",
      status: "active",
      currentPeriodEnd: now + 60 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
    });

    // Should still only have one subscription
    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: user.subject,
    });
    expect(subscription!.tier).toBe("vital");
    expect(subscription!.stripeSubscriptionId).toBe("sub_updated");
  });
});

describe("updateSubscription (internal)", () => {
  test("updates subscription fields", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, {
      tier: "pulse",
      status: "trialing",
    });

    await t.mutation(internal.subscriptions.updateSubscription, {
      stripeSubscriptionId: `sub_test_${user.subject}`,
      tier: "vital",
      status: "active",
    });

    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: user.subject,
    });
    expect(subscription!.tier).toBe("vital");
    expect(subscription!.status).toBe("active");
  });

  test("returns null when subscription not found", async () => {
    const t = setupBackend();

    const result = await t.mutation(internal.subscriptions.updateSubscription, {
      stripeSubscriptionId: "sub_nonexistent",
      status: "active",
    });

    expect(result).toBeNull();
  });

  test("updates only provided fields", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, {
      tier: "pulse",
      status: "active",
    });

    await t.mutation(internal.subscriptions.updateSubscription, {
      stripeSubscriptionId: `sub_test_${user.subject}`,
      cancelAtPeriodEnd: true,
    });

    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: user.subject,
    });
    expect(subscription!.tier).toBe("pulse"); // Unchanged
    expect(subscription!.status).toBe("active"); // Unchanged
    expect(subscription!.cancelAtPeriodEnd).toBe(true); // Updated
  });
});

describe("expireSubscription (internal)", () => {
  test("marks subscription as expired", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { status: "active" });

    await t.mutation(internal.subscriptions.expireSubscription, {
      stripeSubscriptionId: `sub_test_${user.subject}`,
    });

    const subscription = await t.query(internal.subscriptions.getByUserId, {
      userId: user.subject,
    });
    expect(subscription!.status).toBe("expired");
  });

  test("returns null when subscription not found", async () => {
    const t = setupBackend();

    const result = await t.mutation(internal.subscriptions.expireSubscription, {
      stripeSubscriptionId: "sub_nonexistent",
    });

    expect(result).toBeNull();
  });
});

describe("subscription isolation", () => {
  test("users only see their own subscriptions", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "pulse" });
    await createTestSubscription(t, otherUser.subject, { tier: "vital" });

    const userSub = await t
      .withIdentity(user)
      .query(api.subscriptions.getSubscription, {});
    const otherSub = await t
      .withIdentity(otherUser)
      .query(api.subscriptions.getSubscription, {});

    expect(userSub!.tier).toBe("pulse");
    expect(otherSub!.tier).toBe("vital");
  });

  test("usage is isolated per user", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject, { tier: "vital" });
    await createTestSubscription(t, otherUser.subject, { tier: "vital" });

    // Create monitors for first user
    for (let i = 0; i < 3; i++) {
      await t.withIdentity(user).mutation(api.monitors.create, {
        name: `User Monitor ${i}`,
        url: `https://user${i}.com`,
        method: "GET",
        interval: 60,
        timeout: 10000,
        projectSlug: "user-project",
      });
    }

    // Create monitor for other user
    await t.withIdentity(otherUser).mutation(api.monitors.create, {
      name: "Other Monitor",
      url: "https://other.com",
      method: "GET",
      interval: 60,
      timeout: 10000,
      projectSlug: "other-project",
    });

    const userUsage = await t
      .withIdentity(user)
      .query(api.subscriptions.getUsage, {});
    const otherUsage = await t
      .withIdentity(otherUser)
      .query(api.subscriptions.getUsage, {});

    expect(userUsage!.monitors).toBe(3);
    expect(otherUsage!.monitors).toBe(1);
  });
});

describe("Stripe webhook idempotency", () => {
  test("isEventProcessed returns false for new event", async () => {
    const t = setupBackend();

    const result = await t.query(internal.subscriptions.isEventProcessed, {
      eventId: "evt_new_event",
    });
    expect(result).toBe(false);
  });

  test("markEventProcessed creates event record", async () => {
    const t = setupBackend();

    await t.mutation(internal.subscriptions.markEventProcessed, {
      eventId: "evt_test_123",
    });

    const isProcessed = await t.query(internal.subscriptions.isEventProcessed, {
      eventId: "evt_test_123",
    });
    expect(isProcessed).toBe(true);
  });

  test("isEventProcessed returns true after event is marked", async () => {
    const t = setupBackend();

    // Initially not processed
    const before = await t.query(internal.subscriptions.isEventProcessed, {
      eventId: "evt_test_456",
    });
    expect(before).toBe(false);

    // Mark as processed
    await t.mutation(internal.subscriptions.markEventProcessed, {
      eventId: "evt_test_456",
    });

    // Now processed
    const after = await t.query(internal.subscriptions.isEventProcessed, {
      eventId: "evt_test_456",
    });
    expect(after).toBe(true);
  });

  test("markEventProcessed is idempotent (handles duplicates)", async () => {
    const t = setupBackend();

    // Mark twice - should not throw
    await t.mutation(internal.subscriptions.markEventProcessed, {
      eventId: "evt_duplicate",
    });
    await t.mutation(internal.subscriptions.markEventProcessed, {
      eventId: "evt_duplicate",
    });

    const isProcessed = await t.query(internal.subscriptions.isEventProcessed, {
      eventId: "evt_duplicate",
    });
    expect(isProcessed).toBe(true);
  });

  test("cleanupOldEvents removes events older than 7 days", async () => {
    const t = setupBackend();
    const now = Date.now();
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

    // Manually insert an old event (bypassing the mutation to set old timestamp)
    await t.run(async (ctx) => {
      await ctx.db.insert("stripeEvents", {
        eventId: "evt_old",
        processedAt: eightDaysAgo,
      });
      await ctx.db.insert("stripeEvents", {
        eventId: "evt_recent",
        processedAt: now,
      });
    });

    // Run cleanup
    const result = await t.mutation(
      internal.subscriptions.cleanupOldEvents,
      {},
    );
    expect(result.deleted).toBe(1);

    // Old event should be gone
    const oldProcessed = await t.query(
      internal.subscriptions.isEventProcessed,
      {
        eventId: "evt_old",
      },
    );
    expect(oldProcessed).toBe(false);

    // Recent event should still exist
    const recentProcessed = await t.query(
      internal.subscriptions.isEventProcessed,
      { eventId: "evt_recent" },
    );
    expect(recentProcessed).toBe(true);
  });
});
