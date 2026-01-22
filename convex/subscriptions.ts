import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";

/**
 * Tier configuration (mirrored from lib/tiers.ts for Convex runtime)
 */
const TIERS = {
  pulse: {
    monitors: 15,
    minInterval: 180,
    statusPages: 1,
  },
  vital: {
    monitors: 75,
    minInterval: 60,
    statusPages: 5,
  },
} as const;

const TRIAL_TIER = "vital" as const;

type TierName = keyof typeof TIERS;

/**
 * Check if a subscription status grants active access.
 */
function isActiveStatus(
  status: "trialing" | "active" | "past_due" | "canceled" | "expired",
): boolean {
  return status === "trialing" || status === "active";
}

/**
 * Get the current user's subscription.
 */
export const getSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

/**
 * Check if the current user has an active subscription.
 */
export const hasActiveSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!subscription) {
      return false;
    }

    return isActiveStatus(subscription.status);
  },
});

/**
 * Get usage stats for the current user.
 */
export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!subscription || !isActiveStatus(subscription.status)) {
      return null;
    }

    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const tier = TIERS[subscription.tier];

    return {
      tier: subscription.tier,
      monitors: monitors.length,
      monitorLimit: tier.monitors,
      minInterval: tier.minInterval,
    };
  },
});

/**
 * Internal query to check if user can create a monitor.
 */
export const canCreateMonitor = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) {
      return { allowed: false, reason: "No active subscription" };
    }

    if (!isActiveStatus(subscription.status)) {
      return {
        allowed: false,
        reason: "Your subscription is not active. Please update your billing.",
      };
    }

    const tier = TIERS[subscription.tier];
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (monitors.length >= tier.monitors) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${tier.monitors} monitors. Upgrade to add more.`,
      };
    }

    return { allowed: true };
  },
});

/**
 * Internal query to get tier limits for a user.
 */
export const getTierLimits = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription || !isActiveStatus(subscription.status)) {
      // No subscription = no access, return most restrictive
      return {
        monitors: 0,
        minInterval: 3600,
        statusPages: 0,
      };
    }

    return TIERS[subscription.tier];
  },
});

/**
 * Internal query to get subscription by Stripe subscription ID.
 */
export const getByStripeSubscriptionId = internalQuery({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
  },
});

/**
 * Internal query to get subscription by Stripe customer ID.
 */
export const getByStripeCustomerId = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId),
      )
      .first();
  },
});

/**
 * Internal query to get subscription by user ID.
 */
export const getByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Create a subscription from Stripe webhook.
 * Note: Exposed as public mutation for HTTP webhook access.
 * Security: Webhook signature verification happens in the API route.
 */
export const createSubscription = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists for this user
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing instead of creating duplicate
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        tier: args.tier,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        trialEnd: args.trialEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("subscriptions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update subscription from Stripe webhook.
 * Note: Exposed as public mutation for HTTP webhook access.
 * Security: Webhook signature verification happens in the API route.
 */
export const updateSubscription = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    tier: v.optional(v.union(v.literal("pulse"), v.literal("vital"))),
    status: v.optional(
      v.union(
        v.literal("trialing"),
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("expired"),
      ),
    ),
    currentPeriodEnd: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    if (!subscription) {
      console.error(
        `Subscription not found for Stripe ID: ${args.stripeSubscriptionId}`,
      );
      return null;
    }

    const { stripeSubscriptionId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );

    await ctx.db.patch(subscription._id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return subscription._id;
  },
});

/**
 * Mark subscription as expired from Stripe webhook.
 * Note: Exposed as public mutation for HTTP webhook access.
 * Security: Webhook signature verification happens in the API route.
 */
export const expireSubscription = mutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    if (!subscription) {
      console.error(
        `Subscription not found for Stripe ID: ${args.stripeSubscriptionId}`,
      );
      return null;
    }

    await ctx.db.patch(subscription._id, {
      status: "expired",
      updatedAt: Date.now(),
    });

    return subscription._id;
  },
});
