"use client";

import { Fraunces, Instrument_Serif } from "next/font/google";
import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type StatusPageThemeProps } from "./types";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const statusConfig = {
  up: {
    label: "Operational",
    tone: "text-[var(--color-moss)]",
    dot: "bg-[var(--color-moss)]",
  },
  degraded: {
    label: "Degraded",
    tone: "text-[var(--color-brick)]",
    dot: "bg-[var(--color-brick)]",
  },
  down: {
    label: "Outage",
    tone: "text-[var(--color-brick)]",
    dot: "bg-[var(--color-brick)]",
  },
};

const metricConfigs = [
  {
    label: "Uptime",
    shadow: "bg-[var(--color-brick)]",
    labelTone: "text-[var(--color-brick)]",
  },
  {
    label: "Response",
    shadow: "bg-[var(--color-moss)]",
    labelTone: "text-[var(--color-moss)]",
  },
  {
    label: "Incidents",
    shadow: "bg-[#1a1a1a]",
    labelTone: "text-[#1a1a1a]/60",
  },
];

export function UkiyoStatusPage({
  monitorName,
  status,
  uptimePercentage,
  avgResponseTime,
  lastCheckAt,
  chartData,
  incidents,
}: StatusPageThemeProps) {
  const statusTone = statusConfig[status];
  const statusText = statusTone.label;
  const last30Days = chartData.slice(-30);
  const lastCheckedLabel = lastCheckAt
    ? `Last checked ${formatRelativeTime(lastCheckAt)}`
    : "Last checked recently";
  const incidentSummary =
    incidents.length === 0
      ? "All systems stable"
      : `${incidents.length} incident${incidents.length === 1 ? "" : "s"} in last 30 days`;

  const responseTimes = last30Days.map((point) => point.responseTime);
  const minResponse = responseTimes.length ? Math.min(...responseTimes) : 0;
  const maxResponse = responseTimes.length ? Math.max(...responseTimes) : 0;
  const responseRange = Math.max(1, maxResponse - minResponse);

  return (
    <div
      className={cn(
        "min-h-screen font-[var(--font-body)]",
        fraunces.variable,
        instrumentSerif.variable,
      )}
      style={
        {
          "--color-moss": "#2d4a3e",
          "--color-brick": "#a94442",
          "--color-cream": "#fdfcfa",
        } as CSSProperties
      }
    >
      <div className="flex min-h-screen flex-col bg-[var(--color-cream)] text-[#1a1a1a]">
        <header className="flex items-center justify-between gap-4 border-b-[3px] border-[#1a1a1a] bg-[var(--color-moss)] px-6 py-3 sm:px-8">
          <span className="font-[var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)]">
            Status Report
          </span>
          <span className="font-[var(--font-display)] text-[11px] italic text-[var(--color-cream)]/90">
            {lastCheckedLabel}
          </span>
        </header>

        <main className="mx-auto flex w-full max-w-[800px] flex-1 flex-col px-6 py-8 sm:px-8">
          <section className="relative mb-6">
            <div className="pointer-events-none absolute inset-0 translate-x-[6px] translate-y-[6px] bg-[var(--color-moss)]" />
            <div className="relative border-[3px] border-[#1a1a1a] bg-[var(--color-cream)] p-6 sm:p-8">
              <div
                className={cn(
                  "absolute right-6 top-6 flex h-12 w-12 items-center justify-center border-2 border-[#1a1a1a] text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-[var(--color-cream)] sm:h-14 sm:w-14",
                  status === "up"
                    ? "bg-[var(--color-moss)]"
                    : "bg-[var(--color-brick)]",
                )}
              >
                {status === "up" ? "OK" : status === "degraded" ? "!" : "X"}
              </div>
              <h1 className="font-[var(--font-display)] text-[clamp(2rem,6vw,3.5rem)] font-bold leading-tight">
                {monitorName}
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border-2 border-[#1a1a1a]",
                    statusTone.dot,
                    status === "up" &&
                      "motion-safe:animate-[pulse_3s_ease-in-out_infinite]",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "font-[var(--font-display)] text-lg font-semibold tracking-[0.05em]",
                    statusTone.tone,
                  )}
                >
                  {statusText}
                </span>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                value:
                  uptimePercentage === null ? "—" : uptimePercentage.toFixed(2),
                unit: uptimePercentage === null ? "" : "%",
              },
              {
                value: Math.round(avgResponseTime).toString(),
                unit: "ms",
              },
              {
                value: incidents.length.toString(),
                unit: "",
              },
            ].map((metric, index) => {
              const config = metricConfigs[index];

              return (
                <div key={config.label} className="group relative">
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 translate-x-[4px] translate-y-[4px] opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                      config.shadow,
                    )}
                  />
                  <div className="relative border-2 border-[#1a1a1a] bg-[var(--color-cream)] p-5">
                    <p
                      className={cn(
                        "font-[var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.2em]",
                        config.labelTone,
                      )}
                    >
                      {config.label}
                    </p>
                    <p className="mt-2 font-[var(--font-display)] text-2xl font-bold">
                      {metric.value}
                      {metric.unit && (
                        <span className="text-sm font-normal text-[#1a1a1a]/70">
                          {metric.unit}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mb-6 border-[3px] border-[#1a1a1a] bg-[var(--color-cream)]">
            <div className="flex items-center justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[var(--color-moss)] px-5 py-3">
              <span className="font-[var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)]">
                30-Day History
              </span>
              <span className="font-[var(--font-display)] text-[10px] italic text-[var(--color-cream)]/90">
                {incidentSummary}
              </span>
            </div>
            <div className="px-5 py-6">
              {last30Days.length > 0 ? (
                <>
                  <div
                    className="flex h-20 items-end justify-between gap-1"
                    role="img"
                    aria-label="30-day uptime history"
                  >
                    {last30Days.map((point, index) => {
                      const normalized =
                        (point.responseTime - minResponse) / responseRange;
                      const baseHeight =
                        point.status === "down"
                          ? 0.25
                          : point.status === "degraded"
                            ? 0.55
                            : 0.85;
                      const heightPercent = Math.round(
                        (baseHeight + normalized * 0.12) * 100,
                      );
                      const barTone =
                        point.status === "down"
                          ? "bg-[var(--color-brick)]"
                          : point.status === "degraded"
                            ? "bg-[var(--color-moss)]/70"
                            : "bg-[var(--color-moss)]";

                      return (
                        <div
                          key={point.timestamp + index}
                          className={cn(
                            "flex-1 border border-[#1a1a1a] transition-opacity duration-200 hover:opacity-70",
                            barTone,
                          )}
                          style={{ height: `${heightPercent}%` }}
                          title={`${Math.round(point.responseTime)}ms`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#1a1a1a] pt-2 font-[var(--font-display)] text-[10px] text-[#1a1a1a]/60">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-[#1a1a1a]/70">
                  No recent uptime data.
                </p>
              )}
            </div>
          </section>

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-[#f5f2eb] px-4 py-2 font-[var(--font-display)] text-[11px] italic text-[#1a1a1a]">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusTone.dot,
                  status === "up" &&
                    "motion-safe:animate-[pulse_2s_ease-in-out_infinite]",
                )}
                aria-hidden="true"
              />
              <span>{lastCheckedLabel}</span>
            </div>
          </div>
        </main>

        <footer className="border-t-[3px] border-[#1a1a1a] bg-[var(--color-cream)] px-6 py-5 text-center sm:px-8">
          <div className="font-[var(--font-display)] text-sm font-semibold uppercase tracking-[0.15em] text-[#1a1a1a]">
            Heartbeat
          </div>
          <div className="mt-1 font-[var(--font-display)] text-[10px] italic text-[#1a1a1a]/60">
            Ukiyo Refined — Bold outlines, flat colors, woodblock editorial
          </div>
        </footer>
      </div>
    </div>
  );
}
