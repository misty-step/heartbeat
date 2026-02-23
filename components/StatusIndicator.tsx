/**
 * StatusIndicator - Hearthstone Design System (Cinematic Variant)
 *
 * Enhanced status indicator with cinematic mode for dramatic effects.
 * Used on landing pages and hero sections.
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

  const glowColorMap = {
    up: "var(--color-status-up)",
    degraded: "var(--color-status-degraded)",
    down: "var(--color-status-down)",
    unknown: "var(--color-text-muted)",
  };

  const dotColor = colorMap[status];
  const glowColor = glowColorMap[status];
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
        className={`relative z-10 rounded-full ${sizeClasses[size]} ${dotColor} ${shouldBreathe ? "animate-hs-ember-pulse" : ""}`}
      />

      {/* Glow effect for all statuses - increased visibility */}
      <div
        className={`absolute inset-0 rounded-full ${dotColor}`}
        style={{
          opacity: cinematic ? 0.55 : 0.45,
          filter: cinematic ? "blur(8px)" : "blur(5px)",
        }}
      />

      {/* Breathing ring for up status - increased visibility */}
      {shouldBreathe && (
        <div
          className="absolute inset-0 rounded-full animate-hs-ember-flicker"
          style={{
            background: glowColor,
            opacity: 0.5,
            filter: "blur(4px)",
          }}
        />
      )}

      {/* Additional cinematic effects */}
      {cinematic && (
        <>
          {/* Outer glow aura - increased visibility */}
          <div
            className="absolute rounded-full"
            style={{
              inset: "-50%",
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              animation: shouldBreathe
                ? "hs-ember-pulse 4s ease-in-out infinite"
                : "none",
              opacity: 0.35,
            }}
          />

          {/* Extra pulsing for down status (urgency) - increased visibility */}
          {status === "down" && (
            <div
              className="absolute rounded-full bg-down"
              style={{
                inset: "-75%",
                animation: "hs-ember-flicker 3s ease-in-out infinite",
                opacity: 0.25,
                filter: "blur(12px)",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
