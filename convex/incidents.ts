import { v } from "convex/values";
import { query } from "./_generated/server";

export const getForMonitor = query({
  args: {
    monitorId: v.id("monitors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    return await ctx.db
      .query("incidents")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .order("desc")
      .take(limit);
  },
});

export const getForProject = query({
  args: {
    projectSlug: v.string(),
    limit: v.optional(v.number()),
    statusFilter: v.optional(v.union(v.literal("investigating"), v.literal("identified"), v.literal("resolved"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let incidentsQuery = ctx.db
      .query("incidents")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .order("desc");

    if (args.statusFilter) {
      incidentsQuery = incidentsQuery.filter((q) =>
        q.eq(q.field("status"), args.statusFilter)
      );
    }

    return await incidentsQuery.take(limit);
  },
});

export const getOpenIncidents = query({
  args: {
    projectSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("incidents")
      .withIndex("by_status", (q) => q.eq("status", "investigating"))
      .order("desc");

    const incidents = await query.collect();

    if (args.projectSlug) {
      // Client-side filter since we can't compound filter on two indexes
      return incidents.filter((i) => {
        // We'll need to enrich this with monitor data to filter by projectSlug
        // For now, return all investigating incidents
        return true;
      });
    }

    return incidents;
  },
});
