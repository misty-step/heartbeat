import { formatTimestamp, calculateDuration } from "@/lib/domain";

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
  const statusConfig = {
    investigating: {
      label: "Investigating",
      badge: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
      dot: "bg-amber-400",
    },
    identified: {
      label: "Identified",
      badge: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
      dot: "bg-red-400",
    },
    monitoring: {
      label: "Monitoring",
      badge: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
      dot: "bg-blue-400",
    },
    resolved: {
      label: "Resolved",
      badge: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
      dot: "bg-emerald-400",
    },
  };

  // formatTimestamp and calculateDuration imported from @/lib/domain

  if (incidents.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-sm text-text-tertiary">No incidents to display</p>
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
              className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${config.dot}`}
            />

            {/* Timeline line - connects to next incident */}
            {!isLast && (
              <div className="absolute left-[3px] top-4 bottom-0 w-px bg-foreground/10" />
            )}

            {/* Incident content */}
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${config.badge}`}
                >
                  {config.label}
                </span>
                <span className="text-xs font-mono text-foreground/40 tabular-nums">
                  {calculateDuration(incident.startedAt, incident.resolvedAt)}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground/80">
                {incident.title}
              </p>
              <p className="text-xs text-foreground/40">
                Started {formatTimestamp(incident.startedAt)}
                {incident.resolvedAt &&
                  ` · Resolved ${formatTimestamp(incident.resolvedAt)}`}
              </p>

              {/* Updates */}
              {incident.updates && incident.updates.length > 0 && (
                <div className="mt-3 space-y-2 pl-3 border-l border-foreground/10">
                  {incident.updates.map((update, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-sm text-foreground/60 leading-relaxed">
                        {update.message}
                      </p>
                      <p className="text-xs text-foreground/30">
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
