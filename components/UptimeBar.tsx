"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { cn } from "@/lib/cn";
import { getStatusLabel as getDomainStatusLabel } from "@/lib/domain";

interface UptimeBarProps {
  monitorId: Id<"monitors">;
  days?: number;
}

type DayStatus = "up" | "degraded" | "down";

const getBarColor = (status: DayStatus | "unknown") => {
  switch (status) {
    case "up":
      return "bg-up";
    case "degraded":
      return "bg-degraded";
    case "down":
      return "bg-down";
    default:
      return "bg-[var(--color-border-subtle)]";
  }
};

const getStatusLabel = (status: DayStatus | "unknown") =>
  status === "unknown" ? "No data" : getDomainStatusLabel(status);

const formatDate = (dateStr: string) => {
  // Use noon UTC to stay within the UTC day regardless of local offset.
  // The monitoring data keys are UTC dates, so display must match.
  const date = new Date(dateStr + "T12:00:00Z");
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

export function UptimeBar({ monitorId, days = 30 }: UptimeBarProps) {
  const dailyStatus = useQuery(api.checks.getDailyStatus, { monitorId, days });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoized: only recomputes when dailyStatus changes, not on hover re-renders
  const dataByDate = useMemo(
    () => new Map((dailyStatus ?? []).map((d) => [d.date, d])),
    [dailyStatus],
  );

  // Memoized: stable array of UTC date strings for the past N days
  const dateRange = useMemo(() => {
    const today = new Date();
    const range: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      range.push(date.toISOString().split("T")[0]);
    }
    return range;
  }, [days]);

  if (!dailyStatus) {
    // Loading state - show placeholder bars
    return (
      <div className="flex gap-[2px]">
        {Array.from({ length: days }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-6 bg-[var(--color-border-subtle)] animate-pulse"
            style={{ animationDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
    );
  }

  // Pre-compute hovered day data for tooltip
  const hoveredDate = hoveredIndex !== null ? dateRange[hoveredIndex] : null;
  const hoveredDayData = hoveredDate ? dataByDate.get(hoveredDate) : null;
  const hoveredStatus = hoveredDayData?.status ?? "unknown";

  return (
    <div className="space-y-2">
      <div
        className="relative flex gap-[2px]"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {dateRange.map((date, i) => {
          const dayData = dataByDate.get(date);
          const status = dayData?.status ?? "unknown";
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={date}
              data-date={date}
              className={cn(
                "flex-1 h-6 transition-transform origin-bottom",
                getBarColor(status),
                isHovered ? "scale-y-125 z-10" : "hover:scale-y-110",
              )}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}

        {hoveredDate && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] text-xs font-mono rounded-[var(--radius-sm)] shadow-lg whitespace-nowrap z-20 pointer-events-none"
            style={{
              left: `${((hoveredIndex! + 0.5) / days) * 100}%`,
            }}
          >
            <span className="tabular-nums">{formatDate(hoveredDate)}</span>
            <span className="mx-1.5 opacity-50">·</span>
            <span>{getStatusLabel(hoveredStatus)}</span>
            {hoveredDayData && (
              <>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="tabular-nums">
                  {hoveredDayData.uptimePercentage}%
                </span>
                <span className="mx-1.5 opacity-50">·</span>
                <span className="tabular-nums">
                  {hoveredDayData.totalChecks} checks
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
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
              className={cn(
                "flex-1 h-6 transition-all",
                filled ? "bg-up" : "bg-[var(--color-border-subtle)]",
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{days} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
