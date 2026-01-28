import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex-public";
import { api } from "@/convex/_generated/api";
import { ThemedStatusPage } from "@/components/themes";
import { type ThemeId } from "@/lib/themes";

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

  const monitor = await fetchPublicQuery(
    api.monitors.getPublicMonitorByStatusSlug,
    {
      statusSlug,
    },
  );

  if (!monitor) {
    notFound();
  }

  // Fetch uptime stats
  const uptimeStats = await fetchPublicQuery(api.checks.getPublicUptimeStats, {
    monitorId: monitor._id,
    days: 90, // 90-day history per TASK.md
  });

  // Fetch recent checks for chart
  const recentChecks = await fetchPublicQuery(
    api.checks.getPublicChecksForMonitor,
    {
      monitorId: monitor._id,
      limit: 90,
    },
  );

  // Transform checks into chart data format
  const chartData = recentChecks.reverse().map((check) => ({
    timestamp: check.checkedAt,
    responseTime: check.responseTime,
    status: check.status === "up" ? ("up" as const) : ("down" as const),
  }));

  // Fetch incidents for this monitor
  const incidentsResponse = await fetchPublicQuery(
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
    <ThemedStatusPage
      theme={monitor.theme as ThemeId | undefined}
      monitorName={monitor.name}
      status={monitor.status}
      uptimePercentage={uptimeStats.uptimePercentage}
      avgResponseTime={avgResponseTime}
      lastCheckAt={monitor.lastCheckAt}
      chartData={chartData}
      incidents={incidents}
    />
  );
}
