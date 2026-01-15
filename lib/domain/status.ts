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

/**
 * URL pattern detection for contextual status messages.
 */
type EndpointType = "api" | "health" | "website" | "generic";

function detectEndpointType(url: string): EndpointType {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("/api/") || urlLower.includes("/api")) return "api";
  if (
    urlLower.includes("/health") ||
    urlLower.includes("/status") ||
    urlLower.includes("/ping")
  )
    return "health";
  // Check if it's just a domain (likely a website)
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/" || parsed.pathname === "") return "website";
  } catch {
    // Invalid URL, fall through
  }
  return "generic";
}

/**
 * Calculate Apdex (Application Performance Index) score.
 *
 * Apdex measures user satisfaction on a 0-1 scale:
 * - Satisfied: response time < satisfiedThreshold (default 200ms)
 * - Tolerating: response time between satisfied and tolerated thresholds
 * - Frustrated: response time > toleratedThreshold (default 1000ms)
 *
 * Formula: (Satisfied + Tolerating/2) / Total
 *
 * Score interpretation:
 * - 0.94-1.00: Excellent
 * - 0.85-0.93: Good
 * - 0.70-0.84: Fair
 * - 0.50-0.69: Poor
 * - < 0.50: Unacceptable
 */
export interface ApdexResult {
  score: number;
  satisfied: number;
  tolerating: number;
  frustrated: number;
  total: number;
  rating: "excellent" | "good" | "fair" | "poor" | "unacceptable";
}

export function calculateApdex(
  responseTimes: number[],
  options?: {
    satisfiedThreshold?: number; // Default: 200ms
    toleratedThreshold?: number; // Default: 1000ms
  },
): ApdexResult {
  const satisfiedThreshold = options?.satisfiedThreshold ?? 200;
  const toleratedThreshold = options?.toleratedThreshold ?? 1000;

  if (responseTimes.length === 0) {
    return {
      score: 1,
      satisfied: 0,
      tolerating: 0,
      frustrated: 0,
      total: 0,
      rating: "excellent",
    };
  }

  let satisfied = 0;
  let tolerating = 0;
  let frustrated = 0;

  for (const time of responseTimes) {
    if (time < satisfiedThreshold) {
      satisfied++;
    } else if (time < toleratedThreshold) {
      tolerating++;
    } else {
      frustrated++;
    }
  }

  const total = responseTimes.length;
  const score = (satisfied + tolerating / 2) / total;

  // Determine rating
  let rating: ApdexResult["rating"];
  if (score >= 0.94) rating = "excellent";
  else if (score >= 0.85) rating = "good";
  else if (score >= 0.7) rating = "fair";
  else if (score >= 0.5) rating = "poor";
  else rating = "unacceptable";

  return {
    score: Math.round(score * 1000) / 1000, // 3 decimal places
    satisfied,
    tolerating,
    frustrated,
    total,
    rating,
  };
}

/**
 * Get natural language status message based on URL context.
 *
 * Instead of generic "Operational" / "Degraded" / "Down", returns
 * contextual messages like "API responding normally" or "Website is unreachable".
 */
export function getNaturalStatusMessage(
  status: MonitorStatus,
  url: string,
  options?: {
    consecutiveFailures?: number;
    lastResponseTime?: number;
    degradedSinceMs?: number;
  },
): string {
  const endpointType = detectEndpointType(url);
  const {
    consecutiveFailures = 0,
    lastResponseTime,
    degradedSinceMs,
  } = options ?? {};

  // Format duration if we have it
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "less than a minute";
    if (minutes === 1) return "1 minute";
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour";
    return `${hours} hours`;
  };

  // UP status messages
  if (status === "up") {
    // Check if response time is slow (> 500ms)
    if (lastResponseTime && lastResponseTime > 500) {
      switch (endpointType) {
        case "api":
          return "API responding slowly";
        case "health":
          return "Service healthy but slow";
        case "website":
          return "Website loading slowly";
        default:
          return "Responding slowly";
      }
    }

    switch (endpointType) {
      case "api":
        return "API responding normally";
      case "health":
        return "Service healthy";
      case "website":
        return "Website is up";
      default:
        return "All systems operational";
    }
  }

  // DEGRADED status messages
  if (status === "degraded") {
    const durationSuffix = degradedSinceMs
      ? ` for ${formatDuration(degradedSinceMs)}`
      : "";

    switch (endpointType) {
      case "api":
        return `API experiencing issues${durationSuffix}`;
      case "health":
        return `Service degraded${durationSuffix}`;
      case "website":
        return `Website partially unavailable${durationSuffix}`;
      default:
        return `Performance degradation${durationSuffix}`;
    }
  }

  // DOWN status messages
  const failureContext =
    consecutiveFailures > 3 ? ` (${consecutiveFailures} failed checks)` : "";

  switch (endpointType) {
    case "api":
      return `API is unreachable${failureContext}`;
    case "health":
      return `Service is down${failureContext}`;
    case "website":
      return `Website is unreachable${failureContext}`;
    default:
      return `Service outage${failureContext}`;
  }
}
