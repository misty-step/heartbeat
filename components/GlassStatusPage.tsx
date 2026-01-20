"use client";

import { cn } from "@/lib/cn";
import { type MonitorStatus } from "@/lib/domain";
import {
  formatRelativeTime,
  formatTimestamp,
  calculateDuration,
} from "@/lib/domain/formatting";

/**
 * GlassStatusPage - Kyoto Moss Design System
 *
 * Glass Dashboard status page design:
 * - Clean header with service name + status pill
 * - Bento grid with uptime, response, checks, incidents cards
 * - Bar block visualization for uptime history
 * - Incident timeline below
 */

interface ChartDataPoint {
  timestamp: number;
  responseTime: number;
  status: MonitorStatus;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startedAt: Date;
  resolvedAt?: Date;
  updates?: Array<{
    message: string;
    timestamp: Date;
  }>;
}

interface GlassStatusPageProps {
  monitorName: string;
  status: MonitorStatus;
  uptimePercentage: number;
  avgResponseTime: number;
  totalChecks?: number;
  lastCheckAt?: number;
  chartData: ChartDataPoint[];
  incidents: Incident[];
}

// Status configuration
const statusConfig = {
  up: {
    label: "Operational",
    dot: "bg-[var(--color-status-up)]",
    border: "border-[var(--color-status-up)]",
    text: "text-[var(--color-status-up)]",
    bgMuted: "bg-[var(--color-status-up)]/10",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-[var(--color-status-degraded)]",
    border: "border-[var(--color-status-degraded)]",
    text: "text-[var(--color-status-degraded)]",
    bgMuted: "bg-[var(--color-status-degraded)]/10",
  },
  down: {
    label: "Outage",
    dot: "bg-[var(--color-status-down)]",
    border: "border-[var(--color-status-down)]",
    text: "text-[var(--color-status-down)]",
    bgMuted: "bg-[var(--color-status-down)]/10",
  },
};

// Incident status configuration
const incidentStatusConfig = {
  investigating: {
    label: "Investigating",
    dot: "bg-[var(--color-status-degraded)]",
    badge:
      "bg-[var(--color-status-degraded)]/10 text-[var(--color-status-degraded)]",
  },
  identified: {
    label: "Identified",
    dot: "bg-[var(--color-status-down)]",
    badge: "bg-[var(--color-status-down)]/10 text-[var(--color-status-down)]",
  },
  monitoring: {
    label: "Monitoring",
    dot: "bg-[var(--color-accent-secondary)]",
    badge:
      "bg-[var(--color-accent-secondary)]/10 text-[var(--color-accent-secondary)]",
  },
  resolved: {
    label: "Resolved",
    dot: "bg-[var(--color-status-up)]",
    badge: "bg-[var(--color-status-up)]/10 text-[var(--color-status-up)]",
  },
};

