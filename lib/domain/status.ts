/**
 * Monitor status domain logic - single source of truth
 *
 * Status computation is based on consecutive failures:
 * - 0 failures: "up" (operational)
 * - 1-2 failures: "degraded" (experiencing issues)
 * - 3+ failures: "down" (incident triggered)
 */

export type MonitorStatus = "up" | "degraded" | "down";

/**
 * Compute monitor status from consecutive failure count.
 * This is the canonical status computation - used by both backend and frontend.
 */
export function computeStatus(consecutiveFailures: number): MonitorStatus {
  if (consecutiveFailures === 0) return "up";
  if (consecutiveFailures < 3) return "degraded";
  return "down";
}

/**
 * Aggregate multiple monitor statuses into a single overall status.
 * Returns the "worst" status among all monitors.
 */
export function aggregateStatuses(statuses: MonitorStatus[]): MonitorStatus {
  if (statuses.length === 0) return "up";
  if (statuses.some((s) => s === "down")) return "down";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  return "up";
}

/**
 * Get human-readable label for a status.
 */
export function getStatusLabel(status: MonitorStatus): string {
  switch (status) {
    case "up":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
  }
}

/**
 * Get headline text for aggregate status display.
 */
export function getStatusHeadline(status: MonitorStatus | null): string {
  switch (status) {
    case "up":
      return "All Systems Operational";
    case "degraded":
      return "Partial Degradation";
    case "down":
      return "System Issues Detected";
    default:
      return "Status Unknown";
  }
}
