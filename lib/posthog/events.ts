import posthog from "posthog-js";

export const PostHogEvents = {
  MONITOR_CREATED: "monitor_created",
  MONITOR_DELETED: "monitor_deleted",
  MONITOR_PAUSED: "monitor_paused",
  MONITOR_RESUMED: "monitor_resumed",
  STATUS_PAGE_VIEWED: "status_page_viewed",
  STATUS_PAGE_CREATED: "status_page_created",
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  DASHBOARD_VIEWED: "dashboard_viewed",
  INCIDENT_VIEWED: "incident_viewed",
} as const;

type EventName = (typeof PostHogEvents)[keyof typeof PostHogEvents];

export function captureEvent(
  event: EventName,
  properties?: Record<string, unknown>,
) {
  if (typeof window !== "undefined") {
    posthog.capture(event, properties);
  }
}

export function isFeatureEnabled(flag: string): boolean {
  if (typeof window === "undefined") return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}

export function getFeatureFlag<T = string | boolean>(
  flag: string,
  defaultValue: T,
): T {
  if (typeof window === "undefined") return defaultValue;
  return (posthog.getFeatureFlag(flag) as T) ?? defaultValue;
}
