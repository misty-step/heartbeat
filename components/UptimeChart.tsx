"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface UptimeDataPoint {
  timestamp: number;
  responseTime: number;
  status: "up" | "down";
}

interface UptimeChartProps {
  data: UptimeDataPoint[];
  uptimePercentage: number;
}

export function UptimeChart({ data, uptimePercentage }: UptimeChartProps) {
  // Prepare data for sparkline - only show successful checks
  const chartData = data.map((point) => ({
    value: point.status === "up" ? point.responseTime : null,
  }));

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          Uptime (30 days)
        </h3>
        <span className="text-xl sm:text-2xl font-semibold text-text-primary tabular-nums">
          {uptimePercentage.toFixed(2)}%
        </span>
      </div>

      {/* Sparkline chart */}
      <div className="h-12 sm:h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--success))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="rgb(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["auto", "auto"]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="rgb(var(--success))"
              strokeWidth={1.5}
              fill="url(#successGradient)"
              fillOpacity={1}
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status bar - visual representation of up/down periods */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-[2px] h-8 min-w-full sm:min-w-0">
          {data.map((point, i) => (
            <div
              key={i}
              className={`flex-1 min-w-[3px] rounded-sm ${
                point.status === "up"
                  ? "bg-success"
                  : point.status === "down"
                  ? "bg-error"
                  : "bg-text-tertiary"
              }`}
              title={`${new Date(point.timestamp).toLocaleString()} - ${point.status} ${
                point.responseTime ? `(${point.responseTime}ms)` : ""
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
