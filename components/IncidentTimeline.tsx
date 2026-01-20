import { formatTimestamp, calculateDuration } from "@/lib/domain";

/**
 * IncidentTimeline - Kyoto Moss Design System
 *
 * Timeline display for incidents with status badges and updates.
 * Uses semantic status colors mapped to incident severity.
 */

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

interface IncidentTimelineProps {
  incidents: Incident[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  // Map incident statuses to Kyoto Moss semantic colors
  const statusConfig = {
    investigating: {
      label: "Investigating",
      badge:
        "bg-degraded-muted text-degraded ring-1 ring-[var(--color-status-degraded)]/20",
      dot: "bg-degraded",
    },
    identified: {
      label: "Identified",
      badge:
        "bg-down-muted text-down ring-1 ring-[var(--color-status-down)]/20",
      dot: "bg-down",
    },
    monitoring: {
      label: "Monitoring",
      badge:
        "bg-[var(--color-accent-secondary)]/10 text-[var(--color-accent-secondary)] ring-1 ring-[var(--color-accent-secondary)]/20",
      dot: "bg-[var(--color-accent-secondary)]",
    },
    resolved: {
      label: "Resolved",
      badge: "bg-up-muted text-up ring-1 ring-[var(--color-status-up)]/20",
      dot: "bg-up",
    },
  };

  if (incidents.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          No incidents to display
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident, index) => {
        const config = statusConfig[incident.status];
        const isLast = index === incidents.length - 1;

        return (
          <div key={incident.id} className="relative pl-6">
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-1.5 size-2 rounded-full ${config.dot}`}
            />

            {/* Timeline line - connects to next incident */}
            {!isLast && (
              <div className="absolute left-[3px] top-4 bottom-0 w-px bg-[var(--color-border-subtle)]" />
            )}

            {/* Incident content */}
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${config.badge}`}
                >
                  {config.label}
                </span>
                <span className="text-xs font-mono text-[var(--color-text-muted)] tabular-nums">
                  {calculateDuration(incident.startedAt, incident.resolvedAt)}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {incident.title}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Started {formatTimestamp(incident.startedAt)}
                {incident.resolvedAt &&
                  ` · Resolved ${formatTimestamp(incident.resolvedAt)}`}
              </p>

              {/* Updates */}
              {incident.updates && incident.updates.length > 0 && (
                <div className="mt-3 space-y-2 pl-3 border-l border-[var(--color-border-subtle)]">
                  {incident.updates.map((update, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
                        {update.message}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatTimestamp(update.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
