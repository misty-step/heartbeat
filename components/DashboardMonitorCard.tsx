"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { StatusIndicator } from "./StatusIndicator";
import { UptimeBar } from "./UptimeBar";
import { Settings, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { computeStatus, getStatusLabel } from "@/lib/domain";

interface DashboardMonitorCardProps {
  monitor: {
    _id: Id<"monitors">;
    name: string;
    url: string;
    projectSlug: string;
    statusSlug?: string;
    consecutiveFailures: number;
    lastResponseTime?: number;
    lastCheckAt?: number;
  };
  onEdit: () => void;
}

export function DashboardMonitorCard({
  monitor,
  onEdit,
}: DashboardMonitorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch recent checks when expanded
  const recentChecks = useQuery(
    api.checks.getRecentForMonitor,
    isExpanded ? { monitorId: monitor._id, limit: 10 } : "skip",
  );

  // Use domain functions for status computation
  const status = computeStatus(monitor.consecutiveFailures);
  const statusText = getStatusLabel(status);

  return (
    <div className="group bg-background border border-foreground/10 hover:border-foreground/20 hover:shadow-sm transition-all duration-200">
      {/* Card header */}
      <div className="p-5">
        <div className="space-y-5">
          {/* Top row: Status + Name + Settings */}
          <div className="flex items-center gap-3">
            {/* Status indicator - xl with cinematic animation */}
            <div className="flex-shrink-0">
              <StatusIndicator status={status} size="xl" cinematic />
            </div>

            {/* Name and URL */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg text-foreground truncate leading-tight">
                {monitor.name}
              </h3>
              <p className="text-[11px] text-foreground/40 truncate font-mono mt-1">
                {monitor.url}
              </p>
            </div>

            {/* Action buttons - hover reveal */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {monitor.statusSlug && (
                <a
                  href={`/status/${monitor.statusSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-foreground/20 hover:text-foreground hover:bg-foreground/5 transition-all duration-150"
                  title="View Status Page"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 text-foreground/20 hover:text-foreground hover:bg-foreground/5 transition-all duration-150"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Uptime visualization */}
          <UptimeBar monitorId={monitor._id} days={30} />

          {/* Status + Response time */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">{statusText}</span>
            {monitor.lastResponseTime !== undefined && (
              <span className="font-mono text-foreground/40 tabular-nums">
                {monitor.lastResponseTime}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <div className="border-t border-foreground/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-xs text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.02] transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              <span>Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              <span>Details</span>
            </>
          )}
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-foreground/5 p-6 space-y-4">
          {/* Recent checks */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
              Recent Checks
            </h4>
            {recentChecks === undefined ? (
              <div className="text-sm text-foreground/40">Loading...</div>
            ) : recentChecks.length === 0 ? (
              <div className="text-sm text-foreground/40">No checks yet</div>
            ) : (
              <div className="space-y-1">
                {recentChecks.map((check) => (
                  <div
                    key={check._id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-foreground/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          check.status === "up"
                            ? "bg-foreground"
                            : check.status === "degraded"
                              ? "bg-degraded"
                              : "bg-down"
                        }`}
                      />
                      <span className="text-foreground/60 text-xs">
                        {new Date(check.checkedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {check.statusCode !== undefined && (
                        <span className="text-foreground/40 text-xs font-mono">
                          {check.statusCode}
                        </span>
                      )}
                      <span className="font-mono text-foreground/60 tabular-nums text-xs">
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
            <div className="pt-4 border-t border-foreground/5 text-xs text-foreground/40">
              Last checked {new Date(monitor.lastCheckAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
