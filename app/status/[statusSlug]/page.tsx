import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { StatusPageHero } from "@/components/StatusPageHero";
import { UptimeChart } from "@/components/UptimeChart";
import { IncidentTimeline } from "@/components/IncidentTimeline";

// ISR Configuration
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamicParams = true; // Allow new slugs not in generateStaticParams

interface PageProps {
  params: Promise<{ statusSlug: string }>;
}

export async function generateStaticParams() {
  // All pages generated on-demand with ISR
  return [];
}

export default async function IndividualStatusPage({ params }: PageProps) {
  const { statusSlug } = await params;

  const monitor = await fetchQuery(api.monitors.getPublicMonitorByStatusSlug, {
    statusSlug,
  });

  if (!monitor) {
    notFound();
  }

  // Fetch uptime stats
  const uptimeStats = await fetchQuery(api.checks.getPublicUptimeStats, {
    monitorId: monitor._id,
    days: 90, // 90-day history per TASK.md
  });

  // Fetch recent checks for chart
  const recentChecks = await fetchQuery(api.checks.getPublicChecksForMonitor, {
    monitorId: monitor._id,
    limit: 90,
  });

  // Transform checks into chart data format
  const chartData = recentChecks.reverse().map((check) => ({
    timestamp: check.checkedAt,
    responseTime: check.responseTime,
    status: check.status === "up" ? ("up" as const) : ("down" as const),
  }));

  // Fetch incidents for this monitor
  const incidentsResponse = await fetchQuery(
    api.incidents.getPublicIncidentsForMonitor,
    {
      monitorId: monitor._id,
      limit: 20,
    },
  );

  const incidents = incidentsResponse.map((incident) => ({
    id: incident._id,
    title: incident.title,
    status: incident.status as "investigating" | "identified" | "resolved",
    startedAt: new Date(incident.startedAt),
    resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined,
    updates: [],
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <StatusPageHero
          status={monitor.status}
          monitorName={monitor.name}
          lastCheckAt={monitor.lastCheckAt}
          uptimePercentage={uptimeStats.uptimePercentage}
        />

        <main className="px-6 sm:px-8 lg:px-12 pb-16 space-y-12">
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
