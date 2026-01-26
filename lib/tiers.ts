/**
 * Subscription tier configuration.
 * Defines limits and pricing for each plan.
 */

import { TIERS as TIER_LIMITS, type TierName } from "@/convex/constants";

// Limits live in convex/constants.ts to prevent drift with enforcement.
const TIER_DETAILS = {
  pulse: {
    name: "Pulse",
    description: "Essential monitoring for side projects and small sites",
    historyDays: 30,
    webhooks: false,
    apiAccess: false,
    monthlyPrice: 900, // cents
    yearlyPrice: 8600, // cents (~20% off)
  },
  vital: {
    name: "Vital",
    description: "Professional monitoring for growing applications",
    historyDays: 90,
    webhooks: true,
    apiAccess: true,
    monthlyPrice: 2900, // cents
    yearlyPrice: 27800, // cents (~20% off)
  },
} as const;

export const TIERS = {
  pulse: { ...TIER_DETAILS.pulse, ...TIER_LIMITS.pulse },
  vital: { ...TIER_DETAILS.vital, ...TIER_LIMITS.vital },
} as const;

export type { TierName };
export type Tier = (typeof TIERS)[TierName];

export const TRIAL_DAYS = 14;
export const TRIAL_TIER: TierName = "vital"; // Full access during trial

/**
 * Get tier configuration by name.
 */
export function getTier(name: TierName): Tier {
  return TIERS[name];
}

/**
 * Get tier limits for display.
 */
export function getTierLimits(name: TierName) {
  const tier = TIERS[name];
  return {
    monitors: tier.monitors,
    minInterval: tier.minInterval,
    statusPages: tier.statusPages,
    historyDays: tier.historyDays,
    webhooks: tier.webhooks,
    apiAccess: tier.apiAccess,
  };
}

/**
 * Format interval for display.
 */
export function formatInterval(seconds: number): string {
  if (seconds >= 3600) {
    return `${seconds / 3600} hour${seconds > 3600 ? "s" : ""}`;
  }
  return `${seconds / 60} minute${seconds > 60 ? "s" : ""}`;
}

/**
 * Format price for display.
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Get all available intervals, filtered by tier minimum.
 */
export function getAvailableIntervals(minInterval: number): number[] {
  const allIntervals = [60, 120, 300, 600, 1800, 3600];
  return allIntervals.filter((i) => i >= minInterval);
}
