import { cn } from "@/lib/cn";

/**
 * Hero monitor panel - product preview in the hero right column.
 * Server component: deterministic tick data, no hooks, no state.
 */

const monitors = [
  {
    name: "API",
    ms: "47ms",
    uptime: "99.3%",
    ticks: Array.from({ length: 45 }, (_, i) => i !== 8 && i !== 31),
  },
  {
    name: "Web app",
    ms: "83ms",
    uptime: "100%",
    ticks: Array.from({ length: 45 }, () => true),
  },
  {
    name: "Checkout",
    ms: "112ms",
    uptime: "97.8%",
    ticks: Array.from(
      { length: 45 },
      (_, i) => i !== 5 && i !== 22 && i !== 38,
    ),
  },
];

export function HeroMonitorPanel() {
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-5">
      {/* URL + operational status */}
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-xs text-muted">
          heartbeat.cool/s/acme
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          All systems up
        </span>
      </div>

      {/* Monitor rows */}
      <div className="space-y-4">
        {monitors.map((monitor) => (
          <div key={monitor.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-body text-sm text-secondary">
                {monitor.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">
                  {monitor.ms}
                </span>
                <span className="w-10 text-right font-mono text-xs text-accent">
                  {monitor.uptime}
                </span>
              </div>
            </div>
            <div className="flex gap-px">
              {monitor.ticks.map((up, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-5 flex-1 rounded-[1px]",
                    up
                      ? "bg-accent"
                      : "bg-[var(--color-border-default)]",
                  )}
                  style={{
                    opacity: up
                      ? 0.3 + (i / monitor.ticks.length) * 0.7
                      : 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
        <span className="font-mono text-xs text-muted">45-day history</span>
        <span className="font-mono text-xs text-muted">checked 43s ago</span>
      </div>
    </div>
  );
}
