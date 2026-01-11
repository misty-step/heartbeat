import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";

/**
 * Get user settings, creating defaults if none exist.
 * Extracts email from Clerk identity.
 */
export const getOrCreate = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      return existing;
    }

    // Extract email from Clerk identity
    const email = identity.email ?? "";

    // Return default settings (will be persisted on first update)
    return {
      _id: null,
      userId: identity.subject,
      email,
      emailNotifications: true,
      notifyOnDown: true,
      notifyOnRecovery: true,
      webhookUrl: undefined,
      throttleMinutes: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
});

/**
 * Create settings for a user if they don't exist.
 * Called when user first visits settings page.
 */
export const ensureExists = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      return existing;
    }

    const email = identity.email ?? "";
    const now = Date.now();

    const id = await ctx.db.insert("userSettings", {
      userId: identity.subject,
      email,
      emailNotifications: true,
      notifyOnDown: true,
      notifyOnRecovery: true,
      webhookUrl: undefined,
      throttleMinutes: 5,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

/**
 * Update notification settings.
 */
export const update = mutation({
  args: {
    emailNotifications: v.optional(v.boolean()),
    notifyOnDown: v.optional(v.boolean()),
    notifyOnRecovery: v.optional(v.boolean()),
    webhookUrl: v.optional(v.string()),
    throttleMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Validate throttleMinutes if provided
    if (args.throttleMinutes !== undefined) {
      if (args.throttleMinutes < 5 || args.throttleMinutes > 60) {
        throw new Error("Throttle must be between 5 and 60 minutes");
      }
    }

    // Validate webhook URL if provided
    if (args.webhookUrl !== undefined && args.webhookUrl !== "") {
      let url: URL;
      try {
        url = new URL(args.webhookUrl);
      } catch {
        throw new Error("Invalid webhook URL");
      }
      if (url.protocol !== "https:") {
        throw new Error("Webhook URL must use HTTPS");
      }
    }

    let settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    // Create if doesn't exist
    if (!settings) {
      const email = identity.email ?? "";
      const now = Date.now();

      const id = await ctx.db.insert("userSettings", {
        userId: identity.subject,
        email,
        emailNotifications: args.emailNotifications ?? true,
        notifyOnDown: args.notifyOnDown ?? true,
        notifyOnRecovery: args.notifyOnRecovery ?? true,
        webhookUrl: args.webhookUrl || undefined,
        throttleMinutes: args.throttleMinutes ?? 5,
        createdAt: now,
        updatedAt: now,
      });

      return await ctx.db.get(id);
    }

    // Update existing
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.emailNotifications !== undefined) {
      updates.emailNotifications = args.emailNotifications;
    }
    if (args.notifyOnDown !== undefined) {
      updates.notifyOnDown = args.notifyOnDown;
    }
    if (args.notifyOnRecovery !== undefined) {
      updates.notifyOnRecovery = args.notifyOnRecovery;
    }
    if (args.webhookUrl !== undefined) {
      updates.webhookUrl = args.webhookUrl || undefined;
    }
    if (args.throttleMinutes !== undefined) {
      updates.throttleMinutes = args.throttleMinutes;
    }

    await ctx.db.patch(settings._id, updates);
    return await ctx.db.get(settings._id);
  },
});

/**
 * Internal query to get settings by userId.
 * Used by notification engine.
 */
export const getByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});
