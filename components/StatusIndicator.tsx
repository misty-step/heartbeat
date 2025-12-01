interface StatusIndicatorProps {
  status: "up" | "down" | "degraded" | "unknown";
  size?: "sm" | "md" | "lg" | "xl";
  cinematic?: boolean; // Enable extra ring layers for dramatic effect
}

export function StatusIndicator({
  status,
  size = "md",
  cinematic = false
}: StatusIndicatorProps) {
  // Size variants - larger for more visual impact
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  // Revolutionary: "up" uses black/white (theme-aware) with cyan glow
  // Other statuses use semantic colors
  const colorMap = {
    up: "bg-up",              // Black (light) / White (dark) - distinctive!
    degraded: "bg-degraded",   // Orange
    down: "bg-down",           // Red
    unknown: "bg-unknown",     // Gray
  };

  const dotColor = colorMap[status];
  const shouldHeartbeat = status === "up";

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Main status dot */}
      <div
        className={`relative z-10 rounded-full ${sizeClasses[size]} ${dotColor}`}
        style={{
          animation: shouldHeartbeat ? "heartbeat 2s ease-in-out infinite" : "none",
          willChange: shouldHeartbeat ? "transform, opacity" : "auto",
        }}
      />

      {/* Cyan glow ring - only for "up" status */}
      {shouldHeartbeat && (
        <>
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "var(--color-up-glow)",
              opacity: cinematic ? 0.4 : 0.3,
              filter: cinematic ? "blur(6px)" : "blur(4px)",
            }}
          />

          {/* Expanding ring animation */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "var(--color-up-glow)",
              animation: "ring-expand 2s ease-out infinite",
              willChange: "transform, opacity",
            }}
          />

          {/* Additional cinematic rings */}
          {cinematic && (
            <>
              {/* Secondary expanding ring - delayed */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "var(--color-up-glow)",
                  animation: "ring-expand 2s ease-out infinite 0.5s",
                  willChange: "transform, opacity",
                }}
              />

              {/* Pulsing outer aura */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: "-50%",
                  background: "radial-gradient(circle, var(--color-up-glow) 0%, transparent 70%)",
                  animation: "pulse-glow 2s ease-in-out infinite",
                  opacity: 0.2,
                }}
              />
            </>
          )}
        </>
      )}

      {/* Enhanced glow for degraded/down with cinematic mode */}
      {(status === "degraded" || status === "down") && (
        <>
          <div
            className={`absolute inset-0 rounded-full ${
              status === "degraded" ? "bg-degraded" : "bg-down"
            }`}
            style={{
              opacity: cinematic ? 0.3 : 0.2,
              filter: cinematic ? "blur(8px)" : "blur(6px)",
            }}
          />

          {/* Urgent pulsing for down status */}
          {cinematic && status === "down" && (
            <div
              className="absolute rounded-full bg-down"
              style={{
                inset: "-50%",
                animation: "pulse-glow 1s ease-in-out infinite",
                opacity: 0.15,
                filter: "blur(12px)",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
