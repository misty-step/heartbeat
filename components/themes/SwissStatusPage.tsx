"use client";

import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type StatusPageThemeProps } from "./types";

const statusLabels = {
  up: "ONLINE",
  degraded: "DEGRADED",
  down: "OUTAGE",
} as const;

const fontStack =
  "'Helvetica Neue','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const splitTitle = (name: string) => {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return [name.toUpperCase(), "STATUS"];
  return [words[0].toUpperCase(), words.slice(1).join(" ").toUpperCase()];
};

export function SwissStatusPage({
  monitorName,
  status,
  uptimePercentage,
  avgResponseTime,
  totalChecks,
  lastCheckAt,
  chartData,
  incidents,
}: StatusPageThemeProps) {
  const last30Days = chartData.slice(-30);
  const [titleLine1, titleLine2] = splitTitle(monitorName);
  const lastChecked = lastCheckAt
    ? formatRelativeTime(lastCheckAt)
    : "recently";
  const totalChecksValue = totalChecks ?? chartData.length;
  const statusLabel = statusLabels[status];

  const responseTimes = last30Days.map((point) => point.responseTime);
  const minResponse = responseTimes.length ? Math.min(...responseTimes) : 0;
  const maxResponse = responseTimes.length ? Math.max(...responseTimes) : 0;
  const responseRange = Math.max(1, maxResponse - minResponse);

  return (
    <div
      className="relative min-h-screen bg-white text-[#1a1a1a]"
      style={{ fontFamily: fontStack }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        aria-hidden="true"
      >
        <div className="mx-auto h-full w-full max-w-6xl px-6 sm:px-10 lg:px-12">
          <div className="grid h-full grid-cols-12">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`grid-line-${index}`}
                className={cn(
                  "border-l border-[#1a1a1a]",
                  index === 11 && "border-r",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <header className="col-span-full grid grid-cols-1 gap-6 border-b-2 border-[#1a1a1a] pb-8 lg:grid-cols-12">
            <div className="col-span-2 flex items-end">
              <div className="h-10 w-10 bg-[#e30613]" />
            </div>
            <div className="col-span-7">
              <h1 className="text-[clamp(3.5rem,12vw,9rem)] font-bold uppercase leading-[0.85] tracking-[-0.04em]">
                <span className="block">{titleLine1}</span>
                <span className="block">{titleLine2}</span>
              </h1>
            </div>
            <div className="col-span-3 flex flex-col items-start gap-2 text-left lg:items-end lg:text-right">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em]">
                Status Page
              </span>
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-[#1a1a1a]/60">
                {totalChecksValue.toLocaleString()} checks
              </span>
            </div>
          </header>

          <section className="col-span-full grid grid-cols-1 gap-6 lg:col-span-7 lg:grid-cols-7">
            <div className="col-span-3 flex min-h-[240px] flex-col justify-between bg-[#e30613] p-6 text-white">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-white/80">
                System Status
              </span>
              <span className="text-[clamp(2rem,6vw,4rem)] font-bold uppercase leading-none tracking-[-0.02em]">
                {statusLabel}
              </span>
            </div>
            <div className="col-span-4 flex flex-col gap-6">
              {[
                {
                  label: "Uptime",
                  value:
                    uptimePercentage === null
                      ? "—"
                      : `${uptimePercentage.toFixed(2)}%`,
                },
                {
                  label: "Response Time",
                  value: `${Math.round(avgResponseTime)}ms`,
                },
                {
                  label: "Active Incidents",
                  value: `${incidents.length}`,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-1 flex-col justify-between bg-[#f5f5f5] p-6"
                >
                  <span className="text-[0.75rem] font-medium uppercase tracking-[0.2em] text-[#1a1a1a]/70">
                    {metric.label}
                  </span>
                  <span className="text-4xl font-bold tracking-[-0.02em] tabular-nums">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside className="col-span-full flex flex-col gap-6 lg:col-span-5">
            <div className="border-t-4 border-[#1a1a1a] pt-4">
              <h2 className="text-[0.75rem] font-medium uppercase tracking-[0.3em]">
                Service
              </h2>
              <div className="mt-4 flex items-center justify-between border-b border-[#1a1a1a]/20 pb-2 text-[0.9rem]">
                <span>{monitorName}</span>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#e30613]">
                  {statusLabel}
                </span>
              </div>
            </div>
          </aside>

          <section className="col-span-full mt-6 border-t-2 border-[#1a1a1a] pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold tracking-[-0.02em]">
                30-Day History
              </h2>
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-[#1a1a1a]/60">
                Availability Percentage
              </span>
            </div>
            <div className="mt-6 grid h-28 grid-cols-[repeat(15,minmax(0,1fr))] gap-[2px] sm:grid-cols-[repeat(30,minmax(0,1fr))]">
              {last30Days.length > 0 ? (
                last30Days.map((point, index) => {
                  const normalized =
                    ((point.responseTime - minResponse) / responseRange) * 70 +
                    30;
                  const height =
                    point.status === "down"
                      ? 25
                      : point.status === "degraded"
                        ? Math.min(70, normalized)
                        : Math.min(100, normalized);
                  return (
                    <div
                      key={`${point.timestamp}-${index}`}
                      className={cn(
                        "transition-colors",
                        point.status === "up" && "bg-[#1a1a1a]",
                        point.status === "degraded" && "bg-[#1a1a1a]/35",
                        point.status === "down" && "bg-[#e30613]",
                      )}
                      style={{ height: `${height}%` }}
                      title={`${Math.round(point.responseTime)}ms`}
                    />
                  );
                })
              ) : (
                <div className="col-span-full flex h-full items-center justify-center text-[0.65rem] uppercase tracking-[0.3em] text-[#1a1a1a]/50">
                  No telemetry available
                </div>
              )}
            </div>
          </section>

          <footer className="col-span-full mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#1a1a1a]/20 pt-6">
            <div className="flex items-center gap-4">
              <div className="h-[2px] w-16 bg-[#e30613]" />
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.4em]">
                HEARTBEAT
              </span>
            </div>
            <span className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-[#1a1a1a]/60">
              Last checked {lastChecked}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
