"use client";

import { StatusIndicator } from "./StatusIndicator";
import { UptimeChart } from "./UptimeChart";
import { useEffect, useState } from "react";

/**
 * LiveMonitorPreview - Interactive demo of a monitor card
 *
 * Features:
 * - Simulated real-time check updates
 * - Response time sparkline
 * - Animated status transitions
 * - Glassmorphism card design
 */
export function LiveMonitorPreview() {
  const [lastCheck, setLastCheck] = useState(new Date());
  const [responseTime, setResponseTime] = useState(147);

  // Simulate live updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastCheck(new Date());
      // Random response time between 50-300ms
      setResponseTime(Math.floor(Math.random() * 250) + 50);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generate sparkline data (last 20 checks)
  const [sparklineData] = useState(() =>
    Array.from({ length: 20 }, () => Math.floor(Math.random() * 250) + 50)
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Monitor Card */}
      <div className="glass-dark-subtle p-6 space-y-4 border-l-2 border-accent card-hover-enhance border-corner-accent cursor-technical">
        {/* Service Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <StatusIndicator status="up" size="md" cinematic={true} />
            <h4 className="font-semibold text-text-primary">
              api.example.com
            </h4>
          </div>
          <p className="text-sm text-text-tertiary text-mono pl-6">
            https://api.example.com/health
          </p>
        </div>

        {/* Response Time */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl text-display font-bold text-gradient-cyan">
              {responseTime}
            </span>
            <span className="text-sm text-text-secondary text-mono">ms</span>
          </div>

          {/* Mini Sparkline */}
          <div className="flex items-end gap-0.5 h-12">
            {sparklineData.map((value, i) => {
              const heightPercent = (value / 300) * 100;
              const isLatest = i === sparklineData.length - 1;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-300 ${
                    isLatest ? "bg-accent" : "bg-border-strong opacity-30"
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: "8%",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Last Check */}
        <div className="flex items-center justify-between text-xs text-text-tertiary text-mono pt-2 border-t border-border">
          <span>Last check</span>
          <span className="animate-pulse">{formatTime(lastCheck)}</span>
        </div>
      </div>

      {/* Cinematic uptime trend chart */}
      <div className="mt-4 glass-dark-subtle p-4 card-hover-enhance">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-secondary text-mono uppercase">
            7-Day Trend
          </p>
          <p className="text-sm text-display font-bold text-gradient-cyan">
            ↗ 99.98%
          </p>
        </div>
        <div className="h-16">
          <UptimeChart
            data={[
              { timestamp: Date.now() - 6 * 86400000, responseTime: 120, status: "up" },
              { timestamp: Date.now() - 5 * 86400000, responseTime: 115, status: "up" },
              { timestamp: Date.now() - 4 * 86400000, responseTime: 125, status: "up" },
              { timestamp: Date.now() - 3 * 86400000, responseTime: 118, status: "up" },
              { timestamp: Date.now() - 2 * 86400000, responseTime: 122, status: "up" },
              { timestamp: Date.now() - 86400000, responseTime: 110, status: "up" },
              { timestamp: Date.now(), responseTime: 115, status: "up" },
            ]}
            width={300}
            height={64}
            animate={true}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="glass-dark-subtle p-3 text-center card-hover-enhance">
          <p className="text-xs text-text-secondary text-mono uppercase">
            Checks/day
          </p>
          <p className="text-xl text-display font-bold text-text-primary mt-1">
            1,440
          </p>
        </div>
        <div className="glass-dark-subtle p-3 text-center card-hover-enhance">
          <p className="text-xs text-text-secondary text-mono uppercase">
            Avg Response
          </p>
          <p className="text-xl text-display font-bold text-gradient-cyan mt-1">
            {responseTime}ms
          </p>
        </div>
      </div>
    </div>
  );
}
