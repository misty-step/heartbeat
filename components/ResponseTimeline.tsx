"use client";

import { cn } from "@/lib/cn";

/**
 * ResponseTimeline - Kyoto Moss Design System
 *
 * "Still Water" visualization: calm baseline, disruptions demand attention.
 *
 * - Fast responses: dots on baseline (calm = healthy)
 * - Slow responses: dips below baseline (deeper = slower)
 * - Failures: sharp red V-drops
 * - Live indicator: breathing dot at end
 *
 * Inspired by Japanese ma (間) - meaningful negative space.
 */

interface DataPoint {
  timestamp: number;
  responseTime: number;
  status: "up" | "down" | "degraded";
}

interface ResponseTimelineProps {
  data: DataPoint[];
  showLive?: boolean;
  className?: string;
}

const THRESHOLDS = {
  FAST: 200, // ms - dot only, no dip
  MODERATE: 500, // ms - shallow dip
  SLOW: 1000, // ms - medium dip
  MAX: 2000, // ms - cap for normalization
};

export function ResponseTimeline({
  data,
  showLive = false,
  className = "",
}: ResponseTimelineProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-[var(--color-text-muted)] text-sm h-16",
          className,
        )}
      >
        No data yet
      </div>
    );
  }

  const width = 400;
  const height = 64;
  const padding = { x: 8, y: 8 };
  const chartWidth = width - padding.x * 2;
  const chartHeight = height - padding.y * 2;
  const baselineY = padding.y + chartHeight * 0.35; // Baseline in upper third
  const maxDipDepth = chartHeight * 0.5; // Max dip below baseline

  const step = chartWidth / Math.max(data.length - 1, 1);

  // Build the path
  let pathD = `M ${padding.x} ${baselineY}`;
  const failureMarkers: { x: number; y: number }[] = [];

  data.forEach((point, i) => {
    const x = padding.x + i * step;

    if (point.status === "down") {
      // Failure: sharp V-drop
      const dropDepth = maxDipDepth * 0.8;
      pathD += ` L ${x - 4} ${baselineY}`;
      pathD += ` L ${x} ${baselineY + dropDepth}`;
      pathD += ` L ${x + 4} ${baselineY}`;
      failureMarkers.push({ x, y: baselineY + dropDepth });
    } else if (point.responseTime > THRESHOLDS.FAST) {
      // Slow response: curved dip
      const normalized = Math.min(point.responseTime / THRESHOLDS.MAX, 1);
      const dipDepth = normalized * maxDipDepth * 0.6;

      // Smooth curve down and back up
      const controlOffset = step * 0.4;
      pathD += ` C ${x - controlOffset} ${baselineY}, ${x - controlOffset * 0.5} ${baselineY + dipDepth}, ${x} ${baselineY + dipDepth}`;
      pathD += ` C ${x + controlOffset * 0.5} ${baselineY + dipDepth}, ${x + controlOffset} ${baselineY}, ${x + controlOffset} ${baselineY}`;
    } else {
      // Fast response: stay on baseline
      pathD += ` L ${x} ${baselineY}`;
    }
  });

  // Close path to end
  pathD += ` L ${width - padding.x} ${baselineY}`;

  const lastX = padding.x + (data.length - 1) * step;
  const lastPoint = data[data.length - 1];
  const hasFailures = data.some((d) => d.status === "down");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full h-16", className)}
      aria-label="Response time timeline"
    >
      {/* Baseline */}
      <line
        x1={padding.x}
        y1={baselineY}
        x2={width - padding.x}
        y2={baselineY}
        stroke="var(--color-border-subtle)"
        strokeWidth={1}
      />

      {/* Timeline path */}
      <path
        d={pathD}
        fill="none"
        stroke={
          hasFailures
            ? "var(--color-status-down)"
            : "var(--color-text-tertiary)"
        }
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Check dots on baseline */}
      {data.map((point, i) => {
        const x = padding.x + i * step;
        if (point.status === "down") return null; // Failures shown differently

        const isSlow = point.responseTime > THRESHOLDS.FAST;
        return (
          <circle
            key={i}
            cx={x}
            cy={baselineY}
            r={isSlow ? 3 : 2}
            fill={
              point.status === "degraded"
                ? "var(--color-status-degraded)"
                : "var(--color-text-muted)"
            }
          />
        );
      })}

      {/* Failure markers */}
      {failureMarkers.map((marker, i) => (
        <circle
          key={`fail-${i}`}
          cx={marker.x}
          cy={marker.y}
          r={4}
          fill="var(--color-status-down)"
        />
      ))}

      {/* Live indicator */}
      {showLive && (
        <g>
          {/* Outer glow */}
          <circle
            cx={lastX}
            cy={baselineY}
            r={6}
            fill={
              lastPoint.status === "up"
                ? "var(--color-status-up)"
                : lastPoint.status === "degraded"
                  ? "var(--color-status-degraded)"
                  : "var(--color-status-down)"
            }
            opacity={0.3}
            className="animate-km-breathe-subtle"
          />
          {/* Inner dot */}
          <circle
            cx={lastX}
            cy={baselineY}
            r={4}
            fill={
              lastPoint.status === "up"
                ? "var(--color-status-up)"
                : lastPoint.status === "degraded"
                  ? "var(--color-status-degraded)"
                  : "var(--color-status-down)"
            }
          />
        </g>
      )}
    </svg>
  );
}
