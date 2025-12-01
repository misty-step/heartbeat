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

    // Get all monitors for this project slug first
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_project_slug", (q) => q.eq("projectSlug", args.projectSlug))
      .collect();

    if (monitors.length === 0) {
      return [];
    }

    // Get incidents for all monitors in this project
    const allIncidents = await Promise.all(
      monitors.map((monitor) =>
        ctx.db
          .query("incidents")
          .withIndex("by_monitor", (q) => q.eq("monitorId", monitor._id))
          .order("desc")
          .collect()
      )
    );

    // Flatten, filter, and sort
    let incidents = allIncidents.flat().sort((a, b) => b.startedAt - a.startedAt);

    if (args.statusFilter) {
      incidents = incidents.filter((i) => i.status === args.statusFilter);
    }

    return incidents.slice(0, limit);
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
