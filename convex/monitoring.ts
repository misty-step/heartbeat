import { v } from "convex/values";
import {
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { isInternalHostname } from "./lib/urlValidation";

/**
 * Get monitors that are due for checking based on their interval.
 * A monitor is due if:
 * - enabled === true
 * - lastCheckAt is undefined (never checked) OR
 * - (Date.now() - lastCheckAt) >= (interval * 1000)
 */
export const getDueMonitors = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all enabled monitors
    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    // Filter to only those due for checking
    return monitors.filter((monitor) => {
      if (!monitor.lastCheckAt) {
        // Never checked, definitely due
        return true;
      }

      const timeSinceLastCheck = now - monitor.lastCheckAt;
      const intervalMs = monitor.interval * 1000;

      return timeSinceLastCheck >= intervalMs;
    });
  },
});

/**
 * Record a check result in the checks table.
 */
export const recordCheck = internalMutation({
  args: {
    monitorId: v.id("monitors"),
    status: v.union(v.literal("up"), v.literal("down"), v.literal("degraded")),
    statusCode: v.optional(v.number()),
    responseTime: v.number(),
    errorMessage: v.optional(v.string()),
    checkedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("checks", {
      monitorId: args.monitorId,
      status: args.status,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      errorMessage: args.errorMessage,
      checkedAt: args.checkedAt,
    });
  },
});

/**
 * Update monitor status after a check completes.
 * Handles state transitions: up -> degraded -> down
 * Triggers incident opening/resolution.
 */
export const updateMonitorStatus = internalMutation({
  args: {
    monitorId: v.id("monitors"),
    success: v.boolean(),
    responseTime: v.number(),
  },
  handler: async (ctx, args) => {
    const monitor = await ctx.db.get(args.monitorId);
    if (!monitor) {
      throw new Error(`Monitor ${args.monitorId} not found`);
    }

    const now = Date.now();

    if (args.success) {
      // Monitor is up - reset failure counter
      const wasDown = monitor.consecutiveFailures >= 3;

      await ctx.db.patch(args.monitorId, {
        consecutiveFailures: 0,
        lastCheckAt: now,
        lastResponseTime: args.responseTime,
      });

      // If monitor was previously down, resolve incident
      if (wasDown) {
        await ctx.scheduler.runAfter(0, internal.monitoring.resolveIncident, {
          monitorId: args.monitorId,
        });
      }
    } else {
      // Monitor check failed
      const newFailureCount = monitor.consecutiveFailures + 1;

      await ctx.db.patch(args.monitorId, {
        consecutiveFailures: newFailureCount,
        lastCheckAt: now,
      });

      // Trigger incident on 3rd consecutive failure
      if (newFailureCount === 3) {
        await ctx.scheduler.runAfter(0, internal.monitoring.openIncident, {
          monitorId: args.monitorId,
        });
      }
    }
  },
});

/**
 * Open a new incident for a monitor that has gone down.
 * Only creates incident if one doesn't already exist.
 * Schedules notification after incident creation.
 */
export const openIncident = internalMutation({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    const monitor = await ctx.db.get(args.monitorId);
    if (!monitor) {
      throw new Error(`Monitor ${args.monitorId} not found`);
    }

    // Check if an open incident already exists
    const existingIncident = await ctx.db
      .query("incidents")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .filter((q) => q.eq(q.field("status"), "investigating"))
      .first();

    if (existingIncident) {
      // Incident already exists, don't create duplicate
      return;
    }

    const now = Date.now();

    const incidentId = await ctx.db.insert("incidents", {
      monitorId: args.monitorId,
      status: "investigating",
      startedAt: now,
      title: `${monitor.name} is down`,
      description: `Monitor has failed ${monitor.consecutiveFailures} consecutive checks.`,
      notifiedAt: undefined,
    });

    // Schedule notification
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendIncidentNotification,
      {
        incidentId,
        type: "opened",
      },
    );
  },
});

/**
 * Resolve an open incident when monitor comes back up.
 * Schedules notification after incident resolution.
 */
export const resolveIncident = internalMutation({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    // Find open incident for this monitor
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .filter((q) => q.eq(q.field("status"), "investigating"))
      .first();

    if (!incident) {
      // No open incident to resolve
      return;
    }

    const now = Date.now();

    await ctx.db.patch(incident._id, {
      status: "resolved",
      resolvedAt: now,
    });

    // Schedule notification
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.sendIncidentNotification,
      {
        incidentId: incident._id,
        type: "resolved",
      },
    );
  },
});

/**
 * Perform HTTP check for a single monitor.
 * Measures response time, validates status code, handles timeouts.
 */
