import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "../_generated/api";
import { setupBackend, createTestSubscription } from "../../tests/convex";

// Mock Stripe SDK
const mockCheckoutSessionCreate = vi.fn();
const mockCustomersCreate = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

// Create a proper mock class for Stripe
class MockStripe {
  checkout = {
    sessions: {
      create: mockCheckoutSessionCreate,
    },
  };
  customers = {
    create: mockCustomersCreate,
  };
  billingPortal = {
    sessions: {
      create: mockBillingPortalSessionsCreate,
    },
  };
  subscriptions = {
    retrieve: mockSubscriptionsRetrieve,
  };
}

vi.mock("stripe", () => {
  return {
    default: MockStripe,
  };
});

const user = {
  name: "Test User",
  subject: "user_stripe_test",
  issuer: "clerk",
  email: "test@example.com",
};

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_PRICE_PULSE_MONTHLY = "price_pulse_monthly";
    process.env.STRIPE_PRICE_PULSE_YEARLY = "price_pulse_yearly";
    process.env.STRIPE_PRICE_VITAL_MONTHLY = "price_vital_monthly";
    process.env.STRIPE_PRICE_VITAL_YEARLY = "price_vital_yearly";
    process.env.NEXT_PUBLIC_APP_URL = "https://test.heartbeat.app";

    mockCheckoutSessionCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });
    mockCustomersCreate.mockResolvedValue({
      id: "cus_new_123",
    });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_PULSE_MONTHLY;
    delete process.env.STRIPE_PRICE_PULSE_YEARLY;
    delete process.env.STRIPE_PRICE_VITAL_MONTHLY;
    delete process.env.STRIPE_PRICE_VITAL_YEARLY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("throws error when unauthenticated", async () => {
    const t = setupBackend();

    await expect(
      t.action(api.stripe.createCheckoutSession, {
        tier: "pulse",
        interval: "month",
      }),
    ).rejects.toThrow("Unauthorized");
  });

  it("creates checkout session for new user", async () => {
    const t = setupBackend();

    const result = await t
      .withIdentity(user)
      .action(api.stripe.createCheckoutSession, {
        tier: "pulse",
        interval: "month",
      });

    expect(result.url).toBe("https://checkout.stripe.com/session_123");
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: user.email,
      name: user.name,
      metadata: { userId: user.subject },
    });
    expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new_123",
        mode: "subscription",
        line_items: [{ price: "price_pulse_monthly", quantity: 1 }],
      }),
    );
  });

  it("reuses existing customer ID when user has subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    await t.withIdentity(user).action(api.stripe.createCheckoutSession, {
      tier: "vital",
      interval: "year",
    });

    // Should NOT create new customer
    expect(mockCustomersCreate).not.toHaveBeenCalled();
    // Should use existing customer ID
    expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: `cus_test_${user.subject}`,
        line_items: [{ price: "price_vital_yearly", quantity: 1 }],
      }),
    );
  });

  it("includes trial period in subscription data", async () => {
    const t = setupBackend();

    await t.withIdentity(user).action(api.stripe.createCheckoutSession, {
      tier: "pulse",
      interval: "month",
    });

    expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_data: expect.objectContaining({
          trial_period_days: 14,
          metadata: { userId: user.subject, tier: "pulse" },
        }),
      }),
    );
  });

  it("sets correct URLs for success and cancel", async () => {
    const t = setupBackend();

    await t.withIdentity(user).action(api.stripe.createCheckoutSession, {
      tier: "pulse",
      interval: "month",
    });

    expect(mockCheckoutSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://test.heartbeat.app/dashboard?checkout=success",
        cancel_url: "https://test.heartbeat.app/pricing?checkout=canceled",
      }),
    );
  });

  it("throws error when STRIPE_SECRET_KEY is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const t = setupBackend();

    await expect(
      t.withIdentity(user).action(api.stripe.createCheckoutSession, {
        tier: "pulse",
        interval: "month",
      }),
    ).rejects.toThrow("STRIPE_SECRET_KEY is not configured");
  });

  it("throws error when price ID is not configured", async () => {
    delete process.env.STRIPE_PRICE_PULSE_MONTHLY;
    const t = setupBackend();

    await expect(
      t.withIdentity(user).action(api.stripe.createCheckoutSession, {
        tier: "pulse",
        interval: "month",
      }),
    ).rejects.toThrow("STRIPE_PRICE_PULSE_MONTHLY is not configured");
  });
});

