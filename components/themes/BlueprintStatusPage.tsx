"use client";

import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type StatusPageThemeProps } from "./types";

const statusStyles = {
  up: {
    label: "OPERATIONAL",
    text: "text-[#60a5fa]",
    dot: "bg-[#60a5fa] shadow-[0_0_12px_rgba(96,165,250,0.6)]",
  },
  degraded: {
    label: "DEGRADED",
    text: "text-[#fbbf24]",
    dot: "bg-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.6)]",
  },
  down: {
    label: "OUTAGE",
    text: "text-[#f87171]",
    dot: "bg-[#f87171] shadow-[0_0_12px_rgba(248,113,113,0.6)]",
  },
} as const;

type StatusKey = keyof typeof statusStyles;

const fontStack =
  "'JetBrains Mono','Roboto Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace";

const formatDrawingId = (name: string) => {
  const compact = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return compact ? `HB-${compact.slice(0, 16)}` : "HB-STATUS-01";
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "—";
  return new Date(timestamp).toISOString().slice(0, 10);
};

const uptimeTone = (uptime: number | null): StatusKey => {
  if (uptime === null) return "degraded";
  return uptime >= 99 ? "up" : uptime >= 95 ? "degraded" : "down";
};

const responseTone = (ms: number): StatusKey =>
  ms <= 300 ? "up" : ms <= 800 ? "degraded" : "down";

const incidentTone = (count: number): StatusKey =>
  count === 0 ? "up" : count < 3 ? "degraded" : "down";

