import { v } from "convex/values";
import { query } from "./_generated/server";
import { toPublicIncident } from "./publicTypes";

const publicIncidentValidator = v.object({
  _id: v.id("incidents"),
  title: v.string(),
  status: v.union(
    v.literal("investigating"),
    v.literal("identified"),
    v.literal("resolved"),
  ),
  startedAt: v.number(),
  resolvedAt: v.optional(v.number()),
});

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
    statusFilter: v.optional(
      v.union(
        v.literal("investigating"),
        v.literal("identified"),
        v.literal("resolved"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get all monitors for this project slug first
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_project_slug", (q) =>
        q.eq("projectSlug", args.projectSlug),
      )
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
          .collect(),
      ),
    );

    // Flatten, filter, and sort
    let incidents = allIncidents
      .flat()
      .sort((a, b) => b.startedAt - a.startedAt);

    if (args.statusFilter) {
      incidents = incidents.filter((i) => i.status === args.statusFilter);
    }

    return incidents.slice(0, limit);
  },
});

export const getPublicIncidentsForMonitor = query({
  args: {
    monitorId: v.id("monitors"),
    limit: v.optional(v.number()),
  },
  returns: v.array(publicIncidentValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const monitor = await ctx.db.get(args.monitorId);
    if (!monitor || monitor.visibility !== "public") {
      return [];
    }

    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .order("desc")
      .take(limit);

    return incidents.map(toPublicIncident);
  },
});

export const getPublicIncidentsForProject = query({
  args: {
    projectSlug: v.string(),
    limit: v.optional(v.number()),
    statusFilter: v.optional(
      v.union(
        v.literal("investigating"),
        v.literal("identified"),
        v.literal("resolved"),
      ),
    ),
  },
  returns: v.array(publicIncidentValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const publicMonitors = await ctx.db
      .query("monitors")
      .withIndex("by_project_slug_and_visibility", (q) =>
        q.eq("projectSlug", args.projectSlug).eq("visibility", "public"),
      )
      .collect();

    if (publicMonitors.length === 0) {
      return [];
    }

    const incidentsByMonitor = await Promise.all(
      publicMonitors.map((monitor) =>
        ctx.db
          .query("incidents")
          .withIndex("by_monitor", (q) => q.eq("monitorId", monitor._id))
          .order("desc")
          .collect(),
      ),
    );

    let incidents = incidentsByMonitor.flat();

    if (args.statusFilter) {
      incidents = incidents.filter(
        (incident) => incident.status === args.statusFilter,
      );
    }

    incidents.sort((a, b) => b.startedAt - a.startedAt);

    return incidents.slice(0, limit).map(toPublicIncident);
  },
});
