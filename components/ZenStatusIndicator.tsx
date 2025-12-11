import { type MonitorStatus } from "@/lib/domain";

interface ZenStatusIndicatorProps {
  status: MonitorStatus;
  size?: "sm" | "md" | "lg";
}

/**
 * Minimal breathing status dot for Zen status pages.
 *
 * Unlike StatusIndicator (rings, glows, urgency), this is pure:
 * - Single circle
 * - When up: slow 6s breathing
 * - When degraded: slightly faster 4s breathing
 * - When down: stillness — no animation signals alarm
 */
export function ZenStatusIndicator({
  status,
  size = "md",
}: ZenStatusIndicatorProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6", // Larger for hero visibility
  };

  const colorClasses: Record<MonitorStatus, string> = {
    up: "bg-up-glow",
    degraded: "bg-degraded",
    down: "bg-down",
  };

  const animationClasses: Record<MonitorStatus, string> = {
    up: "animate-zen-breathe",
    degraded: "animate-zen-breathe-fast",
    down: "", // Stillness signals alarm
  };

  return (
    <div
      className={`
        rounded-full
        ${sizeClasses[size]}
        ${colorClasses[status]}
        ${animationClasses[status]}
      `}
      role="status"
      aria-label={`Status: ${status}`}
    />
  );
}
