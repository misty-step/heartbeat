import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import { mapStripeStatus, extractTier, getCurrentPeriodEnd } from "../http";

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
