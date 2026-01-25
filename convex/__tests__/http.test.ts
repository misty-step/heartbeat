import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";
import {
  mapStripeStatus,
  extractTier,
  getCurrentPeriodEnd,
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  type ActionCtx,
} from "../http";

describe("mapStripeStatus", () => {
  it("maps trialing to trialing", () => {
    expect(mapStripeStatus("trialing")).toBe("trialing");
  });

  it("maps active to active", () => {
    expect(mapStripeStatus("active")).toBe("active");
  });

  it("maps past_due to past_due", () => {
    expect(mapStripeStatus("past_due")).toBe("past_due");
  });

  it("maps canceled to canceled", () => {
    expect(mapStripeStatus("canceled")).toBe("canceled");
  });

  it("maps unpaid to canceled", () => {
    expect(mapStripeStatus("unpaid")).toBe("canceled");
  });

  it("maps incomplete to expired", () => {
    expect(mapStripeStatus("incomplete")).toBe("expired");
  });

  it("maps incomplete_expired to expired", () => {
    expect(mapStripeStatus("incomplete_expired")).toBe("expired");
  });

  it("maps paused to expired", () => {
    expect(mapStripeStatus("paused")).toBe("expired");
  });
});

describe("extractTier", () => {
  const createMockSubscription = (
    overrides: Partial<{
      metadata: { tier?: string };
      items: { data: Array<{ price?: { lookup_key?: string } }> };
    }> = {},
  ): Stripe.Subscription => {
    return {
      id: "sub_test",
      object: "subscription",
      metadata: overrides.metadata ?? {},
      items: overrides.items ?? { data: [{}] },
    } as Stripe.Subscription;
  };

  it("extracts pulse tier from metadata", () => {
    const subscription = createMockSubscription({
      metadata: { tier: "pulse" },
    });
    expect(extractTier(subscription)).toBe("pulse");
  });

  it("extracts vital tier from metadata", () => {
    const subscription = createMockSubscription({
      metadata: { tier: "vital" },
    });
    expect(extractTier(subscription)).toBe("vital");
  });

  it("ignores invalid tier in metadata and falls back to price lookup_key", () => {
    const subscription = createMockSubscription({
      metadata: { tier: "invalid" },
      items: { data: [{ price: { lookup_key: "price_vital_monthly" } }] },
    });
    expect(extractTier(subscription)).toBe("vital");
  });

  it("extracts vital from price lookup_key", () => {
    const subscription = createMockSubscription({
      items: { data: [{ price: { lookup_key: "vital_yearly" } }] },
    });
    expect(extractTier(subscription)).toBe("vital");
  });

  it("defaults to pulse when no tier info available", () => {
    const subscription = createMockSubscription({
      metadata: {},
      items: { data: [{ price: { lookup_key: "some_other_key" } }] },
    });
    expect(extractTier(subscription)).toBe("pulse");
  });

  it("defaults to pulse when items array is empty", () => {
    const subscription = createMockSubscription({
      items: { data: [] },
    });
    expect(extractTier(subscription)).toBe("pulse");
  });

  it("defaults to pulse when price is undefined", () => {
    const subscription = createMockSubscription({
      items: { data: [{}] },
    });
    expect(extractTier(subscription)).toBe("pulse");
  });

  it("prefers metadata tier over lookup_key", () => {
    const subscription = createMockSubscription({
      metadata: { tier: "pulse" },
      items: { data: [{ price: { lookup_key: "vital_monthly" } }] },
    });
    expect(extractTier(subscription)).toBe("pulse");
  });
});

