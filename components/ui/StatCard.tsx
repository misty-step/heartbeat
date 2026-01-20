import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  status?: "good" | "warn" | "bad";
  size?: "default" | "large";
  className?: string;
}

/** Status border colors using Kyoto Moss semantic tokens */
const statusAccent: Record<string, string> = {
  good: "border-[var(--color-status-up)]",
  warn: "border-[var(--color-status-degraded)]",
  bad: "border-[var(--color-status-down)]",
};

/** Status value text colors */
const statusValueColor: Record<string, string> = {
  good: "text-up",
  warn: "text-degraded",
  bad: "text-down",
};

/**
 * StatCard - Kyoto Moss Design System
 *
 * Individual stat display card with optional status coloring.
 * Used in the bento grid for uptime, response time, and last check metrics.
 *
 * Supports two sizes:
 * - default: Standard card with 2xl value text
 * - large: Featured card with 4xl value text (for uptime percentage hero)
 */
export function StatCard({
  label,
  value,
  status,
  size = "default",
  className = "",
}: StatCardProps) {
  const isLarge = size === "large";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)]",
        "bg-[var(--color-bg-elevated)]",
        "border shadow-[var(--shadow-sm)]",
        status ? statusAccent[status] : "border-[var(--color-border-default)]",
        isLarge ? "p-6 sm:p-8" : "p-4",
        "text-center",
        className,
      )}
    >
      {/* Top edge highlight - increased visibility */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <p
        className={cn(
          "font-medium tracking-[0.15em] uppercase text-[var(--color-text-muted)]",
          isLarge ? "text-xs mb-2" : "text-[10px] mb-1",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "font-mono font-medium tabular-nums",
          isLarge
            ? cn(
                "text-4xl sm:text-5xl",
                status
                  ? statusValueColor[status]
                  : "text-[var(--color-text-primary)]",
              )
            : "text-2xl text-[var(--color-text-primary)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
