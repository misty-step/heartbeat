import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  monitors: defineTable({
    name: v.string(),
    url: v.string(),
    method: v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("HEAD"),
      v.literal("PUT"),
      v.literal("DELETE"),
      v.literal("PATCH"),
    ),
    interval: v.union(
      v.literal(60),
      v.literal(120),
      v.literal(300),
      v.literal(600),
      v.literal(1800),
      v.literal(3600),
    ),
    timeout: v.number(),
    expectedStatusCode: v.optional(v.number()),
    expectedBodyContains: v.optional(v.string()),
    headers: v.optional(
      v.array(v.object({ key: v.string(), value: v.string() })),
    ),
    body: v.optional(v.string()),
    enabled: v.boolean(),
    projectSlug: v.string(),
    statusSlug: v.optional(v.string()), // optional during migration; enforce in application layer
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))), // optional during migration
    userId: v.string(),
    consecutiveFailures: v.number(),
    lastCheckAt: v.optional(v.number()),
    lastResponseTime: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project_slug", ["projectSlug"])
    .index("by_project_slug_and_visibility", ["projectSlug", "visibility"])
    .index("by_status_slug", ["statusSlug"])
    .index("by_enabled", ["enabled"]),

  checks: defineTable({
    monitorId: v.id("monitors"),
    status: v.union(v.literal("up"), v.literal("down"), v.literal("degraded")),
    statusCode: v.optional(v.number()),
    responseTime: v.number(),
    errorMessage: v.optional(v.string()),
    checkedAt: v.number(),
  })
    .index("by_monitor", ["monitorId", "checkedAt"])
    .index("by_monitor_and_status", ["monitorId", "status", "checkedAt"]),

  incidents: defineTable({
    monitorId: v.id("monitors"),
    status: v.union(
      v.literal("investigating"),
      v.literal("identified"),
      v.literal("resolved"),
    ),
    startedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    title: v.string(),
    description: v.optional(v.string()),
    notifiedAt: v.optional(v.number()),
  })
    .index("by_monitor", ["monitorId", "startedAt"])
    .index("by_status", ["status"]),

  userSettings: defineTable({
    userId: v.string(),
    email: v.string(),
    emailNotifications: v.boolean(),
    notifyOnDown: v.boolean(),
    notifyOnRecovery: v.boolean(),
    webhookUrl: v.optional(v.string()),
    throttleMinutes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  subscriptions: defineTable({
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    tier: v.union(v.literal("pulse"), v.literal("vital")),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired"),
    ),
    currentPeriodEnd: v.number(),
    trialEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    lastStripeEventTimestamp: v.optional(v.number()), // Prevents out-of-order webhook processing
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  // Stripe webhook idempotency tracking
  stripeEvents: defineTable({
    eventId: v.string(), // Stripe event ID (evt_...)
    processedAt: v.number(),
  })
    .index("by_event_id", ["eventId"])
    .index("by_processed_at", ["processedAt"]),
});
