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

  // Cap hit radius at half the point spacing to prevent overlapping capture.
  // When stepX is 0 (single point) or spacing is wide, fall back to 22.
  const hitRadius = stepX > 0 ? Math.min(22, stepX / 2) : 22;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ overflow: "visible" }}
      onPointerLeave={() => setHoveredPoint(null)}
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
            {/* Invisible hit area — capped at half point spacing to prevent overlap */}
            <circle
              cx={x}
              cy={y}
              r={hitRadius}
              fill="transparent"
              // Pointer events unify mouse, touch, and stylus. Using pointerType
              // to distinguish hover (mouse/pen) from tap (touch) avoids the
              // synthetic-mouseenter-after-touchend problem: mobile browsers
              // dispatch compatibility mouse events after touch, but since we
              // don't listen to onMouseEnter those events are ignored.
              onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setHoveredPoint(i);
              }}
              onPointerDown={(e) => {
                if (e.pointerType === "touch") setHoveredPoint(i);
              }}
              onPointerUp={(e) => {
                if (e.pointerType === "touch") setHoveredPoint(null);
              }}
              onPointerCancel={() => setHoveredPoint(null)}
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
