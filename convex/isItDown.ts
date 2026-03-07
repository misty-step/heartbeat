import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { isAllowedUrl } from "./lib/urlValidation";
import {
  computeIsItDownVerdict,
  computeStatus,
  getIsItDownSummary,
  normalizeTargetInput,
} from "../lib/domain";

const PROBE_TIMEOUT_MS = 8000;
const ON_DEMAND_CACHE_WINDOW_MS = 30 * 1000;
const SERVICE_CHECK_RETENTION_DAYS = 30;

const verdictValidator = v.union(
  v.literal("likely_down_for_everyone"),
  v.literal("likely_local_issue"),
  v.literal("unclear_retrying"),
  v.literal("no_data"),
);

const statusSnapshotValidator = v.object({
  hostname: v.string(),
  probeUrl: v.string(),
  verdict: verdictValidator,
  summary: v.string(),
  checkedAt: v.optional(v.number()),
  latestStatus: v.optional(v.union(v.literal("up"), v.literal("down"))),
  recentChecks: v.array(
    v.object({
      status: v.union(v.literal("up"), v.literal("down")),
      statusCode: v.optional(v.number()),
      responseTime: v.number(),
      errorMessage: v.optional(v.string()),
      checkedAt: v.number(),
      source: v.union(v.literal("scheduled"), v.literal("on_demand")),
    }),
  ),
  recentSuccessCount: v.number(),
  recentFailureCount: v.number(),
  matchingPublicMonitors: v.array(
    v.object({
      monitorId: v.id("monitors"),
      name: v.string(),
      status: v.union(
        v.literal("up"),
        v.literal("degraded"),
        v.literal("down"),
      ),
      statusSlug: v.optional(v.string()),
    }),
  ),
  activeIncidents: v.array(
    v.object({
      incidentId: v.id("incidents"),
      monitorId: v.id("monitors"),
      monitorName: v.string(),
      title: v.string(),
      startedAt: v.number(),
    }),
  ),
});

const DEFAULT_TRACKED_TARGETS = [
  { hostname: "github.com", url: "https://github.com", label: "GitHub" },
  { hostname: "vercel.com", url: "https://vercel.com", label: "Vercel" },
  {
    hostname: "cloudflare.com",
    url: "https://cloudflare.com",
    label: "Cloudflare",
  },
  { hostname: "stripe.com", url: "https://stripe.com", label: "Stripe" },
  { hostname: "openai.com", url: "https://openai.com", label: "OpenAI" },
] as const;

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

type ProbeResult = {
  status: "up" | "down";
  statusCode?: number;
  responseTime: number;
  errorMessage?: string;
};

