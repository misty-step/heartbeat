interface StatusIndicatorProps {
  status: "up" | "down" | "degraded" | "unknown";
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const colorMap = {
    up: "bg-success",
    degraded: "bg-warning",
    down: "bg-error",
    unknown: "bg-text-tertiary",
  };

  const dotColor = colorMap[status];
  const shouldAnimate = status === "up";

  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {/* Base dot */}
      <div className={`relative z-10 w-3 h-3 rounded-full ${dotColor}`} />

      {/* Animated outer ring - only for "up" status */}
      {shouldAnimate && (
        <div
          className={`absolute inset-0 rounded-full ${dotColor} opacity-40 animate-pulse`}
        />
      )}
    </div>
  );
}
