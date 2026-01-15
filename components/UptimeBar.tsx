"use client";

import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { cn } from "@/lib/cn";

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

const getStatusLabel = (status: DayStatus | "unknown") => {
  switch (status) {
    case "up":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "No data";
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function UptimeBar({ monitorId, days = 30 }: UptimeBarProps) {
  const dailyStatus = useQuery(api.checks.getDailyStatus, { monitorId, days });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      <div
        ref={containerRef}
        className="relative flex gap-[2px]"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {dateRange.map((date, i) => {
          const status = statusByDate.get(date) ?? "unknown";
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={date}
              className={cn(
                "flex-1 h-6 transition-transform origin-bottom",
                getBarColor(status),
                isHovered ? "scale-y-125 z-10" : "hover:scale-y-110",
              )}
              onMouseEnter={() => setHoveredIndex(i)}
            />
          );
        })}

        {/* Positioned tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] text-xs font-mono rounded-[var(--radius-sm)] shadow-lg whitespace-nowrap z-20 pointer-events-none"
            style={{
              left: `${((hoveredIndex + 0.5) / days) * 100}%`,
            }}
          >
            <span className="tabular-nums">
              {formatDate(dateRange[hoveredIndex])}
            </span>
            <span className="mx-1.5 opacity-50">·</span>
            <span>
              {getStatusLabel(
                statusByDate.get(dateRange[hoveredIndex]) ?? "unknown",
              )}
            </span>
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
