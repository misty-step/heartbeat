/**
 * DashboardPreviewCard
 *
 * A landing page component that visually matches the authenticated dashboard's
 * DashboardMonitorCard aesthetic, but uses static/dummy data.
 *
 * Features:
 * - Gradient accent line at top
 * - Multi-layer shadow for depth
 * - Breathing status indicator
 * - Bar chart visualization (static)
 * - Response time display
 */

import { cn } from "@/lib/cn";

type Status = "up" | "degraded" | "down";

interface Monitor {
  name: string;
  url: string;
  status: Status;
  responseTime: number;
  /** 20 recent checks for bar visualization */
  history: { status: Status; responseTime: number }[];
}

interface DashboardPreviewCardProps {
  /** Service/project name */
  title: string;
  /** List of monitors to display */
  monitors: Monitor[];
  /** Optional className */
  className?: string;
}

// Status styling
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

const statusMessage = {
  up: "All checks passing",
  degraded: "High latency detected",
  down: "Service unavailable",
} as const;

export function DashboardPreviewCard({
  title,
  monitors,
  className,
}: DashboardPreviewCardProps) {
  // Aggregate status
  const hasDown = monitors.some((m) => m.status === "down");
  const hasDegraded = monitors.some((m) => m.status === "degraded");
  const aggregateStatus: Status = hasDown
    ? "down"
    : hasDegraded
      ? "degraded"
      : "up";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header card */}
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="relative flex-shrink-0">
            <div
              className={cn("size-3 rounded-full", dotColor[aggregateStatus])}
            />
            {aggregateStatus === "up" && (
              <div
                className={cn(
                  "absolute inset-[-4px] rounded-full border-2 opacity-30 animate-hs-ember-flicker",
                  ringColor[aggregateStatus],
                )}
              />
            )}
          </div>
          <h3 className="font-medium text-lg text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] pl-6">
          {monitors.length} {monitors.length === 1 ? "monitor" : "monitors"}{" "}
          active
        </p>
      </div>

      {/* Monitor cards */}
      {monitors.map((monitor) => (
        <MonitorCard key={monitor.name} monitor={monitor} />
      ))}
    </div>
  );
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const { name, url, status, responseTime, history } = monitor;

  return (
    <div className="group relative">
      {/* Gradient accent line at top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r to-transparent z-10 rounded-t-sm",
          accentGradient[status],
        )}
      />

      {/* Main card */}
      <div
        className={cn(
          "bg-[var(--color-bg-elevated)]",
          "border border-[var(--color-border-subtle)]",
          "rounded-sm",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15),0_8px_30px_-8px_rgba(0,0,0,0.1)]",
        )}
      >
        <div className="p-4">
          {/* Top row: Status dot + Name */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <div className={cn("size-2.5 rounded-full", dotColor[status])} />
              {status === "up" && (
                <div
                  className={cn(
                    "absolute inset-[-3px] rounded-full border-2 opacity-30 animate-hs-ember-flicker",
                    ringColor[status],
                  )}
                />
              )}
            </div>
            <h4 className="font-medium text-sm text-[var(--color-text-primary)] truncate">
              {name}
            </h4>
          </div>

          {/* URL */}
          <p className="text-[10px] text-[var(--color-text-muted)] font-mono truncate mb-3">
            {url}
          </p>

          {/* Bar chart visualization */}
          <div className="flex items-end gap-[2px] h-6">
            {history.map((check, i) => {
              const height = Math.min(100, (check.responseTime / 500) * 100);
              const isDown = check.status === "down";
              const isDegraded = check.status === "degraded";

              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-t-[1px] transition-all duration-200",
                    isDown
                      ? "bg-[var(--color-status-down)]/60"
                      : isDegraded
                        ? "bg-[var(--color-status-degraded)]/60"
                        : "bg-[var(--color-text-tertiary)]/40",
                  )}
                  style={{ height: `${Math.max(15, height)}%` }}
                />
              );
            })}
          </div>

          {/* Stats footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border-subtle)]/50">
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              {statusMessage[status]}
            </span>
            <span className="font-mono text-xs text-[var(--color-text-primary)] tabular-nums">
              {responseTime}
              <span className="text-[var(--color-text-muted)] text-[9px]">
                ms
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to generate dummy history data
export function generateDummyHistory(
  status: Status = "up",
  count: number = 20,
): { status: Status; responseTime: number }[] {
  return Array.from({ length: count }, (_, i) => {
    // Add some variation for visual interest
    const baseTime = status === "up" ? 120 : status === "degraded" ? 350 : 50;
    const variance = Math.random() * 80 - 40;
    const isRecent = i >= count - 3;

    return {
      status: isRecent && status !== "up" ? status : "up",
      responseTime: Math.max(50, Math.round(baseTime + variance)),
    };
  });
}
