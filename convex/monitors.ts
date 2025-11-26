import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("monitors") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const monitor = await ctx.db.get(args.id);
    if (!monitor || monitor.userId !== identity.subject) {
      throw new Error("Monitor not found");
    }

    return monitor;
  },
});

export const getByProjectSlug = query({
  args: { projectSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("monitors")
      .withIndex("by_project_slug", (q) => q.eq("projectSlug", args.projectSlug))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    method: v.union(
      v.literal("GET"),
      v.literal("POST"),
      v.literal("HEAD"),
      v.literal("PUT"),
      v.literal("DELETE"),
      v.literal("PATCH")
    ),
    interval: v.union(
      v.literal(60),
      v.literal(120),
      v.literal(300),
      v.literal(600),
      v.literal(1800),
      v.literal(3600)
    ),
    timeout: v.number(),
    projectSlug: v.string(),
    expectedStatusCode: v.optional(v.number()),
    expectedBodyContains: v.optional(v.string()),
    headers: v.optional(v.array(v.object({ key: v.string(), value: v.string() }))),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    return await ctx.db.insert("monitors", {
      ...args,
      userId: identity.subject,
      enabled: true,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("monitors"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    method: v.optional(
      v.union(
        v.literal("GET"),
        v.literal("POST"),
        v.literal("HEAD"),
        v.literal("PUT"),
        v.literal("DELETE"),
        v.literal("PATCH")
      )
    ),
    interval: v.optional(
      v.union(
        v.literal(60),
        v.literal(120),
        v.literal(300),
        v.literal(600),
        v.literal(1800),
        v.literal(3600)
      )
    ),
    timeout: v.optional(v.number()),
    expectedStatusCode: v.optional(v.number()),
    expectedBodyContains: v.optional(v.string()),
    headers: v.optional(v.array(v.object({ key: v.string(), value: v.string() }))),
    body: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    const monitor = await ctx.db.get(id);

    if (!monitor || monitor.userId !== identity.subject) {
      throw new Error("Monitor not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("monitors") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const monitor = await ctx.db.get(args.id);
    if (!monitor || monitor.userId !== identity.subject) {
      throw new Error("Monitor not found");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Internal query to get monitor without auth check.
 * Used by monitoring engine actions.
 */
export const getInternal = internalQuery({
  args: { id: v.id("monitors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
