"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface UptimeBarProps {
  monitorId: Id<"monitors">;
  days?: number;
}

export function UptimeBar({ monitorId, days = 30 }: UptimeBarProps) {
  const uptimeStats = useQuery(api.checks.getUptimeStats, { monitorId, days });

  if (!uptimeStats) {
    // Loading state - show placeholder bars
    return (
      <div className="flex gap-[2px]">
        {Array.from({ length: days }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-6 bg-foreground/5 animate-pulse"
            style={{ animationDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
    );
  }

  // Generate day-by-day status from checks data
  // For now, use uptime percentage to determine overall status
  const overallStatus = uptimeStats.uptimePercentage >= 99 ? "up"
    : uptimeStats.uptimePercentage >= 90 ? "degraded"
    : "down";

  // Simple visualization: all bars same color based on overall status
  // In a real implementation, you'd have daily stats
  const getBarColor = (status: string) => {
    switch (status) {
      case "up": return "bg-foreground";
      case "degraded": return "bg-degraded";
      case "down": return "bg-down";
      default: return "bg-foreground/10";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-[2px]">
        {Array.from({ length: days }).map((_, i) => {
          // Simulate some variation - most recent days are operational
          const dayStatus = i < days - uptimeStats.failedChecks ? "up" : "down";
          return (
            <div
              key={i}
              className={`flex-1 h-6 transition-all hover:opacity-70 ${getBarColor(dayStatus)}`}
              title={`Day ${days - i}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-foreground/40">
        <span>{days} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// Simple version without API call - for cases where we have the data
export function UptimeBarSimple({
  percentage,
  days = 30
}: {
  percentage: number;
  days?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-[2px]">
        {Array.from({ length: days }).map((_, i) => {
          // Fill from left to right based on percentage
          const filled = i < Math.floor((percentage / 100) * days);
          return (
            <div
              key={i}
              className={`flex-1 h-6 transition-all ${
                filled ? "bg-foreground" : "bg-foreground/10"
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-foreground/40">
        <span>{days} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
