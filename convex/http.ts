import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

/**
 * Stripe webhook handler - the ONLY entry point for subscription mutations.
 *
 * This is a "deep module" per Ousterhout: simple interface (one HTTP endpoint),
 * complex implementation hidden (signature verification, event routing, mutations).
 *
 * Security: Stripe signature verification happens HERE, not in a Next.js route
 * that could be bypassed. All subscription mutations are internal.
 */
const stripeWebhook = httpAction(async (ctx, request) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripeSecretKey || !webhookSecret) {
    console.error("Stripe environment variables not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-12-15.clover",
  });

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  console.log(`Received Stripe webhook: ${event.type}`);
  const eventTimestamp = event.created * 1000;

  // Idempotency check: skip if already processed
  const alreadyProcessed = await ctx.runQuery(
    internal.subscriptions.isEventProcessed,
    { eventId: event.id },
  );
  if (alreadyProcessed) {
    console.log(`Skipping duplicate event: ${event.id}`);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          ctx,
          stripe,
          event.data.object as Stripe.Checkout.Session,
          eventTimestamp,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          ctx,
          event.data.object as Stripe.Subscription,
          eventTimestamp,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          ctx,
          event.data.object as Stripe.Subscription,
          eventTimestamp,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          ctx,
          event.data.object as Stripe.Invoice,
          eventTimestamp,
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          ctx,
          event.data.object as Stripe.Invoice,
          eventTimestamp,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed after successful handling
    await ctx.runMutation(internal.subscriptions.markEventProcessed, {
      eventId: event.id,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook handler error: ${message}`);
    return new Response(`Webhook handler failed: ${message}`, { status: 500 });
  }
});

// --- Utility functions (exported for testing) ---

type ActionCtx = Parameters<Parameters<typeof httpAction>[0]>[0];

export function mapStripeStatus(
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
    default:
      return "expired";
  }
}

export function extractTier(
  subscription: Stripe.Subscription,
): "pulse" | "vital" {
  const metaTier = subscription.metadata?.tier;
  if (metaTier === "pulse" || metaTier === "vital") return metaTier;

  const item = subscription.items.data[0];
  if (item?.price?.lookup_key?.includes("vital")) return "vital";

  return "pulse";
}

export function getCurrentPeriodEnd(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  return item?.current_period_end ?? Math.floor(Date.now() / 1000);
}

async function handleCheckoutCompleted(
  ctx: ActionCtx,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventTimestamp: number,
) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tier = extractTier(subscription);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  await ctx.runMutation(internal.subscriptions.createSubscription, {
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
    eventTimestamp,
  });

  console.log(`Created subscription for user ${userId}: ${subscription.id}`);
}

async function handleSubscriptionUpdated(
  ctx: ActionCtx,
  subscription: Stripe.Subscription,
  eventTimestamp: number,
) {
  const tier = extractTier(subscription);
  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    stripeSubscriptionId: subscription.id,
    tier,
    status: mapStripeStatus(subscription.status),
    currentPeriodEnd: currentPeriodEnd * 1000,
    trialEnd: subscription.trial_end
      ? subscription.trial_end * 1000
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    eventTimestamp,
  });

  console.log(`Updated subscription: ${subscription.id}`);
}

async function handleSubscriptionDeleted(
  ctx: ActionCtx,
  subscription: Stripe.Subscription,
  eventTimestamp: number,
) {
  await ctx.runMutation(internal.subscriptions.expireSubscription, {
    stripeSubscriptionId: subscription.id,
    eventTimestamp,
  });

  console.log(`Expired subscription: ${subscription.id}`);
}

async function handleInvoicePaymentFailed(
  ctx: ActionCtx,
  invoice: Stripe.Invoice,
  eventTimestamp: number,
) {
  // invoice.subscription for older invoices, parent.subscription_details for June 2023+
  const sub =
    (
      invoice as Stripe.Invoice & {
        subscription?: Stripe.Subscription | string | null;
      }
    ).subscription ?? invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof sub === "string" ? sub : sub?.id;
  if (!subscriptionId) return;

  await ctx.runMutation(internal.subscriptions.updateSubscription, {
    stripeSubscriptionId: subscriptionId,
    status: "past_due",
    eventTimestamp,
  });

  console.log(`Marked subscription as past_due: ${subscriptionId}`);
}

async function handleInvoicePaymentSucceeded(
  ctx: ActionCtx,
  invoice: Stripe.Invoice,
  eventTimestamp: number,
) {
  // invoice.subscription for older invoices, parent.subscription_details for June 2023+
  const sub =
    (
      invoice as Stripe.Invoice & {
        subscription?: Stripe.Subscription | string | null;
      }
    ).subscription ?? invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof sub === "string" ? sub : sub?.id;
  if (!subscriptionId) return;

  // Get the period end from the invoice lines (subscription renewal)
  const lineItem = invoice.lines?.data?.find(
    (line) => line.parent?.type === "subscription_item_details",
  );
  const periodEnd = lineItem?.period?.end;

  if (periodEnd) {
    await ctx.runMutation(internal.subscriptions.updateSubscription, {
      stripeSubscriptionId: subscriptionId,
      status: "active",
      currentPeriodEnd: periodEnd * 1000, // Convert to milliseconds
      eventTimestamp,
    });

    console.log(
      `Updated subscription period end after payment: ${subscriptionId}`,
    );
  }
}

// --- HTTP Router ---

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: stripeWebhook,
});

export default http;
