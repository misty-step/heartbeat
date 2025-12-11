"use client";

import { ZenUptimeChart } from "./ZenUptimeChart";
import { IncidentTimeline } from "./IncidentTimeline";
import { formatRelativeTime } from "@/lib/domain/formatting";

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
  chartData: ChartDataPoint[];
  uptimePercentage: number;
  avgResponseTime: number;
  lastCheckAt?: number;
  incidents: Incident[];
}

/**
 * Expandable details section for Zen status pages.
 *
 * Revealed below the fold via scroll. Typography-focused,
 * generous whitespace, no cards or borders.
 */
export function StatusPageDetails({
  chartData,
  uptimePercentage,
  avgResponseTime,
  lastCheckAt,
  incidents,
}: StatusPageDetailsProps) {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24 space-y-16">
      {/* Response time chart - minimal, single line */}
      {chartData.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xs tracking-wider uppercase text-foreground/40">
            Response Time
          </h2>
          <ZenUptimeChart data={chartData} />
        </section>
      )}

      {/* Single stats line */}
      <div className="text-sm text-foreground/60 font-mono flex flex-wrap items-center gap-x-4 gap-y-2">
        <span>{uptimePercentage.toFixed(2)}% uptime</span>
        <span className="text-foreground/20">·</span>
        <span>{Math.round(avgResponseTime)}ms avg</span>
        {lastCheckAt && (
          <>
            <span className="text-foreground/20">·</span>
            <span>checked {formatRelativeTime(lastCheckAt)}</span>
          </>
        )}
      </div>

      {/* Incidents - only show section if there are incidents */}
      {incidents.length > 0 ? (
        <section className="space-y-6">
          <h2 className="text-xs tracking-wider uppercase text-foreground/40">
            Incidents
          </h2>
          <IncidentTimeline incidents={incidents} />
        </section>
      ) : (
        <p className="text-sm text-foreground/30 text-center py-8">
          No incidents
        </p>
      )}
    </main>
  );
}
