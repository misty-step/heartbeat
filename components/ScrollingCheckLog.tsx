"use client";

import { useEffect, useState, useRef } from "react";

/**
 * ScrollingCheckLog - Terminal-style scrolling log of health checks
 *
 * Features:
 * - Auto-scrolling new entries
 * - Terminal aesthetic with monospace font
 * - Status indicators (✓ success, ✗ failure)
 * - Response times
 */
interface CheckLogEntry {
  id: string;
  timestamp: Date;
  endpoint: string;
  status: "success" | "failure";
  responseTime: number;
}

export function ScrollingCheckLog() {
  const [entries, setEntries] = useState<CheckLogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const endpoints = [
    "api.example.com/health",
    "auth.example.com/status",
    "cdn.example.com/ping",
    "app.example.com/healthz",
  ];

  const generateEntry = (): CheckLogEntry => {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const status = Math.random() > 0.05 ? "success" : "failure"; // 95% success rate
    const responseTime =
      status === "success"
        ? Math.floor(Math.random() * 200) + 50 // 50-250ms
        : Math.floor(Math.random() * 3000) + 1000; // 1000-4000ms for failures

    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      endpoint,
      status,
      responseTime,
    };
  };

  useEffect(() => {
    // Initialize with some entries
    const initialEntries = Array.from({ length: 5 }, () => generateEntry());
    setEntries(initialEntries);

    // Add new entry every 2 seconds
    const interval = setInterval(() => {
      setEntries((prev) => {
        const newEntry = generateEntry();
        const updated = [newEntry, ...prev];
        // Keep only last 10 entries
        return updated.slice(0, 10);
      });
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateEntry is stable, generates random data
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div
      ref={scrollRef}
      className="space-y-2 overflow-hidden"
      style={{ maxHeight: "200px" }}
    >
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className={`flex items-center justify-between text-sm text-mono border-l-2 pl-3 py-1 transition-all duration-300 ${
            entry.status === "success"
              ? "border-accent text-text-secondary"
              : "border-down text-down"
          } ${index === 0 ? "animate-in-1 font-semibold" : "opacity-60"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-tertiary">
              {formatTime(entry.timestamp)}
            </span>
            <span
              className={
                entry.status === "success" ? "text-accent" : "text-down"
              }
            >
              {entry.status === "success" ? "✓" : "✗"}
            </span>
            <span className="text-text-secondary truncate max-w-[200px] sm:max-w-none">
              {entry.endpoint}
            </span>
          </div>
          <span
            className={`text-xs ${
              entry.status === "success" ? "text-text-tertiary" : "text-down"
            }`}
          >
            {entry.responseTime}ms
          </span>
        </div>
      ))}
    </div>
  );
}
