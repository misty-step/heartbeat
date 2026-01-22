import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
let _convex: ConvexHttpClient | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, { apiVersion: "2025-12-15.clover" });
  }
  return _stripe;
}

function getConvex(): ConvexHttpClient {
  if (!_convex) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }
    _convex = new ConvexHttpClient(url);
  }
  return _convex;
}

/**
 * Map Stripe subscription status to our status.
 */
function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "trialing" | "active" | "past_due" | "canceled" | "expired" {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "expired";
    default:
      return "expired";
  }
}

/**
 * Extract tier from subscription metadata or price lookup key.
 */
function extractTier(subscription: Stripe.Subscription): "pulse" | "vital" {
  // First try metadata
  const metaTier = subscription.metadata?.tier;
  if (metaTier === "pulse" || metaTier === "vital") {
    return metaTier;
  }

  // Fallback: check price lookup key or product metadata
  const item = subscription.items.data[0];
  if (item?.price?.lookup_key?.includes("vital")) {
    return "vital";
  }

  // Default to pulse
  return "pulse";
}

/**
 * Get current period end from subscription items.
 * In newer Stripe API versions, period is on items, not subscription.
 */
function getCurrentPeriodEnd(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  return item?.current_period_end ?? Math.floor(Date.now() / 1000);
}

/**
 * Handle checkout.session.completed - create or update subscription.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  // Fetch full subscription details
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const tier = extractTier(subscription);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  await getConvex().mutation(api.subscriptions.createSubscription, {
    userId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    tier,
    status: mapStripeStatus(subscription.status),
    currentPeriodEnd: currentPeriodEnd * 1000,
    trialEnd: subscription.trial_end
      ? subscription.trial_end * 1000
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`Created subscription for user ${userId}: ${subscription.id}`);
}

/**
 * Handle subscription updates.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tier = extractTier(subscription);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  await getConvex().mutation(api.subscriptions.updateSubscription, {
    stripeSubscriptionId: subscription.id,
    tier,
    status: mapStripeStatus(subscription.status),
    currentPeriodEnd: currentPeriodEnd * 1000,
    trialEnd: subscription.trial_end
      ? subscription.trial_end * 1000
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`Updated subscription: ${subscription.id}`);
}

/**
 * Handle subscription deletion.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await getConvex().mutation(api.subscriptions.expireSubscription, {
    stripeSubscriptionId: subscription.id,
  });

  console.log(`Expired subscription: ${subscription.id}`);
}

/**
 * Handle invoice payment failure.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // subscription can be string, Subscription, or null
  const sub = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof sub === "string" ? sub : sub?.id;
  if (!subscriptionId) return;

  await getConvex().mutation(api.subscriptions.updateSubscription, {
    stripeSubscriptionId: subscriptionId,
    status: "past_due",
  });

  console.log(`Marked subscription as past_due: ${subscriptionId}`);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook handler error: ${message}`);
    return NextResponse.json(
      { error: `Webhook handler failed: ${message}` },
      { status: 500 },
    );
  }
}