export function GlassStatusPage({
  monitorName,
  status,
  uptimePercentage,
  avgResponseTime,
  totalChecks,
  lastCheckAt,
  chartData,
  incidents,
}: GlassStatusPageProps) {
  const config = statusConfig[status];

  // Calculate P95 from chart data
  const sortedResponseTimes = [...chartData]
    .map((d) => d.responseTime)
    .sort((a, b) => a - b);
  const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
  const p95ResponseTime = sortedResponseTimes[p95Index] ?? avgResponseTime;

  // Get last 30 days of data for bar visualization
  const last30Days = chartData.slice(-30);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="px-6 py-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-medium text-[var(--color-text-primary)] tracking-tight">
              {monitorName}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Real-time status
              {lastCheckAt && ` · Updated ${formatRelativeTime(lastCheckAt)}`}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-full",
              "bg-[var(--color-bg-elevated)]",
              "border-2",
              config.border,
              "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]",
            )}
          >
            <div
              className={cn(
                "size-2.5 rounded-full",
                config.dot,
                status === "up" && "animate-[pulse_3s_ease-in-out_infinite]",
              )}
            />
            <span className={cn("text-sm font-medium", config.text)}>
              {config.label}
            </span>
          </div>
        </div>
      </header>

      {/* Bento grid */}
      <div className="px-6 pb-12 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-6 gap-4">
          {/* Large uptime card - 4 cols */}
          <div
            className={cn(
              "sm:col-span-4 p-6 sm:p-8 rounded-2xl",
              "bg-[var(--color-bg-elevated)]",
              "border border-[var(--color-border-subtle)]",
              "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_8px_30px_-8px_rgba(0,0,0,0.06)]",
              "hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12),0_12px_40px_-10px_rgba(0,0,0,0.08)]",
              "hover:-translate-y-0.5 transition-all duration-200",
            )}
          >
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-3">
              30-Day Uptime
            </p>
            <p
              className={cn(
                "text-5xl sm:text-6xl font-mono font-medium tracking-tight",
                config.text,
              )}
            >
              {uptimePercentage.toFixed(2)}
              <span className="text-[0.4em] text-[var(--color-text-muted)] ml-1">
                %
              </span>
            </p>

            {/* Uptime bar */}
            {last30Days.length > 0 && (
              <>
                <div className="mt-8 flex gap-[3px]">
                  {last30Days.map((check, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 h-3 rounded-[2px] transition-all duration-150",
                        check.status === "up"
                          ? "bg-[var(--color-status-up)]/25 hover:bg-[var(--color-status-up)]/40"
                          : check.status === "degraded"
                            ? "bg-[var(--color-status-degraded)]/25 hover:bg-[var(--color-status-degraded)]/40"
                            : "bg-[var(--color-status-down)] hover:bg-[var(--color-status-down)]/80",
                      )}
                      title={
                        check.status === "down"
                          ? "Down"
                          : `${Math.round(check.responseTime)}ms`
                      }
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-[var(--color-text-muted)]">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </>
            )}
          </div>

          {/* Response time - 2 cols */}
          <div
            className={cn(
              "sm:col-span-2 p-6 rounded-2xl",
              "bg-[var(--color-bg-elevated)]",
              "border border-[var(--color-border-subtle)]",
              "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]",
              "hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.12)]",
              "hover:-translate-y-0.5 transition-all duration-200",
            )}
          >
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-3">
              Avg Response
            </p>
            <p className="text-4xl font-mono font-medium text-[var(--color-text-primary)] tracking-tight">
              {Math.round(avgResponseTime)}
              <span className="text-[0.5em] text-[var(--color-text-muted)] ml-1">
                ms
              </span>
            </p>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              P95: {Math.round(p95ResponseTime)}ms
            </p>
          </div>

          {/* Total checks - 3 cols */}
          <div
            className={cn(
              "sm:col-span-3 p-6 rounded-2xl",
              "bg-[var(--color-bg-elevated)]",
              "border border-[var(--color-border-subtle)]",
              "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]",
            )}
          >
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-3">
              Total Checks
            </p>
            <p className="text-3xl font-mono font-medium text-[var(--color-text-primary)] tracking-tight">
              {totalChecks !== undefined
                ? totalChecks.toLocaleString()
                : chartData.length.toLocaleString()}
            </p>
          </div>

          {/* Incidents - 3 cols */}
          <div
            className={cn(
              "sm:col-span-3 p-6 rounded-2xl",
              "bg-[var(--color-bg-elevated)]",
              "border border-[var(--color-border-subtle)]",
              "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]",
            )}
          >
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-3">
              Incidents (90d)
            </p>
            <p className="text-3xl font-mono font-medium text-[var(--color-text-primary)] tracking-tight">
              {incidents.length}
            </p>
            {incidents.length > 0 && (
              <p className="mt-2 text-xs text-[var(--color-text-muted)] truncate">
                Last: {incidents[0].title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Incident history section */}
      {incidents.length > 0 && (
        <div className="px-6 pb-12 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <div
              className={cn(
                "p-6 rounded-2xl",
                "bg-[var(--color-bg-elevated)]",
                "border border-[var(--color-border-subtle)]",
                "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]",
              )}
            >
              <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-4">
                Incident History
              </p>
              <div className="space-y-4">
                {incidents.map((incident) => {
                  const incidentConfig = incidentStatusConfig[incident.status];
                  return (
                    <div
                      key={incident.id}
                      className="py-3 border-b border-[var(--color-border-subtle)] last:border-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              "size-2 rounded-full mt-1.5 flex-shrink-0",
                              incidentConfig.dot,
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                              {incident.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                              {formatTimestamp(incident.startedAt)}
                              {incident.resolvedAt && (
                                <>
                                  {" "}
                                  · Resolved{" "}
                                  {formatTimestamp(incident.resolvedAt)}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {calculateDuration(
                              incident.startedAt,
                              incident.resolvedAt,
                            )}
                          </span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              incidentConfig.badge,
                            )}
                          >
                            {incidentConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Updates */}
                      {incident.updates && incident.updates.length > 0 && (
                        <div className="mt-3 ml-5 pl-3 border-l border-[var(--color-border-subtle)] space-y-2">
                          {incident.updates.map((update, i) => (
                            <div key={i}>
                              <p className="text-sm text-[var(--color-text-tertiary)]">
                                {update.message}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                {formatTimestamp(update.timestamp)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No incidents message */}
      {incidents.length === 0 && (
        <div className="px-6 pb-12 sm:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <p className="text-sm text-[var(--color-text-muted)]">
                No incidents recorded in the last 90 days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
