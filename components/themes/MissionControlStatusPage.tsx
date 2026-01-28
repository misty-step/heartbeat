"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type StatusPageThemeProps } from "./types";

const statusStyles = {
  up: {
    label: "ONLINE",
    text: "text-[#33ff00]",
    dot: "bg-[#33ff00] shadow-[0_0_12px_rgba(51,255,0,0.6)]",
  },
  degraded: {
    label: "DEGRADED",
    text: "text-[#ffb000]",
    dot: "bg-[#ffb000] shadow-[0_0_12px_rgba(255,176,0,0.6)]",
  },
  down: {
    label: "OFFLINE",
    text: "text-[#ff3300]",
    dot: "bg-[#ff3300] shadow-[0_0_12px_rgba(255,51,0,0.6)]",
  },
} as const;

type StatusKey = keyof typeof statusStyles;

const monoFont =
  "'Share Tech Mono','Chakra Petch',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";
const titleFont =
  "'Chakra Petch','Share Tech Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";

const formatCountdown = (timestamp: number | undefined, now: number) => {
  if (!timestamp) return "T-MINUS 00:00:00";
  const deltaSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  const minutes = Math.floor(deltaSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (deltaSeconds % 60).toString().padStart(2, "0");
  return `T-MINUS 00:${minutes}:${seconds}`;
};

const uptimeTone = (uptime: number): StatusKey =>
  uptime >= 99 ? "up" : uptime >= 95 ? "degraded" : "down";

const responseTone = (ms: number): StatusKey =>
  ms <= 250 ? "up" : ms <= 800 ? "degraded" : "down";

const incidentTone = (count: number): StatusKey =>
  count === 0 ? "up" : count < 3 ? "degraded" : "down";

const signalLabel = (tone: StatusKey) =>
  tone === "up" ? "STRONG" : tone === "degraded" ? "WEAK" : "LOST";

export function MissionControlStatusPage({
  monitorName,
  status,
  uptimePercentage,
  avgResponseTime,
  lastCheckAt,
  chartData,
  incidents,
}: StatusPageThemeProps) {
  // Client-side time to avoid hydration mismatch
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const last30Days = chartData.slice(-30);
  const statusText = statusStyles[status].label;
  // Use placeholder during SSR, actual countdown on client
  const countdownLabel = now
    ? formatCountdown(lastCheckAt, now)
    : "T-MINUS 00:00:00";
  const lastCheckLabel = lastCheckAt
    ? formatRelativeTime(lastCheckAt).toUpperCase()
    : "—";

  const responseTimes = last30Days
    .map((point) => point.responseTime)
    .filter((value) => Number.isFinite(value));
  const maxResponse = Math.max(1, ...responseTimes);
  const minResponse = Math.min(...responseTimes, maxResponse);

  const telemetry = [
    {
      label: "System Status",
      value: statusText,
      unit: "",
      tone: status,
      glow: true,
    },
    {
      label: "Uptime Ratio",
      value: uptimePercentage.toFixed(2),
      unit: "%",
      tone: uptimeTone(uptimePercentage),
    },
    {
      label: "Response Time",
      value: Math.round(avgResponseTime).toString(),
      unit: "ms",
      tone: responseTone(avgResponseTime),
    },
    {
      label: "Active Incidents",
      value: incidents.length.toString(),
      unit: "",
      tone: incidentTone(incidents.length),
    },
  ] satisfies Array<{
    label: string;
    value: string;
    unit: string;
    tone: StatusKey;
    glow?: boolean;
  }>;

  const serviceRows = [
    {
      name: `${monitorName} Primary`,
      tone: status,
      uptime: `${uptimePercentage.toFixed(2)}%`,
      latency: `${Math.round(avgResponseTime)}ms`,
    },
    {
      name: "Authentication Module",
      tone: uptimeTone(uptimePercentage),
      uptime: `${uptimePercentage.toFixed(2)}%`,
      latency: `${Math.round(avgResponseTime * 0.7)}ms`,
    },
    {
      name: "Database Cluster",
      tone: responseTone(avgResponseTime),
      uptime: `${Math.max(99, uptimePercentage).toFixed(2)}%`,
      latency: `${Math.round(avgResponseTime * 0.3)}ms`,
    },
    {
      name: "CDN Edge Nodes",
      tone: incidentTone(incidents.length),
      uptime: `${uptimePercentage.toFixed(2)}%`,
      latency: `${Math.round(avgResponseTime * 0.45)}ms`,
    },
  ] satisfies Array<{
    name: string;
    tone: StatusKey;
    uptime: string;
    latency: string;
  }>;

  return (
    <div
      className={cn(
        "relative min-h-screen bg-[#0a0f0a] text-[#33ff00]",
        "before:fixed before:inset-0 before:z-30 before:content-['']",
        "before:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(51,255,0,0.04)_2px,rgba(51,255,0,0.04)_4px)]",
        "before:pointer-events-none",
        "after:fixed after:inset-0 after:z-30 after:content-['']",
        "after:bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,20,0,0.45)_100%)]",
        "after:pointer-events-none",
      )}
      style={{ fontFamily: monoFont }}
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Chakra+Petch:wght@400;600;700&display=swap");
        @keyframes mc-blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0.3;
          }
        }
        @keyframes mc-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.65;
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(#112211 1px, transparent 1px), linear-gradient(90deg, #112211 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 sm:px-10">
        <header className="relative mb-10 border-2 border-[#1a8000] bg-[#061206]/50 p-6 sm:p-7">
          <span className="absolute -top-3 left-5 bg-[#0a0f0a] px-3 text-[10px] uppercase tracking-[0.3em] text-[#33ff00]">
            ● SYSTEM {statusText}
          </span>
          <div className="absolute right-5 top-5 text-[11px] uppercase tracking-[0.2em] text-[#ffb000]">
            {countdownLabel}
          </div>
          <h1
            className="text-[clamp(2rem,5vw,4rem)] font-bold uppercase tracking-[0.2em]"
            style={{
              fontFamily: titleFont,
              textShadow: "0 0 18px rgba(51,255,0,0.35)",
            }}
          >
            {monitorName}
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-[#1a8000]">
            Telemetry Monitoring Station // Heartbeat OS v4.2
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {telemetry.map((item) => (
            <div
              key={item.label}
              className="relative border border-[#1a8000] bg-[#061206]/40 px-5 py-4"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#33ff00,transparent)]" />
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#1a8000]">
                {item.label}
              </div>
              <div
                className={cn(
                  "mt-3 text-3xl font-bold tracking-wide",
                  statusStyles[item.tone].text,
                  item.glow &&
                    "motion-safe:animate-[mc-pulse_2.3s_ease-in-out_infinite]",
                )}
                style={{ textShadow: "0 0 12px rgba(51,255,0,0.4)" }}
              >
                {item.value}
                {item.unit && (
                  <span className="ml-1 text-sm text-[#1a8000]">
                    {item.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10 border-2 border-[#1a8000] bg-[#071207]/50 px-5 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a8000] pb-4">
            <span
              className="text-sm uppercase tracking-[0.2em]"
              style={{ fontFamily: titleFont }}
            >
              30-Day Telemetry History
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#1a8000]">
              Mission Day 234-263
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0c200c]/60 text-[10px] uppercase tracking-[0.3em] text-[#33ff00]">
                  <th className="border border-[#1a8000] px-4 py-3 text-left">
                    Service Module
                  </th>
                  <th className="border border-[#1a8000] px-4 py-3 text-left">
                    Status
                  </th>
                  <th className="border border-[#1a8000] px-4 py-3 text-left">
                    Uptime
                  </th>
                  <th className="border border-[#1a8000] px-4 py-3 text-left">
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {serviceRows.map((row) => (
                  <tr key={row.name}>
                    <td className="border border-[#1a8000] px-4 py-3">
                      {row.name}
                    </td>
                    <td className="border border-[#1a8000] px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                        <span
                          className={cn(
                            "h-2.5 w-2.5",
                            statusStyles[row.tone].dot,
                            "motion-safe:animate-[mc-pulse_2.5s_ease-in-out_infinite]",
                          )}
                        />
                        {statusStyles[row.tone].label}
                      </span>
                    </td>
                    <td className="border border-[#1a8000] px-4 py-3 text-[#1a8000]">
                      {row.uptime}
                    </td>
                    <td className="border border-[#1a8000] px-4 py-3 text-[#1a8000]">
                      {row.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 border-t border-[#1a8000] pt-5">
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#1a8000]">
                UPTIME
              </span>
              <div className="flex flex-1 gap-[3px]">
                {last30Days.length > 0 ? (
                  last30Days.map((point, index) => {
                    const normalized =
                      maxResponse === minResponse
                        ? 90
                        : 35 +
                          ((point.responseTime - minResponse) /
                            (maxResponse - minResponse)) *
                            65;
                    const height =
                      point.status === "down"
                        ? 22
                        : point.status === "degraded"
                          ? Math.min(70, normalized)
                          : Math.min(100, normalized);
                    const barTone =
                      point.status === "down"
                        ? "bg-[#ff3300]/70"
                        : point.status === "degraded"
                          ? "bg-[#ffb000]/70"
                          : "bg-[#33ff00]/80";
                    return (
                      <div
                        key={`${point.timestamp}-${index}`}
                        className="flex-1"
                        aria-hidden="true"
                      >
                        <div
                          className={cn("w-full", barTone)}
                          style={{ height: `${height}%` }}
                          title={`${Math.round(point.responseTime)}ms`}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[11px] uppercase tracking-[0.3em] text-[#1a8000]">
                    No telemetry available
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border border-[#1a8000] bg-[#061206]/60 px-5 py-4 text-[11px] uppercase tracking-[0.2em]">
          <div className="flex items-center gap-3">
            <span
              className="h-2 w-2 bg-[#33ff00] shadow-[0_0_8px_rgba(51,255,0,0.7)] motion-safe:animate-[mc-blink_1.1s_steps(2,end)_infinite]"
              aria-hidden="true"
            />
            <span>DATA STREAM ACTIVE</span>
          </div>
          <div className="text-[#ffb000]">LAST CHECK: {lastCheckLabel}</div>
          <div>SIGNAL: {signalLabel(status)}</div>
          <div>NODE: US-EAST-1</div>
        </footer>
      </div>
    </div>
  );
}
