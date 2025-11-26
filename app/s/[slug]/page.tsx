import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { StatusHeader } from "../../../components/StatusHeader";
import { MonitorCard } from "../../../components/MonitorCard";
import { UptimeChart } from "../../../components/UptimeChart";
import { IncidentTimeline } from "../../../components/IncidentTimeline";

// ISR Configuration
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamicParams = true; // Allow new slugs not in generateStaticParams

interface PageProps {
  params: Promise<{ slug: string }>;
}

type MonitorStatus = "up" | "degraded" | "down" | "unknown";
type OverallStatus = "up" | "degraded" | "down" | "unknown";

const getMonitorStatus = (consecutiveFailures: number): MonitorStatus => {
  if (consecutiveFailures === 0) return "up";
  if (consecutiveFailures < 3) return "degraded";
  return "down";
};

// Pre-render common project slugs at build time
export async function generateStaticParams() {
  // TODO: Fetch most accessed project slugs from analytics/database
  // For now, return empty array - all pages generated on-demand with ISR
  return [];
}

export default async function StatusPage({ params }: PageProps) {
  const { slug } = await params;

  const monitors = await fetchQuery(api.monitors.getByProjectSlug, {
    projectSlug: slug,
  });

  if (!monitors || monitors.length === 0) {
    notFound();
  }

  // Compute statuses once
  const monitorsWithStatus = monitors.map((monitor) => ({
    ...monitor,
    status: getMonitorStatus(monitor.consecutiveFailures),
  }));

  // Simple priority-based aggregation
  const overallStatus: OverallStatus =
    monitorsWithStatus.some((m) => m.status === "down")
      ? "down"
      : monitorsWithStatus.some((m) => m.status === "degraded")
      ? "degraded"
      : "up";

  // Get the most recent check time across all monitors
  const lastUpdated = monitors.reduce((latest, monitor) => {
    if (!monitor.lastCheckAt) return latest;
    return !latest || monitor.lastCheckAt > latest
      ? monitor.lastCheckAt
      : latest;
  }, null as number | null);

  // Fetch uptime data for the first monitor (for now, showing single monitor stats)
  // TODO: In future, aggregate across all monitors or show per-monitor charts
  const primaryMonitor = monitors[0];
  const uptimeStats = await fetchQuery(api.checks.getUptimeStats, {
    monitorId: primaryMonitor._id,
    days: 30,
  });

  // Fetch recent checks for chart visualization
  const recentChecks = await fetchQuery(api.checks.getRecentForMonitor, {
    monitorId: primaryMonitor._id,
    limit: 90, // ~3 days at 1min intervals, good for visualization
  });

  // Transform checks into chart data format
  const chartData = recentChecks.reverse().map((check) => ({
    timestamp: check.checkedAt,
    responseTime: check.responseTime,
    status: check.status === "up" ? ("up" as const) : ("down" as const),
  }));

  // Fetch incidents for all monitors in this project
  const allIncidents = await Promise.all(
    monitors.map((monitor) =>
      fetchQuery(api.incidents.getForMonitor, {
        monitorId: monitor._id,
        limit: 10,
      })
    )
  );

  // Flatten and sort incidents by start time (most recent first)
  const incidents = allIncidents
    .flat()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 20) // Show max 20 incidents
    .map((incident) => ({
      id: incident._id,
      title: incident.title,
      status: incident.status as
        | "investigating"
        | "identified"
        | "monitoring"
        | "resolved",
      startedAt: new Date(incident.startedAt),
      resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined,
      updates: [], // TODO: Add incident updates when schema supports them
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <StatusHeader
          overallStatus={overallStatus}
          projectName={slug}
          lastUpdated={lastUpdated ? new Date(lastUpdated) : undefined}
        />

        <main className="space-y-16 mt-16">
          {/* Monitor Status Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Monitors
            </h2>
            <div className="bg-surface rounded-lg border border-border divide-y divide-border">
              {monitorsWithStatus.map((monitor) => (
                <MonitorCard
                  key={monitor._id}
                  monitor={{
                    name: monitor.name,
                    currentStatus: monitor.status,
                    lastResponseTime: monitor.lastResponseTime,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Uptime Chart Section */}
          {chartData.length > 0 && (
            <section className="space-y-4">
              <UptimeChart
                data={chartData}
                uptimePercentage={uptimeStats.uptimePercentage}
              />
            </section>
          )}

          {/* Incident Timeline Section */}
          <section>
            <IncidentTimeline incidents={incidents} />
          </section>
        </main>
      </div>
    </div>
  );
}
