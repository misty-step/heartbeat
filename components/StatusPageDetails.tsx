"use client";

import { ZenUptimeChart } from "./ZenUptimeChart";
import { IncidentTimeline } from "./IncidentTimeline";
import { GlassPanel } from "./ui/GlassPanel";
import { StatCard } from "./ui/StatCard";
import { formatRelativeTime } from "@/lib/domain/formatting";
import { type MonitorStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";

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

/** Status-tinted gradient backgrounds using Kyoto Moss semantic colors */
const gradientStyles: Record<MonitorStatus, string> = {
  up: "from-[var(--color-status-up)]/10 via-[var(--color-bg-primary)] to-[var(--color-bg-primary)]",
  degraded:
    "from-[var(--color-status-degraded)]/10 via-[var(--color-bg-primary)] to-[var(--color-bg-primary)]",
  down: "from-[var(--color-status-down)]/10 via-[var(--color-bg-primary)] to-[var(--color-bg-primary)]",
};

/**
 * StatusPageDetails - Kyoto Moss Design System
 *
 * Premium bento grid details section for status pages.
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
        className={cn(
          "absolute inset-0 bg-gradient-to-b pointer-events-none",
          gradientStyles[status],
        )}
      />

      {/* Subtle dot matrix texture */}
      <div className="absolute inset-0 zen-dot-matrix opacity-30 pointer-events-none" />

      {/* Bento Grid Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 space-y-6">
        {/* Response Time Panel - Full Width Glass Card */}
        {chartData.length > 0 && (
          <GlassPanel>
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-text-muted)] mb-4">
              Response Time
            </h2>
            <div className="h-32">
              <ZenUptimeChart data={chartData} height={128} />
            </div>
          </GlassPanel>
        )}

        {/* Asymmetric Bento Grid - Uptime featured, others supporting */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Featured Uptime Card - spans 2 columns */}
          <StatCard
            label="Uptime"
            value={`${uptimePercentage.toFixed(1)}%`}
            status={uptimeStatus}
            size="large"
            className="col-span-2"
          />
          {/* Supporting stats - stacked on the right */}
          <StatCard
            label="Avg Response"
            value={`${Math.round(avgResponseTime)}ms`}
            status={responseStatus}
          />
          <StatCard
            label="Last Check"
            value={lastCheckAt ? formatRelativeTime(lastCheckAt) : "—"}
            className="rotate-[0.5deg] hover:rotate-0 transition-transform"
          />
        </div>

        {/* Incidents Panel */}
        {incidents.length > 0 ? (
          <GlassPanel>
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-text-muted)] mb-4">
              Active Incidents
            </h2>
            <IncidentTimeline incidents={incidents} />
          </GlassPanel>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-text-muted)]">
              No incidents recorded
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
