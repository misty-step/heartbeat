import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

// ISR Configuration
export const revalidate = 60; // Revalidate every 60 seconds
export const dynamicParams = true; // Allow new slugs not in generateStaticParams

interface PageProps {
  params: Promise<{ slug: string }>;
}

type MonitorStatus = "up" | "degraded" | "down";
type OverallStatus = "operational" | "degraded" | "down";

const getMonitorStatus = (consecutiveFailures: number): MonitorStatus => {
  if (consecutiveFailures === 0) return "up";
  if (consecutiveFailures < 3) return "degraded";
  return "down";
};

const STATUS_COLORS: Record<MonitorStatus, string> = {
  up: "text-success",
  degraded: "text-warning",
  down: "text-error",
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
      : "operational";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Temporary placeholder - will be replaced with actual components */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary mb-4">
              {slug} Status
            </h1>
            <div className="text-lg text-text-secondary">
              Status: <span className="font-medium">{overallStatus}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              Monitors ({monitors.length})
            </h2>
            <div className="space-y-2">
              {monitorsWithStatus.map((monitor) => (
                <div
                  key={monitor._id}
                  className="p-4 rounded-lg border border-border bg-surface"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">
                      {monitor.name}
                    </span>
                    <span className={`text-sm ${STATUS_COLORS[monitor.status]}`}>
                      {monitor.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
