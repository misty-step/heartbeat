import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex-public";
import { api } from "@/convex/_generated/api";
import { ThemedStatusPage } from "@/components/themes";
import { THEME_IDS, type ThemeId } from "@/lib/themes";

// ISR Configuration
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamicParams = true; // Allow new slugs not in generateStaticParams

interface PageProps {
  params: Promise<{ statusSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ statusSlug: string }>;
}): Promise<Metadata> {
  const { statusSlug } = await params;
  const monitor = await fetchPublicQuery(
    api.monitors.getPublicMonitorByStatusSlug,
    { statusSlug },
  );

  if (!monitor) {
    return { title: "Status Page Not Found — Heartbeat" };
  }

  return {
    title: `${monitor.name} Status — Heartbeat`,
    description: `Live status and uptime for ${monitor.name}. Powered by Heartbeat uptime monitoring.`,
    alternates: {
      canonical: `https://heartbeat.cool/status/${statusSlug}`,
    },
  };
}

export async function generateStaticParams() {
  // All pages generated on-demand with ISR
  return [];
}

export default async function IndividualStatusPage({
  params,
  searchParams,
}: PageProps) {
  const { statusSlug } = await params;
  const { preview } = await searchParams;

  const monitor = await fetchPublicQuery(
    api.monitors.getPublicMonitorByStatusSlug,
    {
      statusSlug,
    },
  );

  if (!monitor) {
    notFound();
  }

  // Preview mode: allow previewing any valid theme ID
  // Ownership validation happens client-side when applying the theme
  const previewTheme =
    preview && THEME_IDS.includes(preview as ThemeId)
      ? (preview as ThemeId)
      : null;

  // Use allSettled for graceful degradation - show partial data if some queries fail
  const [uptimeStatsResult, recentChecksResult, incidentsResult] =
    await Promise.allSettled([
      fetchPublicQuery(api.checks.getPublicUptimeStats, {
        monitorId: monitor._id,
        days: 90, // 90-day history per TASK.md
      }),
      fetchPublicQuery(api.checks.getPublicChecksForMonitor, {
        monitorId: monitor._id,
        limit: 90,
      }),
      fetchPublicQuery(api.incidents.getPublicIncidentsForMonitor, {
        monitorId: monitor._id,
        limit: 20,
      }),
    ]);

  // Log failures for debugging while still rendering partial data
  if (uptimeStatsResult.status === "rejected") {
    console.error(
      "[StatusPage] Failed to fetch uptime stats:",
      uptimeStatsResult.reason,
    );
  }
  if (recentChecksResult.status === "rejected") {
    console.error(
      "[StatusPage] Failed to fetch recent checks:",
      recentChecksResult.reason,
    );
  }
  if (incidentsResult.status === "rejected") {
    console.error(
      "[StatusPage] Failed to fetch incidents:",
      incidentsResult.reason,
    );
  }

  // Extract values with sensible defaults for failed queries
  const uptimeStats =
    uptimeStatsResult.status === "fulfilled" ? uptimeStatsResult.value : null;
  const recentChecks =
    recentChecksResult.status === "fulfilled" ? recentChecksResult.value : [];
  const incidentsResponse =
    incidentsResult.status === "fulfilled" ? incidentsResult.value : [];

  // Transform checks into chart data format
  const chartData = recentChecks.reverse().map((check) => ({
    timestamp: check.checkedAt,
    responseTime: check.responseTime,
    status: check.status === "up" ? ("up" as const) : ("down" as const),
  }));

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

  // Use preview theme if owner is previewing, otherwise use saved theme
  const effectiveTheme = previewTheme ?? (monitor.theme as ThemeId | undefined);

  const statusLabels = { up: "Operational", degraded: "Degraded Performance", down: "Major Outage" } as const;
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${monitor.name} Status`,
    description: `Live status and uptime for ${monitor.name}. Currently ${statusLabels[monitor.status]}.`,
    url: `https://heartbeat.cool/status/${statusSlug}`,
    provider: {
      "@type": "Organization",
      name: "Heartbeat",
      url: "https://heartbeat.cool",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <ThemedStatusPage
        theme={effectiveTheme}
        monitorName={monitor.name}
        status={monitor.status}
        uptimePercentage={uptimeStats?.uptimePercentage ?? null}
        avgResponseTime={avgResponseTime}
        lastCheckAt={monitor.lastCheckAt}
        chartData={chartData}
        incidents={incidents}
        previewMode={previewTheme !== null}
        previewThemeId={previewTheme ?? undefined}
        monitorId={monitor._id}
        statusSlug={statusSlug}
      />
    </>
  );
}
