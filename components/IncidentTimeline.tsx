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
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    identified: {
      label: "Identified",
      color: "text-error",
      bgColor: "bg-error/10",
    },
    monitoring: {
      label: "Monitoring",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    resolved: {
      label: "Resolved",
      color: "text-success",
      bgColor: "bg-success/10",
    },
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const calculateDuration = (startedAt: Date, resolvedAt?: Date) => {
    const end = resolvedAt || new Date();
    const diffMs = end.getTime() - startedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (incidents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-tertiary">No incidents to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        Incident History
      </h2>

      <div className="space-y-6">
        {incidents.map((incident) => {
          const config = statusConfig[incident.status];

          return (
            <div
              key={incident.id}
              className="border-l-2 border-border pl-4 space-y-3"
            >
              {/* Incident header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-xs text-text-tertiary tabular-nums">
                    {calculateDuration(incident.startedAt, incident.resolvedAt)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-text-primary">
                  {incident.title}
                </h3>
                <p className="text-xs text-text-tertiary">
                  Started {formatTimestamp(incident.startedAt)}
                  {incident.resolvedAt &&
                    ` • Resolved ${formatTimestamp(incident.resolvedAt)}`}
                </p>
              </div>

              {/* Updates */}
              {incident.updates && incident.updates.length > 0 && (
                <div className="space-y-2 pl-3 border-l border-border/50">
                  {incident.updates.map((update, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-sm text-text-secondary">
                        {update.message}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatTimestamp(update.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
