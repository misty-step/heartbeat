/**
 * StatusIndicator - Glass Design System
 *
 * The visual heartbeat of the system. Shows monitor status with
 * breathing animation for "up" state.
 *
 * - Up = green, gently breathing
 * - Degraded = amber, subtle pulse
 * - Down = red, still
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { StatusValue } from "@/lib/design/tokens";

const statusIndicatorVariants = cva("rounded-full flex-shrink-0", {
  variants: {
    status: {
      up: "bg-up animate-km-breathe",
      degraded: "bg-degraded animate-km-breathe-subtle",
      down: "bg-down",
      unknown: "bg-unknown opacity-50",
    },
    size: {
      xs: "size-2",
      sm: "size-2.5",
      md: "size-3",
      lg: "size-4",
      xl: "size-5",
      "2xl": "size-6",
    },
  },
  defaultVariants: {
    status: "unknown",
    size: "md",
  },
});

export interface StatusIndicatorProps extends VariantProps<
  typeof statusIndicatorVariants
> {
  status: StatusValue;
  className?: string;
  /** Add subtle glow effect behind indicator */
  glow?: boolean;
}

export function StatusIndicator({
  status,
  size,
  glow = false,
  className,
}: StatusIndicatorProps) {
  return (
    <span className={cn("relative inline-flex", className)}>
      {/* Glow layer - subtle, not aggressive */}
      {glow && status !== "unknown" && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-full blur-sm",
            status === "up" && "bg-up opacity-30",
            status === "degraded" && "bg-degraded opacity-25",
            status === "down" && "bg-down opacity-25",
          )}
          style={{
            transform: "scale(1.5)",
          }}
        />
      )}

      {/* Main indicator */}
      <span
        className={cn(statusIndicatorVariants({ status, size }))}
        role="status"
        aria-label={`Status: ${status}`}
      />
    </span>
  );
}

/**
 * StatusDot - Minimal inline version for tight spaces
 */
export function StatusDot({
  status,
  className,
}: {
  status: StatusValue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        status === "up" && "bg-up",
        status === "degraded" && "bg-degraded",
        status === "down" && "bg-down",
        status === "unknown" && "bg-unknown opacity-50",
        className,
      )}
      role="status"
      aria-label={`Status: ${status}`}
    />
  );
}

export { statusIndicatorVariants };
