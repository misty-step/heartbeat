// tests/convex.ts
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { internal } from "../convex/_generated/api";

// Factory for isolated test backend
export const setupBackend = () =>
  convexTest(schema, import.meta.glob("../convex/**/*.ts"));

/**
 * Create a test subscription for a user.
 * Required for tests that create monitors (subscription check).
 * Uses internal mutation (same as webhook handler).
 */
export async function createTestSubscription(
  t: ReturnType<typeof setupBackend>,
  userId: string,
  options: {
    tier?: "pulse" | "vital";
    status?: "trialing" | "active" | "past_due" | "canceled" | "expired";
  } = {},
) {
  const now = Date.now();
  const tier = options.tier ?? "vital";
  const status = options.status ?? "active";

  await t.mutation(internal.subscriptions.createSubscription, {
    userId,
    stripeCustomerId: `cus_test_${userId}`,
    stripeSubscriptionId: `sub_test_${userId}`,
    tier,
    status,
    currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    cancelAtPeriodEnd: false,
  });
}

/**
 * Usage:
 * const t = setupBackend();
 * await createTestSubscription(t, "user_123");
 * await t.mutation(api.monitors.create, { ... });
 * const result = await t.query(api.monitors.list);
 */
