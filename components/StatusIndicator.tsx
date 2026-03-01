/**
 * StatusIndicator
 *
 * Status dot with optional cinematic mode (single Field glow token).
 * For standard use, prefer components/ui/StatusIndicator.tsx
 */

const statusLabels = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
} as const;

interface StatusIndicatorProps {
  status: "up" | "down" | "degraded" | "unknown";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  cinematic?: boolean;
}

export function StatusIndicator({
  status,
  size = "md",
  cinematic = false,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
    xl: "size-6",
    "2xl": "size-8",
  };

  const colorMap = {
    up: "bg-up",
    degraded: "bg-degraded",
    down: "bg-down",
    unknown: "bg-[var(--color-text-muted)]",
  };

  const dotColor = colorMap[status];
  const shouldBreathe = status === "up";

  return (
    <div
      role="status"
      className={`relative flex items-center justify-center ${sizeClasses[size]}`}
    >
      {/* Screen reader text - must be DOM content, not aria-label, for dynamic updates */}
      <span className="sr-only">{`Status: ${statusLabels[status]}`}</span>

      {/* Main status dot */}
      <div
        className={`relative z-10 rounded-full ${sizeClasses[size]} ${dotColor} ${shouldBreathe ? "animate-km-breathe" : ""}`}
      />

      {/* Cinematic: use Field shadow-glow token for "up"; pulse-shadow for "down" */}
      {cinematic && status === "up" && (
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "var(--shadow-glow)", opacity: 0.8 }}
        />
      )}
      {cinematic && status === "down" && (
        <div
          className="absolute inset-0 rounded-full bg-down animate-pulse"
          style={{ opacity: 0.25 }}
        />
      )}
    </div>
  );
}