describe("createBillingPortalSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_APP_URL = "https://test.heartbeat.app";

    mockBillingPortalSessionsCreate.mockResolvedValue({
      url: "https://billing.stripe.com/portal_123",
    });
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("throws error when unauthenticated", async () => {
    const t = setupBackend();

    await expect(
      t.action(api.stripe.createBillingPortalSession, {}),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws error when user has no subscription", async () => {
    const t = setupBackend();

    await expect(
      t.withIdentity(user).action(api.stripe.createBillingPortalSession, {}),
    ).rejects.toThrow("No subscription found");
  });

  it("creates portal session for user with subscription", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    const result = await t
      .withIdentity(user)
      .action(api.stripe.createBillingPortalSession, {});

    expect(result.url).toBe("https://billing.stripe.com/portal_123");
    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: `cus_test_${user.subject}`,
      return_url: "https://test.heartbeat.app/dashboard/settings/billing",
    });
  });
});

describe("getStripeSubscriptionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("throws error when unauthenticated", async () => {
    const t = setupBackend();

    await expect(
      t.action(api.stripe.getStripeSubscriptionDetails, {}),
    ).rejects.toThrow("Unauthorized");
  });

  it("returns null when user has no subscription", async () => {
    const t = setupBackend();

    const result = await t
      .withIdentity(user)
      .action(api.stripe.getStripeSubscriptionDetails, {});

    expect(result).toBeNull();
  });

  it("returns subscription details from Stripe", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    const mockStripeSubscription = {
      status: "active",
      cancel_at_period_end: false,
      trial_end: null,
      items: {
        data: [{ current_period_end: 1700000000 }],
      },
      default_payment_method: {
        card: {
          brand: "visa",
          last4: "4242",
          exp_month: 12,
          exp_year: 2025,
        },
      },
    };
    mockSubscriptionsRetrieve.mockResolvedValue(mockStripeSubscription);

    const result = await t
      .withIdentity(user)
      .action(api.stripe.getStripeSubscriptionDetails, {});

    expect(result).toEqual({
      status: "active",
      currentPeriodEnd: 1700000000000, // Converted to milliseconds
      cancelAtPeriodEnd: false,
      trialEnd: null,
      paymentMethod: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2025,
      },
    });
  });

  it("returns null for payment method when not set", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    mockSubscriptionsRetrieve.mockResolvedValue({
      status: "active",
      cancel_at_period_end: false,
      trial_end: null,
      items: { data: [{ current_period_end: 1700000000 }] },
      default_payment_method: null,
    });

    const result = await t
      .withIdentity(user)
      .action(api.stripe.getStripeSubscriptionDetails, {});

    expect(result?.paymentMethod).toBeNull();
  });

  it("includes trial end when present", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    mockSubscriptionsRetrieve.mockResolvedValue({
      status: "trialing",
      cancel_at_period_end: false,
      trial_end: 1700000000,
      items: { data: [{ current_period_end: 1700100000 }] },
      default_payment_method: null,
    });

    const result = await t
      .withIdentity(user)
      .action(api.stripe.getStripeSubscriptionDetails, {});

    expect(result?.trialEnd).toBe(1700000000000); // Converted to milliseconds
  });

  it("returns null when Stripe API fails", async () => {
    const t = setupBackend();
    await createTestSubscription(t, user.subject);

    mockSubscriptionsRetrieve.mockRejectedValue(new Error("Stripe API error"));

    const result = await t
      .withIdentity(user)
      .action(api.stripe.getStripeSubscriptionDetails, {});

    expect(result).toBeNull();
  });
});
