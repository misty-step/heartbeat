/**
 * Subscription tier configuration.
 * Defines limits and pricing for each plan.
 */

export const TIERS = {
  pulse: {
    name: "Pulse",
    description: "Essential monitoring for side projects and small sites",
    monitors: 15,
    minInterval: 180, // 3 minutes in seconds
    statusPages: 1,
    historyDays: 30,
    webhooks: false,
    apiAccess: false,
    monthlyPrice: 900, // cents
    yearlyPrice: 8600, // cents (~20% off)
  },
  vital: {
    name: "Vital",
    description: "Professional monitoring for growing applications",
    monitors: 75,
    minInterval: 60, // 1 minute in seconds
    statusPages: 5,
    historyDays: 90,
    webhooks: true,
    apiAccess: true,
    monthlyPrice: 2900, // cents
    yearlyPrice: 27800, // cents (~20% off)
  },
} as const;

export type TierName = keyof typeof TIERS;
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
