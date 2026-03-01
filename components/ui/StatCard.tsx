import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  status?: "good" | "warn" | "bad";
  size?: "default" | "large";
  className?: string;
}

/** Status border colors using semantic tokens */
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
 * StatCard - Glass Design System
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
        "rounded-xl bg-[var(--color-bg-elevated)]",
        "border shadow-[var(--shadow-sm)]",
        status ? statusAccent[status] : "border-[var(--color-border-subtle)]",
        isLarge ? "p-8" : "p-6",
        "text-center",
        className,
      )}
    >
      <p
        className={cn(
          "font-semibold tracking-wider uppercase text-[var(--color-text-muted)]",
          isLarge ? "text-xs mb-2" : "text-[10px] mb-1",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "font-extrabold tabular-nums",
          isLarge
            ? cn(
                "text-3xl sm:text-4xl",
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