export const checkMonitor = internalAction({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    // Fetch monitor details
    const monitor = await ctx.runQuery(internal.monitors.getInternal, {
      id: args.monitorId,
    });

    if (!monitor) {
      console.error(`[Monitor:${args.monitorId}] Not found`);
      return;
    }

    // Defense-in-depth: validate URL is not internal before fetch
    try {
      const parsed = new URL(monitor.url);
      if (isInternalHostname(parsed.hostname)) {
        console.error(
          `[Monitor:${args.monitorId}] Blocked SSRF attempt to ${parsed.hostname}`,
        );
        return;
      }
    } catch {
      console.error(`[Monitor:${args.monitorId}] Invalid URL: ${monitor.url}`);
      return;
    }

    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let errorMessage: string | undefined;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), monitor.timeout);

      const response = await fetch(monitor.url, {
        method: monitor.method,
        signal: controller.signal,
        headers: {
          "User-Agent": "HeartbeatMonitor/1.0",
          ...(monitor.headers
            ? Object.fromEntries(monitor.headers.map((h) => [h.key, h.value]))
            : {}),
        },
        body: monitor.body || undefined,
      });

      clearTimeout(timeoutId);

      statusCode = response.status;
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Check if status code matches expected
      if (monitor.expectedStatusCode !== undefined) {
        success = response.status === monitor.expectedStatusCode;
      } else {
        // Default: 2xx and 3xx are success
        success = response.status >= 200 && response.status < 400;
      }

      // Check body content if specified
      if (success && monitor.expectedBodyContains) {
        const body = await response.text();
        success = body.includes(monitor.expectedBodyContains);
        if (!success) {
          errorMessage = `Response body missing expected content: "${monitor.expectedBodyContains}"`;
        }
      }

      console.log(
        `[Monitor:${args.monitorId}] Checked ${monitor.url} -> ${statusCode} (${responseTime}ms) ${success ? "✓" : "✗"}`,
      );

      // Record check result
      await ctx.runMutation(internal.monitoring.recordCheck, {
        monitorId: args.monitorId,
        status: success ? "up" : "down",
        statusCode,
        responseTime,
        errorMessage,
        checkedAt: Date.now(),
      });

      // Update monitor status
      await ctx.runMutation(internal.monitoring.updateMonitorStatus, {
        monitorId: args.monitorId,
        success,
        responseTime,
      });
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (error.name === "AbortError") {
        errorMessage = `Request timed out after ${monitor.timeout}ms`;
      } else {
        errorMessage = error.message || "Unknown error";
      }

      console.error(
        `[Monitor:${args.monitorId}] Failed to check ${monitor.url}: ${errorMessage}`,
      );

      // Record failed check
      await ctx.runMutation(internal.monitoring.recordCheck, {
        monitorId: args.monitorId,
        status: "down",
        statusCode,
        responseTime,
        errorMessage,
        checkedAt: Date.now(),
      });

      // Update monitor status
      await ctx.runMutation(internal.monitoring.updateMonitorStatus, {
        monitorId: args.monitorId,
        success: false,
        responseTime,
      });
    }
  },
});

/**
 * Main heartbeat action - checks all due monitors.
 * Runs on cron schedule (every minute).
 */
export const runHeartbeat = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Heartbeat] Starting heartbeat run...");

    const dueMonitors = await ctx.runQuery(internal.monitoring.getDueMonitors);

    console.log(
      `[Heartbeat] Found ${dueMonitors.length} monitors due for checking`,
    );

    if (dueMonitors.length === 0) {
      return;
    }

    // Check all monitors in parallel
    const results = await Promise.allSettled(
      dueMonitors.map((monitor) =>
        ctx.runAction(internal.monitoring.checkMonitor, {
          monitorId: monitor._id,
        }),
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[Heartbeat] Completed: ${successful} successful, ${failed} failed`,
    );
  },
});

/**
 * Cleanup old check records to keep database size manageable.
 * Runs daily via cron. Paginates through all old checks to ensure
 * complete cleanup even when backlog exceeds batch size.
 */
export const cleanupOldChecks = internalAction({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    console.log("[Cleanup] Starting cleanup of checks older than 30 days...");

    let totalDeleted = 0;
    let batchNumber = 0;

    // Paginate through all old checks until none remain
    while (true) {
      const oldChecks = await ctx.runQuery(internal.monitoring.getOldChecks, {
        beforeTimestamp: thirtyDaysAgo,
      });

      if (oldChecks.length === 0) {
        break;
      }

      batchNumber++;
      console.log(
        `[Cleanup] Batch ${batchNumber}: deleting ${oldChecks.length} checks`,
      );

      // Delete in sub-batches to avoid mutation size limits
      const deleteBatchSize = 100;
      for (let i = 0; i < oldChecks.length; i += deleteBatchSize) {
        const batch = oldChecks.slice(i, i + deleteBatchSize);
        await ctx.runMutation(internal.monitoring.deleteChecks, {
          checkIds: batch.map((c) => c._id),
        });
      }

      totalDeleted += oldChecks.length;
    }

    console.log(`[Cleanup] Complete: deleted ${totalDeleted} checks total`);
  },
});

/**
 * Helper query to get old checks for cleanup.
 */
export const getOldChecks = internalQuery({
  args: {
    beforeTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("checks")
      .withIndex("by_checked_at", (q) =>
        q.lt("checkedAt", args.beforeTimestamp),
      )
      .take(1000);
  },
});

/**
 * Helper mutation to batch delete checks.
 */
export const deleteChecks = internalMutation({
  args: {
    checkIds: v.array(v.id("checks")),
  },
  handler: async (ctx, args) => {
    for (const checkId of args.checkIds) {
      await ctx.db.delete(checkId);
    }
  },
});
