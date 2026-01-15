"use client";

import { cn } from "@/lib/cn";

/**
 * HoverSparkline - Kyoto Moss Design System
 *
 * Compact inline sparkline for hover states and tooltips.
 * Shows response time trends in a tiny (60x20px) inline format.
 */

interface DataPoint {
  responseTime: number;
  status: "up" | "down";
}

interface HoverSparklineProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  showStats?: boolean;
  className?: string;
}

export function HoverSparkline({
  data,
  width = 60,
  height = 20,
  showStats = false,
  className = "",
}: HoverSparklineProps) {
  if (data.length === 0) return null;

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate stats
  const responseTimes = data
    .filter((d) => d.status === "up")
    .map((d) => d.responseTime);
  const avgTime = responseTimes.length
    ? Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      )
    : 0;
  const minTime = responseTimes.length ? Math.min(...responseTimes) : 0;
  const maxTime = responseTimes.length ? Math.max(...responseTimes) : 0;

  // Normalize values
  const maxValue = Math.max(...responseTimes, 200);
  const step = chartWidth / Math.max(data.length - 1, 1);

  // Generate path points
  const points = data.map((point, i) => {
    const x = padding + i * step;
    const normalizedValue =
      point.status === "up" ? Math.min(point.responseTime / maxValue, 1) : 1; // Failures show as max height
    const y = padding + chartHeight - normalizedValue * chartHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const hasFailures = data.some((d) => d.status === "down");

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="flex-shrink-0"
        style={{ width, height }}
        aria-label={`Response times: avg ${avgTime}ms, min ${minTime}ms, max ${maxTime}ms`}
      >
        {/* Area fill */}
        <path
          d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill={
            hasFailures
              ? "var(--color-status-down)"
              : "var(--color-text-primary)"
          }
          fillOpacity={0.1}
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={
            hasFailures
              ? "var(--color-status-down)"
              : "var(--color-text-secondary)"
          }
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showStats && (
        <span className="text-[10px] text-[var(--color-text-muted)] font-mono tabular-nums whitespace-nowrap">
          {avgTime}ms avg
        </span>
      )}
    </div>
  );
}

/**
 * Wrapper component that shows sparkline on hover
 */
interface HoverSparklineWrapperProps {
  data: DataPoint[];
  children: React.ReactNode;
  className?: string;
}

export function HoverSparklineWrapper({
  data,
  children,
  className = "",
}: HoverSparklineWrapperProps) {
  return (
    <div className={cn("group relative", className)}>
      {children}
      {data.length > 0 && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <HoverSparkline data={data} showStats />
        </div>
      )}
    </div>
  );
}
