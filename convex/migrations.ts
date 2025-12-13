import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { generateUniqueStatusSlug } from "./slugs";

const BATCH_SIZE = 100;

/**
 * Get monitors that need visibility backfill (visibility is undefined).
 * Used to check migration progress.
 */
export const getMonitorsNeedingVisibility = internalQuery({
  args: {},
  handler: async (ctx) => {
    const monitors = await ctx.db.query("monitors").collect();
    return monitors.filter((m) => m.visibility === undefined);
  },
});

/**
 * Backfill visibility field for existing monitors.
 *
 * FAIL-SAFE: Sets existing monitors to "private" by default.
 * This is intentional - the current "public by default" behavior is the security vulnerability.
 * Users must explicitly opt-in to public visibility.
 *
 * Run via: npx convex run migrations:backfillVisibility
 *
 * Returns: { processed: number, remaining: number }
 */
export const backfillVisibility = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? BATCH_SIZE;

    // Find monitors without visibility set
    const monitors = await ctx.db.query("monitors").collect();
    const needsBackfill = monitors.filter((m) => m.visibility === undefined);

    // Process in batches to avoid timeout
    const batch = needsBackfill.slice(0, batchSize);

    for (const monitor of batch) {
      await ctx.db.patch(monitor._id, { visibility: "private" as const });
    }

    return {
      processed: batch.length,
      remaining: needsBackfill.length - batch.length,
    };
  },
});

/**
 * Check migration completion status.
 * Returns true if all monitors have visibility field set.
 */
export const isMigrationComplete = internalQuery({
  args: {},
  handler: async (ctx) => {
    const monitors = await ctx.db.query("monitors").collect();
    const needsBackfill = monitors.filter((m) => m.visibility === undefined);
    return {
      complete: needsBackfill.length === 0,
      total: monitors.length,
      remaining: needsBackfill.length,
    };
  },
});

// ============================================================================
// Status Slug Migration
// ============================================================================

/**
 * Get monitors that need statusSlug backfill.
 * Used to check migration progress.
 */
export const getMonitorsNeedingStatusSlug = internalQuery({
  args: {},
  handler: async (ctx) => {
    const monitors = await ctx.db.query("monitors").collect();
    return monitors.filter((m) => !m.statusSlug);
  },
});

/**
 * Backfill statusSlug field for existing monitors.
 *
 * Generates unique 3-word slugs (e.g., "silver-mountain-echo") for each monitor.
 *
 * Run via: npx convex run migrations:backfillStatusSlugs
 *
 * Returns: { processed: number, remaining: number }
 */
export const backfillStatusSlugs = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? BATCH_SIZE;

    // Find monitors without statusSlug
    const monitors = await ctx.db.query("monitors").collect();
    const needsBackfill = monitors.filter((m) => !m.statusSlug);

    // Process in batches to avoid timeout
    const batch = needsBackfill.slice(0, batchSize);

    for (const monitor of batch) {
      const statusSlug = await generateUniqueStatusSlug(ctx);
      await ctx.db.patch(monitor._id, { statusSlug });
    }

    return {
      processed: batch.length,
      remaining: needsBackfill.length - batch.length,
    };
  },
});

/**
 * Check statusSlug migration completion status.
 */
export const isStatusSlugMigrationComplete = internalQuery({
  args: {},
  handler: async (ctx) => {
    const monitors = await ctx.db.query("monitors").collect();
    const needsBackfill = monitors.filter((m) => !m.statusSlug);
    return {
      complete: needsBackfill.length === 0,
      total: monitors.length,
      remaining: needsBackfill.length,
    };
  },
});
