import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ZenStatusHero } from "@/components/ZenStatusHero";
import { StatusPageDetails } from "@/components/StatusPageDetails";

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

  // Calculate average response time from recent checks
  const avgResponseTime =
    recentChecks.length > 0
      ? recentChecks.reduce((sum, c) => sum + c.responseTime, 0) /
        recentChecks.length
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <ZenStatusHero status={monitor.status} monitorName={monitor.name} />

      <StatusPageDetails
        chartData={chartData}
        uptimePercentage={uptimeStats.uptimePercentage}
        avgResponseTime={avgResponseTime}
        lastCheckAt={monitor.lastCheckAt}
        incidents={incidents}
      />
    </div>
  );
}
