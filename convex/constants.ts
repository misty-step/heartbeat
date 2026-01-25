// Subscription tier limits - single source of truth
// Used by both client (lib/tiers.ts) and server (subscriptions.ts)
export const TIERS = {
  pulse: { monitors: 15, minInterval: 180, statusPages: 1 },
  vital: { monitors: 75, minInterval: 60, statusPages: 5 },
} as const;

export type TierName = keyof typeof TIERS;
