import { StatusIndicator } from "./StatusIndicator";

interface StatusHeaderProps {
  overallStatus: "up" | "down" | "degraded" | "unknown";
  projectName: string;
  lastUpdated?: Date;
}

export function StatusHeader({
  overallStatus,
  projectName,
  lastUpdated,
}: StatusHeaderProps) {
  const statusMessages = {
    up: "All systems operational",
    degraded: "Some systems experiencing issues",
    down: "Major outage in progress",
    unknown: "Status unknown",
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
        {projectName}
      </h1>

      <div className="flex items-center gap-3 min-h-[44px]">
        <StatusIndicator status={overallStatus} />
        <div>
          <p className="text-sm sm:text-base font-medium text-text-primary">
            {statusMessages[overallStatus]}
          </p>
          {lastUpdated && (
            <p className="text-xs sm:text-sm text-text-tertiary">
              Last checked {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
