"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function DashboardPage() {
  const monitors = useQuery(api.monitors.list);

  // Loading state
  if (monitors === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Monitor your services in real-time
              </p>
            </div>

            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-surface rounded-lg border border-border animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (monitors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
                Dashboard
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Monitor your services in real-time
              </p>
            </div>

            <div className="text-center py-12">
              <p className="text-base text-text-secondary mb-4">
                No monitors yet. Create your first monitor to get started.
              </p>
              <button className="px-4 py-2 bg-text-primary text-background rounded-lg hover:opacity-90 transition-opacity">
                Create Monitor
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Monitor your services in real-time
            </p>
          </div>

          {/* Monitor grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitors.map((monitor) => (
              <div
                key={monitor._id}
                className="p-6 bg-surface rounded-lg border border-border hover:border-border-strong transition-colors"
              >
                <div className="space-y-4">
                  {/* Monitor header */}
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-text-primary truncate">
                      {monitor.name}
                    </h3>
                    <p className="text-xs text-text-tertiary truncate">
                      {monitor.projectSlug}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        monitor.consecutiveFailures === 0
                          ? "bg-success"
                          : monitor.consecutiveFailures < 3
                          ? "bg-warning"
                          : "bg-error"
                      }`}
                    />
                    <span className="text-sm text-text-secondary">
                      {monitor.consecutiveFailures === 0
                        ? "Operational"
                        : monitor.consecutiveFailures < 3
                        ? "Degraded"
                        : "Down"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-border space-y-2">
                    {monitor.lastResponseTime !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Response time</span>
                        <span className="font-mono text-text-primary tabular-nums">
                          {monitor.lastResponseTime}ms
                        </span>
                      </div>
                    )}
                    {monitor.lastCheckAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Last check</span>
                        <span className="text-text-secondary">
                          {new Date(monitor.lastCheckAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
