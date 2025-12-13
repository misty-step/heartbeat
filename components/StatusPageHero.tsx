import { StatusIndicator } from "./StatusIndicator";
import { formatRelativeTime } from "@/lib/domain/formatting";

interface StatusPageHeroProps {
  status: "up" | "degraded" | "down";
  monitorName: string;
  lastCheckAt?: number;
  uptimePercentage: number;
}

const statusMessages = {
  up: "All Systems Operational",
  degraded: "Experiencing Issues",
  down: "Service Disruption",
};

export function StatusPageHero({
  status,
  monitorName,
  lastCheckAt,
  uptimePercentage,
}: StatusPageHeroProps) {
  return (
    <header className="min-h-[60vh] flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-16">
      {/* Monitor name - smaller, secondary */}
      <p className="text-mono text-sm text-foreground/60 mb-4">{monitorName}</p>

      {/* Giant status message - hero treatment */}
      <h1 className="text-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight">
        {statusMessages[status]}
      </h1>

      {/* Status indicator + uptime */}
      <div className="flex items-center gap-6 mt-8">
        <StatusIndicator status={status} size="2xl" cinematic />
        <div className="text-foreground/80">
          <span className="text-mono text-2xl font-medium">
            {uptimePercentage.toFixed(2)}%
          </span>
          <span className="ml-2 text-foreground/60">uptime</span>
        </div>
      </div>

      {/* Last check time */}
      {lastCheckAt && (
        <p className="text-mono text-sm text-foreground/60 mt-6">
          Last checked {formatRelativeTime(lastCheckAt)}
        </p>
      )}
    </header>
  );
}
