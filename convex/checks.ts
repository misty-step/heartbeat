import { v } from "convex/values";
import { query } from "./_generated/server";

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
      avgResponseTime: avgResponseTime
        ? Math.round(avgResponseTime)
        : null,
    };
  },
});