async function runSingleProbe(url: string): Promise<ProbeResult> {
  const startedAt = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "HeartbeatIsItDown/1.0",
      },
    });

    const responseTime = Date.now() - startedAt;
    const status =
      response.status >= 200 && response.status < 400 ? "up" : "down";

    return {
      status,
      statusCode: response.status,
      responseTime,
      errorMessage: status === "up" ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: unknown) {
    const responseTime = Date.now() - startedAt;
    const errorMessage =
      error instanceof Error
        ? error.name === "AbortError"
          ? `Request timed out after ${PROBE_TIMEOUT_MS}ms`
          : error.message
        : "Unknown probe error";

    return {
      status: "down",
      responseTime,
      errorMessage,
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export const listTrackedTargets = query({
  args: {},
  returns: v.array(
    v.object({
      hostname: v.string(),
      url: v.string(),
      label: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const targets = await ctx.db.query("serviceTargets").collect();
    if (targets.length === 0) {
      return [...DEFAULT_TRACKED_TARGETS];
    }

    return targets
      .filter((target) => target.enabled)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((target) => ({
        hostname: target.hostname,
        url: target.url,
        label: target.label,
      }));
  },
});

export const getLatestProbeForTarget = query({
  args: { target: v.string() },
  returns: v.union(
    v.object({
      checkedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { probeUrl } = normalizeTargetInput(args.target);
    const latest = await ctx.db
      .query("serviceChecks")
      .withIndex("by_url", (q) => q.eq("url", probeUrl))
      .order("desc")
      .first();

    return latest ? { checkedAt: latest.checkedAt } : null;
  },
});

export const getLatestProbeForTargetInternal = internalQuery({
  args: { target: v.string() },
  returns: v.union(
    v.object({
      checkedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const { probeUrl } = normalizeTargetInput(args.target);
    const latest = await ctx.db
      .query("serviceChecks")
      .withIndex("by_url", (q) => q.eq("url", probeUrl))
      .order("desc")
      .first();

    return latest ? { checkedAt: latest.checkedAt } : null;
  },
});

export const getStatusForTarget = query({
  args: {
    target: v.string(),
  },
  returns: statusSnapshotValidator,
  handler: async (ctx, args) => {
    const { hostname, probeUrl } = normalizeTargetInput(args.target);
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    const recentChecks = await ctx.db
      .query("serviceChecks")
      .withIndex("by_url", (q) => q.eq("url", probeUrl))
      .order("desc")
      .take(10);

    const recentWindowChecks = recentChecks.filter(
      (check) => check.checkedAt >= tenMinutesAgo,
    );

    const indexedPublicMonitors = (
      await ctx.db
        .query("monitors")
        .withIndex("by_hostname", (q) => q.eq("hostname", hostname))
        .collect()
    )
      .filter((monitor) => monitor.enabled)
      .filter((monitor) => monitor.visibility === "public");

    const legacyPublicMonitors =
      indexedPublicMonitors.length === 0
        ? (
            await ctx.db
              .query("monitors")
              .withIndex("by_enabled", (q) => q.eq("enabled", true))
              .collect()
          )
            .filter((monitor) => !monitor.hostname)
            .filter((monitor) => monitor.visibility === "public")
            .filter((monitor) => extractHostname(monitor.url) === hostname)
        : [];

    const matchingPublicMonitors = [
      ...indexedPublicMonitors,
      ...legacyPublicMonitors,
    ].map((monitor) => ({
      monitorId: monitor._id,
      name: monitor.name,
      status: computeStatus(monitor.consecutiveFailures),
      statusSlug: monitor.statusSlug,
    }));

    const incidentPages = await Promise.all(
      matchingPublicMonitors.map((monitor) =>
        ctx.db
          .query("incidents")
          .withIndex("by_monitor", (q) => q.eq("monitorId", monitor.monitorId))
          .order("desc")
          .take(5),
      ),
    );

    const activeIncidents = incidentPages
      .flat()
      .filter((incident) => incident.status !== "resolved")
      .map((incident) => {
        const monitor = matchingPublicMonitors.find(
          (entry) => entry.monitorId === incident.monitorId,
        );
        return {
          incidentId: incident._id,
          monitorId: incident.monitorId,
          monitorName: monitor?.name ?? "Unknown monitor",
          title: incident.title,
          startedAt: incident.startedAt,
        };
      });

    const verdict = computeIsItDownVerdict({
      now,
      openIncidentCount: activeIncidents.length,
      samples: recentWindowChecks.map((check) => ({
        status: check.status,
        checkedAt: check.checkedAt,
        responseTime: check.responseTime,
        statusCode: check.statusCode,
        errorMessage: check.errorMessage,
      })),
    });

    return {
      hostname,
      probeUrl,
      verdict,
      summary: getIsItDownSummary(verdict, hostname),
      checkedAt: recentChecks[0]?.checkedAt,
      latestStatus: recentChecks[0]?.status,
      recentChecks: recentChecks.map((check) => ({
        status: check.status,
        statusCode: check.statusCode,
        responseTime: check.responseTime,
        errorMessage: check.errorMessage,
        checkedAt: check.checkedAt,
        source: check.source,
      })),
      recentSuccessCount: recentWindowChecks.filter(
        (check) => check.status === "up",
      ).length,
      recentFailureCount: recentWindowChecks.filter(
        (check) => check.status === "down",
      ).length,
      matchingPublicMonitors,
      activeIncidents,
    };
  },
});

export const probePublicTarget = action({
  args: { target: v.string() },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { hostname } = normalizeTargetInput(args.target);
    const latest = await ctx.runQuery(
      internal.isItDown.getLatestProbeForTargetInternal,
      {
        target: args.target,
      },
    );
    if (latest && Date.now() - latest.checkedAt <= ON_DEMAND_CACHE_WINDOW_MS) {
      return { ok: true };
    }

    await ctx.runAction(internal.isItDown.probeTargetInternal, {
      target: args.target,
      source: "on_demand",
    });

    return { ok: true };
  },
});

export const probeTrackedTargets = internalAction({
  args: {},
  returns: v.object({
    total: v.number(),
    succeeded: v.number(),
    failed: v.number(),
  }),
  handler: async (
    ctx,
  ): Promise<{ total: number; succeeded: number; failed: number }> => {
    await ctx.runMutation(internal.isItDown.seedDefaultTargets);
    const targets: Array<{
      _id: Id<"serviceTargets">;
      hostname: string;
      url: string;
      label: string;
    }> = await ctx.runQuery(internal.isItDown.listEnabledTargets);

    const results = await Promise.allSettled(
      targets.map((target: { _id: Id<"serviceTargets">; url: string }) =>
        ctx.runAction(internal.isItDown.probeTargetInternal, {
          target: target.url,
          source: "scheduled",
          targetId: target._id,
        }),
      ),
    );

    return {
      total: targets.length,
      succeeded: results.filter((result) => result.status === "fulfilled")
        .length,
      failed: results.filter((result) => result.status === "rejected").length,
    };
  },
});

export const probeTargetInternal = internalAction({
  args: {
    target: v.string(),
    source: v.union(v.literal("scheduled"), v.literal("on_demand")),
    targetId: v.optional(v.id("serviceTargets")),
  },
  handler: async (ctx, args) => {
    const { hostname, probeUrl } = normalizeTargetInput(args.target);
    const urlValidation = isAllowedUrl(probeUrl);

    if (!urlValidation.allowed) {
      throw new Error(urlValidation.reason);
    }

    const probes = await Promise.all([
      runSingleProbe(probeUrl),
      runSingleProbe(probeUrl),
      runSingleProbe(probeUrl),
    ]);

    const checkedAt = Date.now();
    await Promise.all(
      probes.map((probe) =>
        ctx.runMutation(internal.isItDown.recordServiceCheck, {
          hostname,
          url: probeUrl,
          status: probe.status,
          statusCode: probe.statusCode,
          responseTime: probe.responseTime,
          errorMessage: probe.errorMessage,
          source: args.source,
          targetId: args.targetId,
          checkedAt,
        }),
      ),
    );
  },
});

export const seedDefaultTargets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    for (const target of DEFAULT_TRACKED_TARGETS) {
      const existing = await ctx.db
        .query("serviceTargets")
        .withIndex("by_hostname", (q) => q.eq("hostname", target.hostname))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          url: target.url,
          label: target.label,
          enabled: true,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("serviceTargets", {
          hostname: target.hostname,
          url: target.url,
          label: target.label,
          enabled: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

export const listEnabledTargets = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("serviceTargets"),
      hostname: v.string(),
      url: v.string(),
      label: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const targets = await ctx.db
      .query("serviceTargets")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    return targets.map((target) => ({
      _id: target._id,
      hostname: target.hostname,
      url: target.url,
      label: target.label,
    }));
  },
});

export const recordServiceCheck = internalMutation({
  args: {
    hostname: v.string(),
    url: v.string(),
    status: v.union(v.literal("up"), v.literal("down")),
    statusCode: v.optional(v.number()),
    responseTime: v.number(),
    errorMessage: v.optional(v.string()),
    source: v.union(v.literal("scheduled"), v.literal("on_demand")),
    targetId: v.optional(v.id("serviceTargets")),
    checkedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("serviceChecks", args);
  },
});

export const cleanupOldServiceChecks = internalAction({
  args: {},
  handler: async (ctx) => {
    const cutoff =
      Date.now() - SERVICE_CHECK_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    while (true) {
      const batch = await ctx.runQuery(internal.isItDown.getOldServiceChecks, {
        beforeTimestamp: cutoff,
      });

      if (batch.length === 0) {
        break;
      }

      await ctx.runMutation(internal.isItDown.deleteServiceChecks, {
        checkIds: batch.map((check: { _id: Id<"serviceChecks"> }) => check._id),
      });
      totalDeleted += batch.length;
    }

    return { totalDeleted };
  },
});

export const getOldServiceChecks = internalQuery({
  args: {
    beforeTimestamp: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("serviceChecks"),
    }),
  ),
  handler: async (ctx, args) => {
    const oldChecks = await ctx.db
      .query("serviceChecks")
      .withIndex("by_checked_at", (q) =>
        q.lt("checkedAt", args.beforeTimestamp),
      )
      .take(1000);

    return oldChecks.map((check) => ({ _id: check._id }));
  },
});

export const deleteServiceChecks = internalMutation({
  args: {
    checkIds: v.array(v.id("serviceChecks")),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.checkIds.map((checkId) => ctx.db.delete(checkId)));
  },
});
