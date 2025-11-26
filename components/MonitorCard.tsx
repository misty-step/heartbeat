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
    <div className="flex items-center gap-3 px-4 py-4 sm:py-3 min-h-[60px] sm:min-h-0 transition-colors hover:bg-surface-hover active:bg-surface-hover">
      <StatusIndicator status={monitor.currentStatus} />

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {monitor.name}
        </h3>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-sm flex-shrink-0">
        {monitor.lastResponseTime !== undefined && (
          <span className="font-mono text-text-tertiary tabular-nums text-xs sm:text-sm">
            {monitor.lastResponseTime}ms
          </span>
        )}
        <span className="text-text-secondary hidden xs:inline sm:inline">
          {statusText[monitor.currentStatus]}
        </span>
      </div>
    </div>
  );
}
