"use client";

import { ZenUptimeChart } from "./ZenUptimeChart";
import { IncidentTimeline } from "./IncidentTimeline";
import { GlassPanel } from "./ui/GlassPanel";
import { StatCard } from "./ui/StatCard";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type MonitorStatus } from "@/lib/domain";

interface ChartDataPoint {
  timestamp: number;
  responseTime: number;
  status: "up" | "down";
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startedAt: Date;
  resolvedAt?: Date;
  updates?: Array<{
    message: string;
    timestamp: Date;
  }>;
}

interface StatusPageDetailsProps {
  status: MonitorStatus;
  chartData: ChartDataPoint[];
  uptimePercentage: number;
  avgResponseTime: number;
  lastCheckAt?: number;
  incidents: Incident[];
}

/** Status-tinted gradient backgrounds for visual continuity from hero */
const gradientStyles: Record<MonitorStatus, string> = {
  up: "from-teal-950/40 via-background to-background",
  degraded: "from-amber-950/40 via-background to-background",
  down: "from-red-950/40 via-background to-background",
};

/**
 * Premium bento grid details section for status pages.
 *
 * Features:
 * - Status-tinted gradient fade from hero
 * - Glass panels for chart and incidents
 * - Individual stat cards with semantic coloring
 */
export function StatusPageDetails({
  status,
  chartData,
  uptimePercentage,
  avgResponseTime,
  lastCheckAt,
  incidents,
}: StatusPageDetailsProps) {
  // Determine stat card status colors
  const uptimeStatus =
    uptimePercentage > 99 ? "good" : uptimePercentage > 95 ? "warn" : "bad";
  const responseStatus =
    avgResponseTime < 200 ? "good" : avgResponseTime < 500 ? "warn" : "bad";

  return (
    <section className="relative min-h-[50vh] pb-24">
      {/* Gradient fade from hero - status-tinted */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gradientStyles[status]} pointer-events-none`}
      />

      {/* Subtle dot matrix texture */}
      <div className="absolute inset-0 zen-dot-matrix opacity-30 pointer-events-none" />

      {/* Bento Grid Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 space-y-6">
        {/* Response Time Panel - Full Width Glass Card */}
        {chartData.length > 0 && (
          <GlassPanel>
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/40 mb-4">
              Response Time
            </h2>
            <div className="h-32">
              <ZenUptimeChart data={chartData} height={128} />
            </div>
          </GlassPanel>
        )}

        {/* Stats Row - 3 Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Uptime"
            value={`${uptimePercentage.toFixed(1)}%`}
            status={uptimeStatus}
          />
          <StatCard
            label="Avg Response"
            value={`${Math.round(avgResponseTime)}ms`}
            status={responseStatus}
          />
          <StatCard
            label="Last Check"
            value={lastCheckAt ? formatRelativeTime(lastCheckAt) : "—"}
          />
        </div>

        {/* Incidents Panel */}
        {incidents.length > 0 ? (
          <GlassPanel>
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-foreground/40 mb-4">
              Active Incidents
            </h2>
            <IncidentTimeline incidents={incidents} />
          </GlassPanel>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-foreground/25">No incidents recorded</p>
          </div>
        )}
      </div>
    </section>
  );
}