describe("getCurrentPeriodEnd", () => {
  const createMockSubscription = (
    currentPeriodEnd?: number,
  ): Stripe.Subscription => {
    return {
      id: "sub_test",
      object: "subscription",
      items: {
        data:
          currentPeriodEnd !== undefined
            ? [{ current_period_end: currentPeriodEnd }]
            : [],
      },
    } as Stripe.Subscription;
  };

  it("extracts current_period_end from subscription item", () => {
    const expectedTimestamp = 1700000000;
    const subscription = createMockSubscription(expectedTimestamp);
    expect(getCurrentPeriodEnd(subscription)).toBe(expectedTimestamp);
  });

  it("falls back to current time when items array is empty", () => {
    const subscription = createMockSubscription();
    subscription.items.data = [];
    const before = Math.floor(Date.now() / 1000);
    const result = getCurrentPeriodEnd(subscription);
    const after = Math.floor(Date.now() / 1000);
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it("falls back to current time when current_period_end is undefined", () => {
    const subscription = {
      id: "sub_test",
      object: "subscription",
      items: { data: [{}] },
    } as Stripe.Subscription;
    const before = Math.floor(Date.now() / 1000);
    const result = getCurrentPeriodEnd(subscription);
    const after = Math.floor(Date.now() / 1000);
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});

// --- Handler function tests ---

// Mock ActionCtx factory
function createMockCtx() {
  return {
    runMutation: vi.fn().mockResolvedValue(undefined),
    runQuery: vi.fn().mockResolvedValue(undefined),
    runAction: vi.fn().mockResolvedValue(undefined),
  } as unknown as ActionCtx;
}

// Mock Stripe client factory
function createMockStripe(
  subscriptionOverrides: Partial<Stripe.Subscription> = {},
) {
  const mockSubscription: Stripe.Subscription = {
    id: "sub_mock123",
    object: "subscription",
    customer: "cus_mock456",
    status: "active",
    metadata: { tier: "pulse" },
    items: { data: [{ current_period_end: 1700000000 }] },
    trial_end: null,
    cancel_at_period_end: false,
    ...subscriptionOverrides,
  } as Stripe.Subscription;

  return {
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue(mockSubscription),
    },
  } as unknown as Stripe;
}

describe("handleCheckoutCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates subscription from checkout session", async () => {
    const ctx = createMockCtx();
    const stripe = createMockStripe();
    const session = {
      id: "cs_test123",
      metadata: { userId: "user_abc" },
      subscription: "sub_mock123",
    } as Stripe.Checkout.Session;

    await handleCheckoutCompleted(ctx, stripe, session, 1700000000000);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_mock123");
    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "user_abc",
        stripeCustomerId: "cus_mock456",
        stripeSubscriptionId: "sub_mock123",
        tier: "pulse",
        status: "active",
        eventTimestamp: 1700000000000,
      }),
    );
  });

  it("handles subscription as object (not string)", async () => {
    const ctx = createMockCtx();
    const stripe = createMockStripe();
    const session = {
      id: "cs_test123",
      metadata: { userId: "user_abc" },
      subscription: { id: "sub_mock123" },
    } as unknown as Stripe.Checkout.Session;

    await handleCheckoutCompleted(ctx, stripe, session, 1700000000000);

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_mock123");
  });

  it("returns early when userId is missing", async () => {
    const ctx = createMockCtx();
    const stripe = createMockStripe();
    const session = {
      id: "cs_test123",
      metadata: {},
      subscription: "sub_mock123",
    } as Stripe.Checkout.Session;

    await handleCheckoutCompleted(ctx, stripe, session, 1700000000000);

    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it("returns early when subscription ID is missing", async () => {
    const ctx = createMockCtx();
    const stripe = createMockStripe();
    const session = {
      id: "cs_test123",
      metadata: { userId: "user_abc" },
      subscription: null,
    } as unknown as Stripe.Checkout.Session;

    await handleCheckoutCompleted(ctx, stripe, session, 1700000000000);

    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it("includes trial_end when present", async () => {
    const ctx = createMockCtx();
    const stripe = createMockStripe({ trial_end: 1700500000 });
    const session = {
      id: "cs_test123",
      metadata: { userId: "user_abc" },
      subscription: "sub_mock123",
    } as Stripe.Checkout.Session;

    await handleCheckoutCompleted(ctx, stripe, session, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        trialEnd: 1700500000000, // Converted to ms
      }),
    );
  });
});

