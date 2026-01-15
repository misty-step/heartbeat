"use client";

import { calculateApdex, type ApdexResult } from "@/lib/domain/status";
import { cn } from "@/lib/cn";

/**
 * ApdexScore - Kyoto Moss Design System
 *
 * Visual display of Application Performance Index with:
 * - Color-coded score value based on rating (using status tokens)
 * - Rating label (Excellent/Good/Fair/Poor/Unacceptable)
 * - Hover tooltip explaining Apdex methodology
 */

interface ApdexScoreProps {
  responseTimes: number[];
  className?: string;
  showBreakdown?: boolean;
}

// Map Apdex ratings to Kyoto Moss status colors
const ratingColors: Record<ApdexResult["rating"], string> = {
  excellent: "text-up", // Moss green - thriving
  good: "text-up", // Moss green - healthy
  fair: "text-degraded", // Clay amber - caution
  poor: "text-degraded", // Clay amber - warning
  unacceptable: "text-down", // Brick red - needs attention
};

const ratingLabels: Record<ApdexResult["rating"], string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  unacceptable: "Critical",
};

export function ApdexScore({
  responseTimes,
  className = "",
  showBreakdown = false,
}: ApdexScoreProps) {
  const apdex = calculateApdex(responseTimes);

  if (apdex.total === 0) {
    return (
      <div className={cn("text-[var(--color-text-muted)]", className)}>
        <span className="text-xs">No data</span>
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)}>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-2xl font-mono font-medium tabular-nums",
            ratingColors[apdex.rating],
          )}
        >
          {apdex.score.toFixed(2)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
          {ratingLabels[apdex.rating]}
        </span>
      </div>

      {showBreakdown && (
        <div className="mt-2 flex gap-3 text-xs text-[var(--color-text-muted)]">
          <span>
            <span className="text-up">{apdex.satisfied}</span> satisfied
          </span>
          <span>
            <span className="text-degraded">{apdex.tolerating}</span> tolerating
          </span>
          <span>
            <span className="text-down">{apdex.frustrated}</span> frustrated
          </span>
        </div>
      )}

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] text-xs rounded-[var(--radius-md)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <p className="font-medium mb-1">
          Apdex (Application Performance Index)
        </p>
        <p className="opacity-70">
          User satisfaction: 0 (frustrated) to 1 (satisfied)
        </p>
        <p className="opacity-70">
          Based on response times &lt;200ms (satisfied) to &gt;1s (frustrated)
        </p>
      </div>
    </div>
  );
}

/**
 * Compact inline version for stat cards
 */
export function ApdexScoreCompact({
  responseTimes,
  className = "",
}: {
  responseTimes: number[];
  className?: string;
}) {
  const apdex = calculateApdex(responseTimes);

  if (apdex.total === 0) {
    return (
      <span className={cn("text-[var(--color-text-muted)]", className)}>—</span>
    );
  }

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        ratingColors[apdex.rating],
        className,
      )}
    >
      {apdex.score.toFixed(2)}
    </span>
  );
}
