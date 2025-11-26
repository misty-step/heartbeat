import { StatusIndicator } from "./StatusIndicator";

interface MonitorCardProps {
  monitor: {
    name: string;
    currentStatus: "up" | "down" | "degraded" | "unknown";
    lastResponseTime?: number;
  };
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const statusText = {
    up: "Operational",
    degraded: "Degraded",
    down: "Down",
    unknown: "Unknown",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-surface-hover">
      <StatusIndicator status={monitor.currentStatus} />

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {monitor.name}
        </h3>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {monitor.lastResponseTime !== undefined && (
          <span className="font-mono text-text-tertiary tabular-nums">
            {monitor.lastResponseTime}ms
          </span>
        )}
        <span className="text-text-secondary">
          {statusText[monitor.currentStatus]}
        </span>
      </div>
    </div>
  );
}