describe("handleSubscriptionUpdated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates subscription with correct fields", async () => {
    const ctx = createMockCtx();
    const subscription = {
      id: "sub_test123",
      status: "active",
      metadata: { tier: "vital" },
      items: { data: [{ current_period_end: 1700000000 }] },
      trial_end: null,
      cancel_at_period_end: false,
    } as Stripe.Subscription;

    await handleSubscriptionUpdated(ctx, subscription, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_test123",
        tier: "vital",
        status: "active",
        currentPeriodEnd: 1700000000000,
        cancelAtPeriodEnd: false,
        eventTimestamp: 1700000000000,
      }),
    );
  });

  it("handles trialing status with trial_end", async () => {
    const ctx = createMockCtx();
    const subscription = {
      id: "sub_test123",
      status: "trialing",
      metadata: {},
      items: { data: [{ current_period_end: 1700000000 }] },
      trial_end: 1700500000,
      cancel_at_period_end: false,
    } as Stripe.Subscription;

    await handleSubscriptionUpdated(ctx, subscription, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "trialing",
        trialEnd: 1700500000000,
      }),
    );
  });

  it("handles cancel_at_period_end flag", async () => {
    const ctx = createMockCtx();
    const subscription = {
      id: "sub_test123",
      status: "active",
      metadata: {},
      items: { data: [{ current_period_end: 1700000000 }] },
      trial_end: null,
      cancel_at_period_end: true,
    } as Stripe.Subscription;

    await handleSubscriptionUpdated(ctx, subscription, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        cancelAtPeriodEnd: true,
      }),
    );
  });
});

describe("handleSubscriptionDeleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expires subscription", async () => {
    const ctx = createMockCtx();
    const subscription = {
      id: "sub_test123",
      status: "canceled",
    } as Stripe.Subscription;

    await handleSubscriptionDeleted(ctx, subscription, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_test123",
        eventTimestamp: 1700000000000,
      }),
    );
  });
});

describe("handleInvoicePaymentFailed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks subscription as past_due using legacy subscription field", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      subscription: "sub_test456",
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentFailed(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_test456",
        status: "past_due",
        eventTimestamp: 1700000000000,
      }),
    );
  });

  it("marks subscription as past_due using parent.subscription_details", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      parent: {
        subscription_details: {
          subscription: "sub_test789",
        },
      },
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentFailed(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_test789",
      }),
    );
  });

  it("handles subscription as object in parent.subscription_details", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      parent: {
        subscription_details: {
          subscription: { id: "sub_obj789" },
        },
      },
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentFailed(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_obj789",
      }),
    );
  });

  it("returns early when no subscription ID found", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentFailed(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).not.toHaveBeenCalled();
  });
});

describe("handleInvoicePaymentSucceeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates subscription with new period end", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      subscription: "sub_test456",
      lines: {
        data: [
          {
            parent: { type: "subscription_item_details" },
            period: { end: 1705000000 },
          },
        ],
      },
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentSucceeded(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_test456",
        status: "active",
        currentPeriodEnd: 1705000000000, // Converted to ms
        eventTimestamp: 1700000000000,
      }),
    );
  });

  it("returns early when no subscription ID found", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      lines: { data: [] },
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentSucceeded(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it("returns early when no period end in line items", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      subscription: "sub_test456",
      lines: {
        data: [
          {
            parent: { type: "other_type" },
          },
        ],
      },
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentSucceeded(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it("uses parent.subscription_details for subscription ID", async () => {
    const ctx = createMockCtx();
    const invoice = {
      id: "in_test123",
      parent: {
        subscription_details: {
          subscription: "sub_new_api",
        },
      },
      lines: {
        data: [
          {
            parent: { type: "subscription_item_details" },
            period: { end: 1705000000 },
          },
        ],
      },
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentSucceeded(ctx, invoice, 1700000000000);

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stripeSubscriptionId: "sub_new_api",
      }),
    );
  });
});
