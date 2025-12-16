import { v } from "convex/values";
import { query } from "./_generated/server";
import { toPublicCheck } from "./publicTypes";
import { isPubliclyVisible } from "./lib/visibility";

const publicCheckValidator = v.object({
  _id: v.id("checks"),
  status: v.union(v.literal("up"), v.literal("down")),
  responseTime: v.number(),
  checkedAt: v.number(),
});

export const getRecentForMonitor = query({
  args: {
    monitorId: v.id("monitors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    return await ctx.db
      .query("checks")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .order("desc")
      .take(limit);
  },
});

export const getUptimeStats = query({
  args: {
    monitorId: v.id("monitors"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const checks = await ctx.db
      .query("checks")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .filter((q) => q.gte(q.field("checkedAt"), startTime))
      .collect();

    if (checks.length === 0) {
      return {
        uptimePercentage: 100,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        avgResponseTime: null,
      };
    }

    const successfulChecks = checks.filter((c) => c.status === "up").length;
    const failedChecks = checks.length - successfulChecks;
    const uptimePercentage = (successfulChecks / checks.length) * 100;

    const responseTimes = checks
      .filter((c) => c.responseTime !== undefined)
      .map((c) => c.responseTime!);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

    return {
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      totalChecks: checks.length,
      successfulChecks,
      failedChecks,
      avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
    };
  },
});

export const getPublicChecksForMonitor = query({
  args: {
    monitorId: v.id("monitors"),
    limit: v.optional(v.number()),
  },
  returns: v.array(publicCheckValidator),
  handler: async (ctx, args) => {
    const monitor = await ctx.db.get(args.monitorId);
    if (!isPubliclyVisible(monitor)) {
      return [];
    }

    const limit = args.limit ?? 50;
    const checks = await ctx.db
      .query("checks")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .order("desc")
      .take(limit);

    return checks.map(toPublicCheck);
  },
});

export const getPublicUptimeStats = query({
  args: {
    monitorId: v.id("monitors"),
    days: v.optional(v.number()),
  },
  returns: v.object({
    uptimePercentage: v.number(),
    totalChecks: v.number(),
    avgResponseTime: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const monitor = await ctx.db.get(args.monitorId);
    if (!isPubliclyVisible(monitor)) {
      return { uptimePercentage: 100, totalChecks: 0, avgResponseTime: null };
    }

    const days = args.days ?? 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const checks = await ctx.db
      .query("checks")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .filter((q) => q.gte(q.field("checkedAt"), startTime))
      .collect();

    if (checks.length === 0) {
      return { uptimePercentage: 100, totalChecks: 0, avgResponseTime: null };
    }

    const successfulChecks = checks.filter((c) => c.status === "up").length;
    const uptimePercentage = (successfulChecks / checks.length) * 100;
    const responseTimes = checks.map((c) => c.responseTime);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null;

    return {
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
      totalChecks: checks.length,
      avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
    };
  },
});

/**
 * Get daily aggregated status for uptime bar visualization.
 * Returns one status per day based on uptime percentage thresholds.
 */
export const getDailyStatus = query({
  args: {
    monitorId: v.id("monitors"),
    days: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(),
      status: v.union(
        v.literal("up"),
        v.literal("degraded"),
        v.literal("down"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    const checks = await ctx.db
      .query("checks")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .filter((q) => q.gte(q.field("checkedAt"), startTime))
      .collect();

    if (checks.length === 0) {
      return [];
    }

    // Group by day and compute status per day
    const dailyMap = new Map<string, { up: number; total: number }>();
    for (const check of checks) {
      const day = new Date(check.checkedAt).toISOString().split("T")[0];
      const entry = dailyMap.get(day) || { up: 0, total: 0 };
      entry.total++;
      if (check.status === "up") entry.up++;
      dailyMap.set(day, entry);
    }

    // Return ordered array of daily statuses
    return Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        status:
          stats.up / stats.total >= 0.99
            ? ("up" as const)
            : stats.up / stats.total >= 0.95
              ? ("degraded" as const)
              : ("down" as const),
      }));
  },
});
