"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { StatusIndicator } from "./StatusIndicator";
import { Settings, Play, ChevronDown, ChevronUp } from "lucide-react";

interface DashboardMonitorCardProps {
  monitor: {
    _id: Id<"monitors">;
    name: string;
    projectSlug: string;
    consecutiveFailures: number;
    lastResponseTime?: number;
    lastCheckAt?: number;
  };
  onEdit: () => void;
}

export function DashboardMonitorCard({ monitor, onEdit }: DashboardMonitorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch uptime stats when expanded
  const uptimeStats = useQuery(
    api.checks.getUptimeStats,
    isExpanded ? { monitorId: monitor._id, days: 30 } : "skip"
  );

  // Fetch recent checks when expanded
  const recentChecks = useQuery(
    api.checks.getRecentForMonitor,
    isExpanded ? { monitorId: monitor._id, limit: 10 } : "skip"
  );

  const getStatus = () => {
    if (monitor.consecutiveFailures === 0) return "up";
    if (monitor.consecutiveFailures < 3) return "degraded";
    return "down";
  };

  const getStatusText = () => {
    if (monitor.consecutiveFailures === 0) return "Operational";
    if (monitor.consecutiveFailures < 3) return "Degraded";
    return "Down";
  };

  const status = getStatus();

  return (
    <div className="bg-surface rounded-lg border border-border hover:border-border-strong transition-colors">
      {/* Card header - always visible */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Monitor info */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-text-primary truncate">
                {monitor.name}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                  title="Edit monitor"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement manual check trigger
                  }}
                  className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                  title="Run check now"
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-text-tertiary truncate">
              {monitor.projectSlug}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusIndicator status={status} />
            <span className="text-sm text-text-secondary">
              {getStatusText()}
            </span>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t border-border space-y-2">
            {monitor.lastResponseTime !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Response time</span>
                <span className="font-mono text-text-primary tabular-nums">
                  {monitor.lastResponseTime}ms
                </span>
              </div>
            )}
            {monitor.lastCheckAt && (
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Last check</span>
                <span className="text-text-secondary">
                  {new Date(monitor.lastCheckAt).toLocaleTimeString()}
                </span>
              </div>
            )}
            {uptimeStats && (
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Uptime (30d)</span>
                <span className="font-mono text-text-primary tabular-nums">
                  {uptimeStats.uptimePercentage.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 pt-4 text-sm text-text-tertiary hover:text-text-primary transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Show details</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border p-6 space-y-4">
          {/* Recent checks */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary">
              Recent Checks
            </h4>
            {recentChecks === undefined ? (
              <div className="text-sm text-text-tertiary">Loading...</div>
            ) : recentChecks.length === 0 ? (
              <div className="text-sm text-text-tertiary">No checks yet</div>
            ) : (
              <div className="space-y-1">
                {recentChecks.map((check) => (
                  <div
                    key={check._id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          check.status === "up"
                            ? "bg-success"
                            : check.status === "degraded"
                            ? "bg-warning"
                            : "bg-error"
                        }`}
                      />
                      <span className="text-text-secondary">
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
                        <span className="text-text-tertiary text-xs">
                          {check.statusCode}
                        </span>
                      )}
                      <span className="font-mono text-text-primary tabular-nums text-xs">
                        {check.responseTime}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response time trend summary */}
          {uptimeStats && uptimeStats.avgResponseTime && (
            <div className="pt-4 border-t border-border">
              <div className="text-sm">
                <span className="text-text-tertiary">Average response: </span>
                <span className="font-mono text-text-primary tabular-nums">
                  {uptimeStats.avgResponseTime}ms
                </span>
              </div>
              <div className="text-sm mt-1">
                <span className="text-text-tertiary">
                  {uptimeStats.successfulChecks} successful checks,{" "}
                  {uptimeStats.failedChecks} failures
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
