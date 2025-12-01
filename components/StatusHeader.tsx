"use client";

import { StatusIndicator } from "./StatusIndicator";

interface StatusHeaderProps {
  overallStatus: "up" | "down" | "degraded" | "unknown";
  projectName: string;
  lastUpdated?: Date;
  sticky?: boolean;
}

export function StatusHeader({
  overallStatus,
  projectName,
  lastUpdated,
  sticky = false,
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

  const baseClasses = "py-6 sm:py-8";
  const stickyClasses = sticky
    ? "sticky top-0 z-50 glass-adaptive border-b-2 border-border-strong"
    : "";

  return (
    <div className={`${baseClasses} ${stickyClasses}`}>
      <div className="space-y-4 sm:space-y-6 animate-in-1">
        {/* Project Name - Display Font */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl text-display font-bold text-text-primary leading-tight">
          {projectName}
        </h1>

        {/* Status - Dramatically Larger */}
        <div className="flex items-center gap-4 min-h-[44px]">
          <StatusIndicator status={overallStatus} size="lg" />
          <div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-primary">
              {statusMessages[overallStatus]}
            </p>
            {lastUpdated && (
              <p className="text-sm sm:text-base text-text-secondary mt-1 text-mono">
                Last checked {formatLastUpdated(lastUpdated)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
