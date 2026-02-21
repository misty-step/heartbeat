"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ZenUptimeChart - Kyoto Moss Design System
 *
 * Minimal single-stroke response time visualization.
 * Unlike HeartbeatPulse (EKG style), this is pure minimalism:
 * - Single 1.5px stroke line
 * - Theme-aware foreground color
 * - No glow, no gradient
 * - Smooth bezier curves
 * - Data points appear on hover only
 */

interface ChartDataPoint {
  timestamp: number;
  responseTime: number;
  status: "up" | "down";
}

interface ZenUptimeChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
}

export function ZenUptimeChart({
  data,
  width = 400,
  height = 128,
}: ZenUptimeChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Find max response time for scaling
  const maxResponseTime = Math.max(...data.map((d) => d.responseTime), 100);

  // Generate SVG path from data points
  const generatePath = () => {
    if (data.length === 0) return "";

    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

    // Convert data to points (lower response time = higher on chart)
    const points = data.map((point, i) => {
      const x = padding + i * stepX;
      const normalizedValue = point.responseTime / maxResponseTime;
      const y = padding + normalizedValue * chartHeight;
      return { x, y, ...point };
    });

    // Generate smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      const controlY = (current.y + next.y) / 2;

      path += ` Q ${controlX} ${controlY}, ${next.x} ${next.y}`;
    }

    return path;
  };

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);

      // Trigger animation after a short delay
      const timerId = setTimeout(() => setIsAnimated(true), 100);

      // Clean up timer on unmount to prevent state updates after unmount
      return () => clearTimeout(timerId);
    }
  }, [data]);

  const path = generatePath();

  if (data.length === 0) {
    return null;
  }

  // Calculate point positions for hover detection
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ overflow: "visible" }}
      onMouseLeave={() => setHoveredPoint(null)}
    >
      {/* Main path - single stroke, no effects */}
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-text-muted)]"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: isAnimated ? 0 : pathLength,
          transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Invisible hover areas for each point */}
      {data.map((point, i) => {
        const x = padding + i * stepX;
        const normalizedValue = point.responseTime / maxResponseTime;
        const y = padding + normalizedValue * chartHeight;

        return (
          <g key={i}>
            {/* Invisible hit area — r=22 meets 44px minimum touch target */}
            <circle
              cx={x}
              cy={y}
              r="22"
              fill="transparent"
              onMouseEnter={() => setHoveredPoint(i)}
              onTouchStart={() => setHoveredPoint(i)}
              onTouchEnd={() => setHoveredPoint(null)}
              className="cursor-pointer"
            />

            {/* Visible point on hover */}
            {hoveredPoint === i && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  className="fill-[var(--color-text-primary)]"
                />
                {/* Tooltip */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-[var(--color-text-secondary)] font-mono"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {point.responseTime}ms
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
