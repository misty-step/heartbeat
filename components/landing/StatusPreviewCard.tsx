/**
 * StatusPreviewCard
 *
 * A deep module that encapsulates all status display logic.
 * Hides: status-to-color mapping, uptime bar generation, monitor list rendering.
 * Exposes: simple props interface for rendering a status preview.
 *
 * @ousterhout Deep module - complex internals, simple interface
 */

import { cn } from "@/lib/cn";

// Internal: status configuration (hidden from consumers)
const STATUS_CONFIG = {
  up: { label: "Operational", colorVar: "--color-status-up" },
  degraded: { label: "Degraded", colorVar: "--color-status-degraded" },
  down: { label: "Outage", colorVar: "--color-status-down" },
} as const;

type Status = keyof typeof STATUS_CONFIG;

interface Monitor {
  name: string;
  status: Status;
}

interface StatusPreviewCardProps {
  /** Display name for the service/system */
  name: string;
  /** Overall system status */
  status: Status;
  /** 90-day uptime percentage (e.g., 99.98) */
  uptime: number;
  /** List of individual monitors */
  monitors: Monitor[];
}

/**
 * Renders a status preview card matching the Kyoto Moss design system.
 * Server component - no client interactivity needed.
 */
export function StatusPreviewCard({
  name,
  status,
  uptime,
  monitors,
}: StatusPreviewCardProps) {
  const config = STATUS_CONFIG[status];
  const colorStyle = { color: `var(${config.colorVar})` };
  const bgStyle = { backgroundColor: `var(${config.colorVar})` };
  const borderStyle = { borderColor: `var(${config.colorVar})` };

  return (
    <article className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-6">
      {/* Header: name + status badge */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <h3 className="font-display text-lg font-medium text-[var(--color-text-primary)] tracking-tight">
          {name}
        </h3>
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-2"
          style={borderStyle}
        >
          <div className="size-2 rounded-full" style={bgStyle} />
          <span className="text-xs font-medium" style={colorStyle}>
            {config.label}
          </span>
        </div>
      </header>

      {/* Uptime metric */}
      <div className="mb-6">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-2">
          90-Day Uptime
        </p>
        <p
          className="font-mono text-3xl font-medium tracking-tight tabular-nums"
          style={colorStyle}
        >
          {uptime.toFixed(2)}%
        </p>
      </div>

      {/* Uptime history bar (30 days) */}
      <UptimeBar status={status} uptime={uptime} />

      {/* Monitor list */}
      <ul className="space-y-3 pt-4 border-t border-[var(--color-border-subtle)]">
        {monitors.map((monitor) => (
          <MonitorRow key={monitor.name} monitor={monitor} />
        ))}
      </ul>
    </article>
  );
}

/**
 * Internal: Uptime history visualization
 * Encapsulates the logic for generating the 30-day bar
 */
function UptimeBar({ status, uptime }: { status: Status; uptime: number }) {
  return (
    <div
      className="flex gap-[2px] mb-6"
      role="img"
      aria-label={`Uptime history showing ${uptime}% uptime over 30 days`}
    >
      {Array.from({ length: 30 }).map((_, i) => {
        // Simulate recent issues based on status
        const isRecent = i >= 25;
        const isVeryRecent = i >= 28;

        let barClass = "bg-[var(--color-status-up)]/25";
        if (status === "degraded" && isRecent) {
          barClass = "bg-[var(--color-status-degraded)]/60";
        } else if (status === "down" && isVeryRecent) {
          barClass = "bg-[var(--color-status-down)]";
        }

        return <div key={i} className={cn("flex-1 h-2", barClass)} />;
      })}
    </div>
  );
}

/**
 * Internal: Single monitor row
 */
function MonitorRow({ monitor }: { monitor: Monitor }) {
  const config = STATUS_CONFIG[monitor.status];
  const colorStyle = { color: `var(${config.colorVar})` };
  const bgStyle = { backgroundColor: `var(${config.colorVar})` };

  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full" style={bgStyle} />
        <span className="text-sm text-[var(--color-text-primary)]">
          {monitor.name}
        </span>
      </div>
      <span className="text-xs font-medium" style={colorStyle}>
        {config.label}
      </span>
    </li>
  );
}
