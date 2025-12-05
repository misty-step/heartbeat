/**
 * Time and duration formatting utilities - pure functions with injectable time
 *
 * All functions that depend on "now" accept an optional `now` parameter
 * for testability (no mocking Date.now() required).
 */

/**
 * Format a timestamp as a relative time string (e.g., "5 minutes ago").
 * @param timestamp - Unix timestamp in milliseconds
 * @param now - Current time (defaults to Date.now() for production use)
 */
export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/**
 * Format a duration in milliseconds as a human-readable string.
 * @param durationMs - Duration in milliseconds
 */
export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (remainingMins > 0) return `${hours}h ${remainingMins}m`;
  return `${hours}h`;
}

/**
 * Calculate and format duration between two timestamps.
 * @param startedAt - Start time as Date
 * @param resolvedAt - End time as Date (optional, defaults to now)
 * @param now - Current time for open durations (defaults to Date.now())
 */
export function calculateDuration(
  startedAt: Date,
  resolvedAt?: Date,
  now: number = Date.now(),
): string {
  const end = resolvedAt || new Date(now);
  const durationMs = end.getTime() - startedAt.getTime();
  return formatDuration(durationMs);
}

/**
 * Format a Date as a localized timestamp string.
 * @param date - Date to format
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format response time in milliseconds.
 * @param ms - Response time in milliseconds
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
