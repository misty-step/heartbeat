"use client";

import { useEffect, useRef, useState } from "react";

/**
 * UptimeChart - Cinematic SVG response time visualization
 *
 * Features:
 * - Glowing gradient stroke with cyan accent
 * - Stroke-dasharray draw animation on mount
 * - Smooth bezier curve path
 * - Interactive hover tooltips
 * - Responsive sizing
 */
interface ChartDataPoint {
  timestamp: number;
  responseTime: number;
  status: "up" | "down";
}

interface UptimeChartProps {
  data?: ChartDataPoint[];
  uptimePercentage?: number;
  width?: number;
  height?: number;
  animate?: boolean;
}

const DEFAULT_DATA: ChartDataPoint[] = [
  { timestamp: Date.now() - 600000, responseTime: 120, status: "up" },
  { timestamp: Date.now() - 540000, responseTime: 115, status: "up" },
  { timestamp: Date.now() - 480000, responseTime: 130, status: "up" },
  { timestamp: Date.now() - 420000, responseTime: 125, status: "up" },
  { timestamp: Date.now() - 360000, responseTime: 118, status: "up" },
  { timestamp: Date.now() - 300000, responseTime: 122, status: "up" },
  { timestamp: Date.now() - 240000, responseTime: 128, status: "up" },
  { timestamp: Date.now() - 180000, responseTime: 116, status: "up" },
  { timestamp: Date.now() - 120000, responseTime: 124, status: "up" },
  { timestamp: Date.now() - 60000, responseTime: 119, status: "up" },
];

export function UptimeChart({
  data = DEFAULT_DATA,
  uptimePercentage,
  width = 400,
  height = 120,
  animate = true,
}: UptimeChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);

  // Find max response time for scaling
  const maxResponseTime = Math.max(...data.map((d) => d.responseTime), 100);

  // Generate SVG path from data points
  const generatePath = () => {
    if (data.length === 0) return "";

    const padding = 10;
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
    if (pathRef.current && animate) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);

      // Trigger animation after a short delay
      setTimeout(() => setIsAnimated(true), 100);
    }
  }, [animate, data]);

  const path = generatePath();

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {uptimePercentage !== undefined && (
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold text-text-primary">
            Response Time
          </h2>
          <span className="text-sm text-text-secondary">
            {uptimePercentage.toFixed(2)}% uptime
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* Define gradient for stroke */}
        <defs>
          <linearGradient id="uptime-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow path (wider, blurred) */}
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent-glow)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
          style={{ filter: "blur(4px)" }}
        />

        {/* Main path with animated stroke */}
        <path
          ref={pathRef}
          d={path}
          fill="none"
          stroke="url(#uptime-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          style={{
            strokeDasharray: animate ? pathLength : "none",
            strokeDashoffset: animate && !isAnimated ? pathLength : 0,
            transition: isAnimated ? "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />

        {/* Data point markers */}
        {data.map((point, i) => {
          const padding = 10;
          const chartWidth = width - padding * 2;
          const chartHeight = height - padding * 2;
          const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;
          const x = padding + i * stepX;
          const normalizedValue = point.responseTime / maxResponseTime;
          const y = padding + normalizedValue * chartHeight;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={point.status === "up" ? "var(--color-accent)" : "var(--color-status-down)"}
              opacity={isAnimated ? "0.8" : "0"}
              style={{
                transition: `opacity 0.3s ease ${i * 0.02}s`,
              }}
            >
              <title>{point.responseTime}ms - {point.status}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
