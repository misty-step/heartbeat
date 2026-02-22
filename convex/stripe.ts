"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

type Subscription = {
  _id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  tier: "pulse" | "vital";
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  currentPeriodEnd: number;
  trialEnd?: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
} | null;

const TIERS = {
  pulse: {
    name: "Pulse",
    monitors: 15,
    minInterval: 180,
  },
  vital: {
    name: "Vital",
    monitors: 75,
    minInterval: 60,
  },
} as const;

const TRIAL_DAYS = 14;

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

function getPriceId(tier: "pulse" | "vital", interval: "month" | "year") {
  const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}`;
  const priceId = process.env[envKey]?.trim();
  if (!priceId) {
    throw new Error(`${envKey} is not configured`);
  }
  return priceId;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Create a Stripe Checkout session for subscription.
 */
export const createCheckoutSession = action({
  args: {
    tier: v.union(v.literal("pulse"), v.literal("vital")),
    interval: v.union(v.literal("month"), v.literal("year")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl();
    const priceId = getPriceId(args.tier, args.interval);

    // Check for existing subscription by user ID
    const existingSub: Subscription = await ctx.runQuery(
      internal.subscriptions.getByUserId,
      { userId: identity.subject },
    );

    let customerId: string | undefined;

    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: identity.email || undefined,
        name: identity.name || undefined,
        metadata: {
          userId: identity.subject,
        },
      });
      customerId = customer.id;
    }

    // Calculate trial: honor existing trial if mid-trial, otherwise new 14-day trial
    const TRIAL_DURATION_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let trialConfig:
      | { trial_period_days: number }
      | { trial_end: number }
      | undefined = {
      trial_period_days: TRIAL_DAYS,
    };

    // If user has an existing subscription with remaining trial, honor it
    if (existingSub?.trialEnd && existingSub.trialEnd > now) {
      // Use trial_end timestamp (Stripe expects seconds, not milliseconds)
      trialConfig = { trial_end: Math.floor(existingSub.trialEnd / 1000) };
    } else if (!existingSub) {
      // New user gets full trial
      trialConfig = { trial_period_days: TRIAL_DAYS };
    } else {
      // Existing user with no trial left - omit trial settings entirely
      trialConfig = undefined;
    }

    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          ...(trialConfig ?? {}),
          metadata: {
            userId: identity.subject,
            tier: args.tier,
          },
        },
        success_url: `${baseUrl}/dashboard?checkout=success`,
        cancel_url: `${baseUrl}/pricing?checkout=canceled`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        metadata: {
          userId: identity.subject,
          tier: args.tier,
        },
      });

    return { url: checkoutSession.url };
  },
});

/**
 * Create a Stripe Billing Portal session for subscription management.
 */
export const createBillingPortalSession = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const subscription: Subscription = await ctx.runQuery(
      internal.subscriptions.getByUserId,
      { userId: identity.subject },
    );

    if (!subscription?.stripeCustomerId) {
      throw new Error("No subscription found");
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl();

    const portalSession: Stripe.BillingPortal.Session =
      await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${baseUrl}/dashboard/settings/billing`,
      });

    return { url: portalSession.url };
  },
});

/**
 * Get subscription details from Stripe (for billing page).
 */
export const getStripeSubscriptionDetails = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const subscription: Subscription = await ctx.runQuery(
      internal.subscriptions.getByUserId,
      { userId: identity.subject },
    );

    if (!subscription?.stripeSubscriptionId) {
      return null;
    }

    const stripe = getStripe();

    try {
      const stripeSub: Stripe.Subscription =
        await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
          expand: ["default_payment_method", "latest_invoice"],
        });

      const paymentMethod =
        stripeSub.default_payment_method as Stripe.PaymentMethod | null;
      // In newer Stripe API, current_period_end is on subscription items
      const currentPeriodEnd =
        stripeSub.items.data[0]?.current_period_end ??
        Math.floor(Date.now() / 1000);

      return {
        status: stripeSub.status,
        currentPeriodEnd: currentPeriodEnd * 1000,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialEnd: stripeSub.trial_end ? stripeSub.trial_end * 1000 : null,
        paymentMethod: paymentMethod?.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            }
          : null,
      };
    } catch (error) {
      console.error("Failed to fetch Stripe subscription:", error);
      return null;
    }
  },
});