export function BlueprintStatusPage({
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
  const drawingId = formatDrawingId(monitorName);
  const lastCheckLabel = lastCheckAt ? formatRelativeTime(lastCheckAt) : "—";
  const totalChecksValue = totalChecks ?? chartData.length;
  const config = statusStyles[status];

  const responseTimes = last30Days
    .map((point) => point.responseTime)
    .filter((value) => Number.isFinite(value));
  const maxResponse = Math.max(1, ...responseTimes);
  const minResponse = Math.min(...responseTimes, maxResponse);

  const metrics = [
    {
      tag: "DIM A",
      value:
        uptimePercentage === null ? "—" : `${uptimePercentage.toFixed(2)}%`,
      detail:
        uptimePercentage === null
          ? "Uptime ratio — unavailable"
          : "Uptime ratio — nominal",
      tone: uptimeTone(uptimePercentage),
    },
    {
      tag: "DIM B",
      value: `${Math.round(avgResponseTime)}ms`,
      detail: "Response time — optimal",
      tone: responseTone(avgResponseTime),
    },
    {
      tag: "DIM C",
      value: `${incidents.length}`,
      detail: "Active incidents — logged",
      tone: incidentTone(incidents.length),
    },
    {
      tag: "NOTE 1",
      value: statusStyles[status].label,
      detail: "System status — operational",
      tone: status,
    },
  ] satisfies Array<{
    tag: string;
    value: string;
    detail: string;
    tone: StatusKey;
  }>;

  const serviceRows = [
    {
      id: "01",
      component: `${monitorName} Core`,
      status: uptimeTone(uptimePercentage),
      spec:
        uptimePercentage === null
          ? "Uptime unavailable"
          : `${uptimePercentage.toFixed(2)}% uptime`,
    },
    {
      id: "02",
      component: "Latency Envelope",
      status: responseTone(avgResponseTime),
      spec: `${Math.round(avgResponseTime)}ms avg`,
    },
    {
      id: "03",
      component: "Check Frequency",
      status: status,
      spec: `${totalChecksValue.toLocaleString()} checks`,
    },
    {
      id: "04",
      component: "Incident Registry",
      status: incidentTone(incidents.length),
      spec: `${incidents.length} active`,
    },
  ] satisfies Array<{
    id: string;
    component: string;
    status: StatusKey;
    spec: string;
  }>;

  return (
    <div
      className="relative min-h-screen bg-[#1e3a5f] text-white"
      style={{ fontFamily: fontStack }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="pointer-events-none fixed inset-[12px] sm:inset-[20px] z-20 border-2 border-white/60">
        <span className="absolute -top-[2px] -left-[2px] size-10 border-2 border-white/60 border-r-0 border-b-0" />
        <span className="absolute -top-[2px] -right-[2px] size-10 border-2 border-white/60 border-l-0 border-b-0" />
        <span className="absolute -bottom-[2px] -left-[2px] size-10 border-2 border-white/60 border-r-0 border-t-0" />
        <span className="absolute -bottom-[2px] -right-[2px] size-10 border-2 border-white/60 border-l-0 border-t-0" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <section className="relative border-2 border-white/60 p-6 sm:p-8">
          <span className="absolute -top-3 left-6 bg-[#1e3a5f] px-3 text-[10px] uppercase tracking-[0.3em] text-white/50">
            Title Block
          </span>
          <div className="text-3xl font-semibold uppercase tracking-[0.08em] sm:text-5xl">
            {monitorName}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-white/50">
            <span>Scale 1:1</span>
            <div className="relative flex-1 min-w-[120px] h-px bg-white/60">
              <span className="absolute -top-[4px] left-0 h-0 w-0 border-y-[4px] border-y-transparent border-r-[6px] border-r-white/60" />
              <span className="absolute -top-[4px] right-0 h-0 w-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-white/60" />
            </div>
            <span>Units Metric</span>
          </div>
          <div className="mt-6 grid gap-4 border-t border-white/60 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Drawing No.", value: drawingId },
              {
                label: "Revision",
                value:
                  status === "up" ? "A" : status === "degraded" ? "B" : "C",
              },
              { label: "Date", value: formatDate(lastCheckAt) },
              { label: "Engineer", value: "HEARTBEAT SYS" },
              {
                label: "Total Checks",
                value: totalChecksValue.toLocaleString(),
              },
              { label: "Last Check", value: lastCheckLabel },
              { label: "Status", value: statusStyles[status].label },
              {
                label: "Uptime",
                value:
                  uptimePercentage === null
                    ? "—"
                    : `${uptimePercentage.toFixed(2)}%`,
              },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  {item.label}
                </span>
                <span className="text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.tag}
              className="relative border border-white/60 px-5 pb-5 pt-6"
            >
              <span
                className={cn(
                  "absolute -top-2 left-5 bg-[#1e3a5f] px-2 text-[10px] uppercase tracking-[0.2em]",
                  statusStyles[metric.tone].text,
                )}
              >
                {metric.tag}
              </span>
              <span className="absolute right-4 top-4 size-7 rounded-full border border-white/60" />
              <div className="relative pl-5">
                <span className="absolute left-0 top-1/2 h-px w-3 bg-white/60" />
                <span className="absolute left-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[3px] border-y-transparent border-l-[5px] border-l-white/60" />
                <div
                  className={cn(
                    "text-3xl font-semibold tracking-tight sm:text-4xl",
                    statusStyles[metric.tone].text,
                  )}
                >
                  {metric.value}
                </div>
              </div>
              <div className="mt-4 border-t border-dashed border-white/50 pt-3 text-[11px] uppercase tracking-[0.18em] text-white/50">
                {metric.detail}
              </div>
            </div>
          ))}
        </section>

        <section className="relative mt-12 border-2 border-white/60 px-4 py-8 sm:px-6">
          <span className="absolute -top-3 left-6 bg-[#1e3a5f] px-3 text-[11px] uppercase tracking-[0.2em] text-[#60a5fa]">
            Section A-A
          </span>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 text-[11px] uppercase tracking-[0.2em] text-white/70">
                  <th className="border border-white/60 px-4 py-3 text-left">
                    Item
                  </th>
                  <th className="border border-white/60 px-4 py-3 text-left">
                    Component
                  </th>
                  <th className="border border-white/60 px-4 py-3 text-left">
                    Status
                  </th>
                  <th className="border border-white/60 px-4 py-3 text-left">
                    Spec
                  </th>
                </tr>
              </thead>
              <tbody>
                {serviceRows.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-white/60 px-4 py-3 text-white/80">
                      {row.id}
                    </td>
                    <td className="border border-white/60 px-4 py-3">
                      {row.component}
                    </td>
                    <td className="border border-white/60 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                        <span
                          className={cn(
                            "size-3 rounded-full",
                            statusStyles[row.status].dot,
                          )}
                        />
                        {statusStyles[row.status].label}
                      </div>
                    </td>
                    <td className="border border-white/60 px-4 py-3 text-white/80">
                      {row.spec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="relative mt-12 border-2 border-white/60 px-5 pb-8 pt-10 sm:px-6">
          <span className="absolute -top-3 left-6 bg-[#1e3a5f] px-3 text-[11px] uppercase tracking-[0.2em] text-[#60a5fa]">
            Detail B — 30-Day History
          </span>
          <div className="relative grid h-28 grid-cols-[repeat(15,minmax(0,1fr))] items-end gap-px sm:grid-cols-[repeat(30,minmax(0,1fr))]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-0 right-0 top-1/4 h-px bg-white/10" />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
              <div className="absolute left-0 right-0 top-3/4 h-px bg-white/10" />
            </div>
            {last30Days.length > 0 ? (
              last30Days.map((point, index) => {
                const normalized =
                  maxResponse === minResponse
                    ? 90
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
                      "relative transition-colors",
                      point.status === "up"
                        ? "bg-white/60 hover:bg-[#60a5fa]"
                        : point.status === "degraded"
                          ? "bg-[#fbbf24]/60 hover:bg-[#fbbf24]"
                          : "bg-[#f87171]/70 hover:bg-[#f87171]",
                    )}
                    style={{ height: `${height}%` }}
                    title={`${Math.round(point.responseTime)}ms`}
                  />
                );
              })
            ) : (
              <div className="col-span-full flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-white/40">
                No telemetry available
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/50">
            <span>T-0</span>
            <div className="relative flex-1 min-w-[120px] h-px bg-white/60">
              <span className="absolute -top-[4px] left-0 h-0 w-0 border-y-[4px] border-y-transparent border-r-[6px] border-r-white/60" />
              <span className="absolute -top-[4px] right-0 h-0 w-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-white/60" />
            </div>
            <span>T-30 Days</span>
          </div>
        </section>

        <section className="mt-12 border border-white/60 px-5 py-4">
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/50">
            Revision History
          </div>
          <div className="mt-4 space-y-3 text-xs text-white/80">
            <div className="flex flex-wrap gap-6 border-b border-dashed border-white/50 pb-3">
              <div className="min-w-[120px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Rev
                </div>
                <div>
                  {status === "up" ? "A" : status === "degraded" ? "B" : "C"}
                </div>
              </div>
              <div className="min-w-[220px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Description
                </div>
                <div>{`Status ${statusStyles[status].label.toLowerCase()} — ${uptimePercentage === null ? "unavailable" : `${uptimePercentage.toFixed(2)}% uptime`}`}</div>
              </div>
              <div className="min-w-[120px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Date
                </div>
                <div>{formatDate(lastCheckAt)}</div>
              </div>
              <div className="min-w-[120px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  By
                </div>
                <div>HEARTBEAT</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="min-w-[140px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Checked
                </div>
                <div>{lastCheckLabel}</div>
              </div>
              <div className="min-w-[140px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Approved
                </div>
                <div>AUTO</div>
              </div>
              <div className="min-w-[220px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Status
                </div>
                <div className={cn("uppercase tracking-[0.2em]", config.text)}>
                  {config.label}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
