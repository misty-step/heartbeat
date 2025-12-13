"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface UptimeBarProps {
  monitorId: Id<"monitors">;
  days?: number;
}

type DayStatus = "up" | "degraded" | "down";

const getBarColor = (status: DayStatus | "unknown") => {
  switch (status) {
    case "up":
      return "bg-foreground";
    case "degraded":
      return "bg-degraded";
    case "down":
      return "bg-down";
    default:
      return "bg-foreground/10";
  }
};

export function UptimeBar({ monitorId, days = 30 }: UptimeBarProps) {
  const dailyStatus = useQuery(api.checks.getDailyStatus, { monitorId, days });

  if (!dailyStatus) {
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

  // Build a map of date -> status for quick lookup
  const statusByDate = new Map(dailyStatus.map((d) => [d.date, d.status]));

  // Generate array of dates for the past N days
  const today = new Date();
  const dateRange: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dateRange.push(date.toISOString().split("T")[0]);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-[2px]">
        {dateRange.map((date, i) => {
          const status = statusByDate.get(date) ?? "unknown";
          return (
            <div
              key={date}
              className={`flex-1 h-6 transition-all hover:opacity-70 ${getBarColor(status)}`}
              title={date}
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
  days = 30,
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
