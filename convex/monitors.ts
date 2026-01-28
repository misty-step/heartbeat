import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { toPublicMonitor } from "./publicTypes";
import { generateUniqueStatusSlug } from "./slugs";
import { isPubliclyVisible } from "./lib/visibility";
import { validateMonitorUrl } from "./lib/urlValidation";

const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 60000;

const assertTimeoutInRange = (timeout: number) => {
  if (timeout < MIN_TIMEOUT_MS || timeout > MAX_TIMEOUT_MS) {
    throw new Error("Timeout must be between 1 and 60 seconds");
  }
};

const publicMonitorValidator = v.object({
  _id: v.id("monitors"),
  name: v.string(),
  status: v.union(v.literal("up"), v.literal("degraded"), v.literal("down")),
  lastCheckAt: v.optional(v.number()),
  lastResponseTime: v.optional(v.number()),
  theme: v.optional(
    v.union(
      v.literal("glass"),
      v.literal("ukiyo"),
      v.literal("memphis"),
      v.literal("blueprint"),
      v.literal("swiss"),
      v.literal("broadsheet"),
      v.literal("mission-control"),
    ),
  ),
});

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

export const getPublicMonitorsForProject = query({
  args: { projectSlug: v.string() },
  returns: v.array(publicMonitorValidator),
  handler: async (ctx, args) => {
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_project_slug_and_visibility", (q) =>
        q.eq("projectSlug", args.projectSlug).eq("visibility", "public"),
      )
      .collect();

    return monitors.map(toPublicMonitor);
  },
});

export const getPublicMonitorByStatusSlug = query({
  args: { statusSlug: v.string() },
  returns: v.union(publicMonitorValidator, v.null()),
  handler: async (ctx, args) => {
    const monitor = await ctx.db
      .query("monitors")
      .withIndex("by_status_slug", (q) => q.eq("statusSlug", args.statusSlug))
      .first();

    if (!isPubliclyVisible(monitor)) {
      return null;
    }

    return toPublicMonitor(monitor);
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
      v.literal("PATCH"),
    ),
    interval: v.union(
      v.literal(60),
      v.literal(120),
      v.literal(300),
      v.literal(600),
      v.literal(1800),
      v.literal(3600),
    ),
    timeout: v.number(),
    projectSlug: v.string(),
    expectedStatusCode: v.optional(v.number()),
    expectedBodyContains: v.optional(v.string()),
    headers: v.optional(
      v.array(v.object({ key: v.string(), value: v.string() })),
    ),
    body: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    theme: v.optional(
      v.union(
        v.literal("glass"),
        v.literal("ukiyo"),
        v.literal("memphis"),
        v.literal("blueprint"),
        v.literal("swiss"),
        v.literal("broadsheet"),
        v.literal("mission-control"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Check subscription limits
    const canCreate = await ctx.runQuery(
      internal.subscriptions.canCreateMonitor,
      { userId: identity.subject },
    );
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason || "Cannot create monitor");
    }

    // Validate interval against tier limits
    const limits = await ctx.runQuery(internal.subscriptions.getTierLimits, {
      userId: identity.subject,
    });
    if (args.interval < limits.minInterval) {
      const minMinutes = limits.minInterval / 60;
      throw new Error(
        `Minimum check interval is ${minMinutes} minutes on your plan. Upgrade to check more frequently.`,
      );
    }

    // Validate theme against tier
    if (args.theme && args.theme !== "glass") {
      const subscription = await ctx.runQuery(
        internal.subscriptions.getByUserId,
        { userId: identity.subject },
      );
      if (!subscription || subscription.tier !== "vital") {
        throw new Error(
          "Premium themes require a Vital subscription. Upgrade to use custom themes.",
        );
      }
    }

    // Validate URL to prevent SSRF attacks
    const urlError = validateMonitorUrl(args.url);
    if (urlError) {
      throw new Error(urlError);
    }

    assertTimeoutInRange(args.timeout);

    const now = Date.now();
    const statusSlug = await generateUniqueStatusSlug(ctx);

    const id = await ctx.db.insert("monitors", {
      ...args,
      statusSlug,
      visibility: args.visibility ?? "public",
      theme: args.theme ?? "glass",
      userId: identity.subject,
      enabled: true,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Return full document so client can display statusSlug immediately
    return await ctx.db.get(id);
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
        v.literal("PATCH"),
      ),
    ),
    interval: v.optional(
      v.union(
        v.literal(60),
        v.literal(120),
        v.literal(300),
        v.literal(600),
        v.literal(1800),
        v.literal(3600),
      ),
    ),
    timeout: v.optional(v.number()),
    expectedStatusCode: v.optional(v.number()),
    expectedBodyContains: v.optional(v.string()),
    headers: v.optional(
      v.array(v.object({ key: v.string(), value: v.string() })),
    ),
    body: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    theme: v.optional(
      v.union(
        v.literal("glass"),
        v.literal("ukiyo"),
        v.literal("memphis"),
        v.literal("blueprint"),
        v.literal("swiss"),
        v.literal("broadsheet"),
        v.literal("mission-control"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Validate interval against tier limits (if interval is being updated)
    if (args.interval !== undefined) {
      const limits = await ctx.runQuery(internal.subscriptions.getTierLimits, {
        userId: identity.subject,
      });
      if (args.interval < limits.minInterval) {
        const minMinutes = limits.minInterval / 60;
        throw new Error(
          `Minimum check interval is ${minMinutes} minutes on your plan. Upgrade to check more frequently.`,
        );
      }
    }

    // Validate theme against tier (if theme is being updated)
    if (args.theme !== undefined && args.theme !== "glass") {
      const subscription = await ctx.runQuery(
        internal.subscriptions.getByUserId,
        { userId: identity.subject },
      );
      if (!subscription || subscription.tier !== "vital") {
        throw new Error(
          "Premium themes require a Vital subscription. Upgrade to use custom themes.",
        );
      }
    }

    // Validate URL to prevent SSRF attacks (if URL is being updated)
    if (args.url) {
      const urlError = validateMonitorUrl(args.url);
      if (urlError) {
        throw new Error(urlError);
      }
    }

    if (args.timeout !== undefined) {
      assertTimeoutInRange(args.timeout);
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
