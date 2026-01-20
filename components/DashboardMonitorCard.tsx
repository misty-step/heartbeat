"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { UptimeBar } from "./UptimeBar";
import { Settings, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { computeStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";

/**
 * DashboardMonitorCard - Glass Edge + Depth Design
 *
 * Key design elements:
 * - Top gradient accent line (fades from status color)
 * - Multi-layer shadow for floating depth
 * - Breathing status ring animation
 * - Bar chart visualization for recent checks
 * - Lift on hover
 */

interface DashboardMonitorCardProps {
  monitor: {
    _id: Id<"monitors">;
    name: string;
    url: string;
    projectSlug: string;
    statusSlug?: string;
    visibility?: "public" | "private";
    consecutiveFailures: number;
    lastResponseTime?: number;
    lastCheckAt?: number;
  };
  onEdit: () => void;
}

// Status-specific styling maps
const accentGradient = {
  up: "from-[var(--color-status-up)]",
  degraded: "from-[var(--color-status-degraded)]",
  down: "from-[var(--color-status-down)]",
} as const;

const dotColor = {
  up: "bg-[var(--color-status-up)]",
  degraded: "bg-[var(--color-status-degraded)]",
  down: "bg-[var(--color-status-down)]",
} as const;

const ringColor = {
  up: "border-[var(--color-status-up)]",
  degraded: "border-[var(--color-status-degraded)]",
  down: "border-[var(--color-status-down)]",
} as const;

export function DashboardMonitorCard({
  monitor,
  onEdit,
}: DashboardMonitorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch recent checks for bar visualization
  const recentChecks = useQuery(api.checks.getRecentForMonitor, {
    monitorId: monitor._id,
    limit: 20,
  });

  const status = computeStatus(monitor.consecutiveFailures);

  // Status message based on state
  const statusMessage = {
    up: "All checks passing",
    degraded: "High latency detected",
    down: "Service unavailable",
  }[status];

  // Prepare bar data (reversed so newest is on right)
  const barData = recentChecks?.slice().reverse() ?? [];

  return (
    <div className="group relative">
      {/* Gradient accent line at top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r to-transparent z-10 rounded-t-sm",
          accentGradient[status],
        )}
      />

      {/* Main card with depth */}
      <div
        className={cn(
          "bg-[var(--color-bg-elevated)]",
          "border border-[var(--color-border-subtle)]",
          "rounded-sm",
          // Multi-layer shadow for depth
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15),0_8px_30px_-8px_rgba(0,0,0,0.1)]",
          // Subtle inset highlight
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
          // Hover: lift and deepen shadow
          "hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.2),0_12px_40px_-10px_rgba(0,0,0,0.15)]",
          "hover:-translate-y-0.5",
          "hover:border-[var(--color-border-default)]",
          "transition-all duration-200",
        )}
      >
        <div className="p-5">
          {/* Top row: Status dot + Name + Actions */}
          <div className="flex items-center gap-3 mb-4">
            {/* Breathing status dot */}
            <div className="relative flex-shrink-0">
              <div className={cn("size-3 rounded-full", dotColor[status])} />
              {status === "up" && (
                <div
                  className={cn(
                    "absolute inset-[-3px] rounded-full border-2 opacity-30 animate-km-breathe-subtle",
                    ringColor[status],
                  )}
                />
              )}
              {status === "down" && (
                <div
                  className={cn(
                    "absolute inset-[-3px] rounded-full border-2 opacity-40 animate-pulse",
                    ringColor[status],
                  )}
                />
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[15px] text-[var(--color-text-primary)] truncate">
                {monitor.name}
              </h3>
            </div>

            {/* Actions - visible on mobile, hover reveal on desktop */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {monitor.visibility === "public" && monitor.statusSlug && (
                <a
                  href={`/status/${monitor.statusSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
                  aria-label="View Status Page"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded transition-colors"
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </button>
            </div>
          </div>

          {/* URL */}
          <p className="text-[11px] text-[var(--color-text-muted)] font-mono truncate mb-4">
            {monitor.url}
          </p>

          {/* Bar chart visualization */}
          <div className="flex items-end gap-[3px] h-8">
            {barData.length > 0
              ? barData.map((check, i) => {
                  // Normalize response time (cap at 500ms for visualization)
                  const height = Math.min(
                    100,
                    ((check.responseTime ?? 100) / 500) * 100,
                  );
                  const isDown = check.status === "down";
                  const isDegraded = check.status === "degraded";

                  return (
                    <div
                      key={check._id}
                      className={cn(
                        "flex-1 rounded-t-[2px] transition-all duration-200",
                        isDown
                          ? "bg-[var(--color-status-down)]/60 group-hover:bg-[var(--color-status-down)]/70"
                          : isDegraded
                            ? "bg-[var(--color-status-degraded)]/60 group-hover:bg-[var(--color-status-degraded)]/70"
                            : "bg-[var(--color-text-tertiary)]/40 group-hover:bg-[var(--color-text-tertiary)]/50",
                      )}
                      style={{ height: `${Math.max(15, height)}%` }}
                      title={`${check.responseTime}ms`}
                    />
                  );
                })
              : // Loading skeleton
                Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[2px] bg-[var(--color-border-subtle)] animate-pulse"
                    style={{ height: `${30 + ((i * 7) % 40)}%` }}
                  />
                ))}
          </div>

          {/* Stats footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--color-border-subtle)]/50">
            <span className="text-xs text-[var(--color-text-secondary)]">
              {statusMessage}
            </span>
            {monitor.lastResponseTime !== undefined && (
              <span className="font-mono text-sm text-[var(--color-text-primary)] tabular-nums">
                {monitor.lastResponseTime}
                <span className="text-[var(--color-text-muted)] text-xs">
                  ms
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Expandable details toggle */}
        <div className="border-t border-[var(--color-border-subtle)]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-5 py-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-3" />
                <span>Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                <span>Details</span>
              </>
            )}
          </button>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-[var(--color-border-subtle)] p-5 space-y-5">
            {/* 30-day uptime overview */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                30-Day Overview
              </h4>
              <UptimeBar monitorId={monitor._id} days={30} />
            </div>

            {/* Recent checks list */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Recent Checks
              </h4>
              {recentChecks === undefined ? (
                <div className="text-xs text-[var(--color-text-muted)]">
                  Loading...
                </div>
              ) : recentChecks.length === 0 ? (
                <div className="text-xs text-[var(--color-text-muted)]">
                  No checks yet
                </div>
              ) : (
                <div className="space-y-1">
                  {recentChecks.slice(0, 10).map((check) => (
                    <div
                      key={check._id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border-subtle)]/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "size-1.5 rounded-full",
                            check.status === "up"
                              ? "bg-up"
                              : check.status === "degraded"
                                ? "bg-degraded"
                                : "bg-down",
                          )}
                        />
                        <span className="text-[var(--color-text-secondary)]">
                          {new Date(check.checkedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {check.statusCode !== undefined && (
                          <span className="text-[var(--color-text-muted)] font-mono">
                            {check.statusCode}
                          </span>
                        )}
                        <span className="font-mono text-[var(--color-text-secondary)] tabular-nums">
                          {check.responseTime}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Last check time */}
            {monitor.lastCheckAt && (
              <div className="pt-3 border-t border-[var(--color-border-subtle)]/50 text-[10px] text-[var(--color-text-muted)]">
                Last checked{" "}
                {new Date(monitor.lastCheckAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
