"use client";

import { cn } from "@/lib/cn";
import { formatRelativeTime, formatTimestamp } from "@/lib/domain/formatting";
import { type StatusPageThemeProps } from "./types";

const statusConfig = {
  up: {
    banner: "SYSTEMS ONLINE",
    label: "OPERATIONAL",
    forecast: "Optimal",
    accent: "text-[#1e3a5f]",
    bar: "bg-[#1e3a5f] border-[#1e3a5f]",
  },
  degraded: {
    banner: "SYSTEMS DEGRADED",
    label: "DEGRADED",
    forecast: "Unsettled",
    accent: "text-[#c41e3a]",
    bar: "bg-[#c41e3a]/70 border-[#c41e3a]",
  },
  down: {
    banner: "SYSTEMS OFFLINE",
    label: "OUTAGE",
    forecast: "Critical",
    accent: "text-[#c41e3a]",
    bar: "bg-[#c41e3a] border-[#c41e3a]",
  },
};

const serviceLines = [
  "Auth Service",
  "Database Core",
  "Edge Network",
  "Incident Desk",
];

export function BroadsheetStatusPage({
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
  const statusText = statusConfig[status];
  const lastCheckLabel = lastCheckAt ? formatRelativeTime(lastCheckAt) : "—";
  const timestampLabel = lastCheckAt
    ? formatTimestamp(new Date(lastCheckAt))
    : "—";
  const totalChecksValue = totalChecks ?? chartData.length;
  const responseTimes = last30Days
    .map((point) => point.responseTime)
    .filter((value) => Number.isFinite(value));
  const maxResponse = Math.max(1, ...responseTimes);
  const minResponse = Math.min(...responseTimes, maxResponse);
  const leadParagraph =
    status === "up"
      ? `${monitorName} continues to operate at peak reliability, sustaining service continuity across its primary corridors with unwavering consistency.`
      : status === "degraded"
        ? `${monitorName} is experiencing intermittent service disruptions. Engineering teams are monitoring the situation closely as performance metrics fluctuate.`
        : `${monitorName} is currently experiencing a service outage. Our engineering teams have been mobilized and are working to restore normal operations.`;
  const incidentLine =
    incidents.length === 0
      ? "No incidents have been recorded in the current monitoring window."
      : `${incidents.length} incident${incidents.length === 1 ? "" : "s"} recorded in the current monitoring window.`;

  return (
    <div className="relative min-h-screen bg-[#f5f2eb] text-[#1a1a1a]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Libre+Franklin:wght@400;500;600;700&family=IM+Fell+English:ital@0;1&display=swap");
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 font-['Libre_Franklin'] sm:px-10 lg:px-12">
        <header className="text-center">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#6b6b6b]">
            <span>{`Systems Forecast: ${statusText.forecast}`}</span>
            <span>Vol. XCVII No. 42</span>
            <span>Price: Free</span>
          </div>
          <div className="mt-4 border-b-[3px] border-double border-[#1a1a1a] pb-5">
            <h1 className="font-['Playfair_Display'] text-[clamp(3rem,8vw,5.5rem)] font-black uppercase leading-[0.9] tracking-[-0.02em]">
              The Daily Systems
            </h1>
            <p className="mt-2 font-['IM_Fell_English'] text-sm italic text-[#6b6b6b]">
              &quot;All the uptime that&apos;s fit to print&quot;
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#1a1a1a] pt-3 text-[0.7rem] uppercase tracking-[0.2em]">
              <span>Founded 2024</span>
              <span className="bg-[#1a1a1a] px-3 py-1 font-semibold text-[#f5f2eb]">
                Extra Edition
              </span>
              <span>Continuous Updates</span>
            </div>
          </div>
        </header>

        <section className="mt-8 border-b border-[#1a1a1a] pb-6 text-center">
          <h2 className="font-['Playfair_Display'] text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05]">
            {statusText.banner}
          </h2>
          <p className="mt-3 font-['IM_Fell_English'] text-lg italic text-[#6b6b6b]">
            {monitorName} reports{" "}
            {status === "up"
              ? "perfect health"
              : status === "degraded"
                ? "minor turbulence"
                : "critical disruption"}{" "}
            as the day unfolds.
          </p>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <article className="border-[#1a1a1a] lg:border-r lg:pr-8">
            <div className="mb-4 flex flex-wrap gap-4 text-[0.7rem] uppercase tracking-[0.2em] text-[#6b6b6b]">
              <span>By The Monitoring Desk</span>
              <span>Continuous Coverage</span>
              <span>{`Filed ${timestampLabel}`}</span>
            </div>
            <div className="text-[0.95rem] leading-[1.7] [column-gap:2rem] [column-count:1] sm:[column-count:2]">
              <p className="mb-4">
                <span className="float-left pr-2 font-['Playfair_Display'] text-6xl font-bold leading-[0.8]">
                  {leadParagraph.charAt(0)}
                </span>
                {leadParagraph.slice(1)}
              </p>
              <p className="mb-4">
                Engineering desks report an average response time of{" "}
                <span className="font-semibold">
                  {Math.round(avgResponseTime)}ms
                </span>{" "}
                with a thirty-day uptime holding steady at{" "}
                <span className="font-semibold">
                  {uptimePercentage.toFixed(2)}%
                </span>
                . Total checks logged: {totalChecksValue.toLocaleString()}.
              </p>
              <p className="mb-4">{incidentLine}</p>
            </div>
          </article>

          <aside className="flex flex-col gap-6">
            <div className="bg-[#1a1a1a] px-6 py-5 text-center text-[#f5f2eb]">
              <div className="text-[0.7rem] uppercase tracking-[0.3em] opacity-80">
                Current Status
              </div>
              <div className="mt-2 font-['Playfair_Display'] text-2xl font-bold">
                {statusText.label}
              </div>
            </div>

            <div className="bg-[#ebe7de] p-5 border border-[#1a1a1a]">
              <h3 className="mb-4 border-b-2 border-[#c41e3a] pb-2 font-['Playfair_Display'] text-base font-bold uppercase tracking-[0.08em]">
                Key Metrics
              </h3>
              {[
                {
                  label: "Uptime",
                  value: `${uptimePercentage.toFixed(2)}%`,
                  tone: "text-[#1e3a5f]",
                },
                {
                  label: "Response",
                  value: `${Math.round(avgResponseTime)}ms`,
                  tone: "text-[#1a1a1a]",
                },
                {
                  label: "Incidents",
                  value: `${incidents.length}`,
                  tone:
                    incidents.length === 0
                      ? "text-[#1e3a5f]"
                      : "text-[#c41e3a]",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between border-b border-dotted border-[#1a1a1a] py-3 last:border-none"
                >
                  <span className="text-[0.7rem] uppercase tracking-[0.1em] text-[#6b6b6b]">
                    {metric.label}
                  </span>
                  <span
                    className={cn(
                      "font-['Playfair_Display'] text-2xl font-bold tabular-nums",
                      metric.tone,
                    )}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#ebe7de] p-5 border border-[#1a1a1a]">
              <h3 className="mb-4 border-b-2 border-[#c41e3a] pb-2 font-['Playfair_Display'] text-base font-bold uppercase tracking-[0.08em]">
                Service Status
              </h3>
              <div className="flex items-center justify-between border-b border-dotted border-[#1a1a1a] py-3 last:border-none">
                <span className="text-[0.7rem] uppercase tracking-[0.1em] text-[#6b6b6b]">
                  {monitorName}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    status === "up" ? "text-[#1e3a5f]" : "text-[#c41e3a]",
                  )}
                >
                  {status === "up"
                    ? "✓ UP"
                    : status === "degraded"
                      ? "⚠ DEGRADED"
                      : "✗ DOWN"}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-10 border-t-[3px] border-double border-[#1a1a1a] pt-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-['Playfair_Display'] text-2xl font-bold">
              Thirty-Day History
            </h3>
            <span className="text-sm italic text-[#6b6b6b]">
              Daily availability snapshots
            </span>
          </div>
          <div className="grid h-28 grid-cols-[repeat(15,minmax(0,1fr))] items-end gap-[3px] sm:grid-cols-[repeat(30,minmax(0,1fr))]">
            {last30Days.length > 0 ? (
              last30Days.map((point, index) => {
                const normalized =
                  maxResponse === minResponse
                    ? 92
                    : 25 +
                      ((point.responseTime - minResponse) /
                        (maxResponse - minResponse)) *
                        70;
                const height =
                  point.status === "down"
                    ? 20
                    : point.status === "degraded"
                      ? Math.min(70, normalized)
                      : Math.min(100, normalized);
                return (
                  <div
                    key={`${point.timestamp}-${index}`}
                    className={cn(
                      "group relative border border-[#1a1a1a] bg-[#ebe7de] transition-colors",
                      statusConfig[point.status].bar,
                    )}
                    style={{ height: `${height}%` }}
                  >
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap bg-[#1a1a1a] px-2 py-1 text-[0.65rem] text-[#f5f2eb] opacity-0 transition-opacity group-hover:opacity-100">
                      {`${Math.round(point.responseTime)}ms`}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-[#6b6b6b]">
                No telemetry available
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#1a1a1a] pt-6 text-[0.75rem] text-[#6b6b6b]">
          <span className="font-['Playfair_Display'] font-bold text-[#1a1a1a]">
            The Daily Systems
          </span>
          <span className="italic">{`Last updated ${lastCheckLabel}`}</span>
          <span>{`Timestamp ${timestampLabel}`}</span>
        </footer>
      </div>
    </div>
  );
}
