/**
 * StatusDisplayVariants
 *
 * Landing page status card designs for the Design Lab.
 * Each variant explores a different aesthetic within the Kyoto Moss design system.
 *
 * Variants:
 * 1. Bento Grid - Asymmetric dashboard, modern
 * 2. Stone Garden - Karesansui, monitors as stones
 * 3. Kintsugi Ledger - Editorial, gold incident lines
 * 4. Temple Ripple - Concentric status rings
 * 5. Shoji Layer - Frosted glass, depth
 * 6. Zenolith - Monolithic stone, tactile
 */

import { cn } from "@/lib/cn";

type Status = "up" | "degraded" | "down";

interface Monitor {
  name: string;
  url: string;
  status: Status;
  responseTime: number;
}

// Status colors
const statusDot = {
  up: "bg-[var(--color-status-up)]",
  degraded: "bg-[var(--color-status-degraded)]",
  down: "bg-[var(--color-status-down)]",
} as const;

const statusText = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
} as const;

// ============================================================================
// Variant 1: Bento Grid
// Asymmetric grid with large status block + stacked monitors
// Modern, dashboard-like
// ============================================================================
export function BentoGridCard({
  monitors,
  className,
}: {
  monitors: Monitor[];
  className?: string;
}) {
  const [primary, ...secondary] = monitors;
  const aggregateStatus: Status = monitors.some((m) => m.status === "down")
    ? "down"
    : monitors.some((m) => m.status === "degraded")
      ? "degraded"
      : "up";

  return (
    <div className={cn("w-full max-w-lg grid grid-cols-5 gap-2", className)}>
      {/* Large aggregate block - spans 3 columns */}
      <div
        className={cn(
          "col-span-3 row-span-2 bg-[var(--color-bg-elevated)]/80 backdrop-blur-sm",
          "border border-[var(--color-border-subtle)] p-6",
        )}
      >
        <div className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "size-3 rounded-full",
                  statusDot[aggregateStatus],
                )}
              />
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                System Status
              </span>
            </div>
            <p className="text-xl font-medium text-[var(--color-text-primary)] text-balance">
              {aggregateStatus === "up"
                ? "All services operational"
                : aggregateStatus === "degraded"
                  ? "Degraded performance"
                  : "Service disruption"}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-mono text-3xl text-[var(--color-text-primary)] tabular-nums">
              {primary?.responseTime || 0}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              ms avg
            </span>
          </div>
        </div>
      </div>

      {/* Secondary monitor blocks - 2 columns */}
      {secondary.slice(0, 4).map((m) => (
        <div
          key={m.name}
          className={cn(
            "col-span-2 bg-[var(--color-bg-elevated)]/60 backdrop-blur-sm",
            "border border-[var(--color-border-subtle)] p-3",
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("size-2 rounded-full", statusDot[m.status])} />
            <span className="text-xs text-[var(--color-text-secondary)] truncate">
              {m.name}
            </span>
          </div>
          <p className="font-mono text-sm text-[var(--color-text-primary)] tabular-nums">
            {m.responseTime}ms
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Variant 2: Stone Garden (Karesansui)
// Monitors as carefully placed stones in a raked gravel field
// Extreme negative space, asymmetric, contemplative
// ============================================================================
export function StoneGardenCard({
  monitors,
  className,
}: {
  monitors: Monitor[];
  className?: string;
}) {
  const aggregateStatus: Status = monitors.some((m) => m.status === "down")
    ? "down"
    : monitors.some((m) => m.status === "degraded")
      ? "degraded"
      : "up";

  // Stone positions - intentionally asymmetric, like a real zen garden
  const stonePositions = [
    { x: 15, y: 25, size: "lg" },
    { x: 65, y: 45, size: "md" },
    { x: 35, y: 70, size: "sm" },
    { x: 80, y: 20, size: "sm" },
  ];

  return (
    <div
      className={cn(
        "w-full max-w-md aspect-[4/3] relative",
        "bg-[var(--color-bg-elevated)]/40 backdrop-blur-sm",
        "border border-[var(--color-border-subtle)] overflow-hidden",
        className,
      )}
    >
      {/* Raked gravel lines - karesansui pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        aria-hidden="true"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={`${(i + 1) * 5}%`}
            x2="100%"
            y2={`${(i + 1) * 5}%`}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Stones (monitors) */}
      {monitors.slice(0, 4).map((m, i) => {
        const pos = stonePositions[i];
        const sizeClasses = {
          lg: "w-20 h-12",
          md: "w-16 h-10",
          sm: "w-14 h-8",
        };

        return (
          <div
            key={m.name}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2",
              "bg-[var(--color-bg-primary)]/90 border border-[var(--color-border-subtle)]",
              "flex flex-col items-center justify-center",
              sizeClasses[pos.size as keyof typeof sizeClasses],
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div
              className={cn("size-1.5 rounded-full mb-1", statusDot[m.status])}
            />
            <span className="text-[9px] text-[var(--color-text-muted)] truncate max-w-[90%]">
              {m.name.split(" ")[0]}
            </span>
          </div>
        );
      })}

      {/* Aggregate status - bottom corner, like a signature seal */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="flex items-center justify-end gap-2 mb-1">
          <div
            className={cn("size-2 rounded-full", statusDot[aggregateStatus])}
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            {aggregateStatus === "up"
              ? "Harmony"
              : aggregateStatus === "degraded"
                ? "Imbalance"
                : "Disruption"}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] tabular-nums">
          {monitors.length} monitors
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Variant 3: Kintsugi Ledger
// Editorial typography, gold accents for incidents
// High contrast, no chrome, celebrates imperfection
// ============================================================================
export function KintsugiLedgerCard({
  monitors,
  className,
}: {
  monitors: Monitor[];
  className?: string;
}) {
  const healthyCount = monitors.filter((m) => m.status === "up").length;
  const hasIncidents = monitors.some((m) => m.status !== "up");

  return (
    <div className={cn("w-full max-w-sm", className)}>
      {/* Top rule - thick */}
      <div className="h-0.5 bg-[var(--color-text-primary)] mb-6" />

      {/* Header - editorial style */}
      <div className="mb-8">
        <p className="font-serif text-2xl text-[var(--color-text-primary)] leading-tight">
          System Integrity
        </p>
        <p className="font-mono text-4xl text-[var(--color-text-primary)] tabular-nums mt-1">
          {Math.round((healthyCount / monitors.length) * 100)}%
        </p>
      </div>

      {/* Monitor rows */}
      <div className="space-y-0">
        {monitors.map((m, i) => (
          <div key={m.name}>
            {/* Thin rule between items */}
            {i > 0 && (
              <div
                className={cn(
                  "h-px my-3",
                  m.status !== "up"
                    ? "bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-transparent" // Kintsugi gold
                    : "bg-[var(--color-border-subtle)]",
                )}
              />
            )}
            <div className="flex items-baseline justify-between">
              <span
                className={cn(
                  "font-serif italic text-sm",
                  m.status !== "up"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[var(--color-text-secondary)]",
                )}
              >
                {m.name}
              </span>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "text-xs",
                    m.status !== "up"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-[var(--color-text-muted)]",
                  )}
                >
                  {statusText[m.status]}
                </span>
                <span className="font-mono text-xs font-medium text-[var(--color-text-primary)] tabular-nums w-12 text-right">
                  {m.responseTime}ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom rule - thick */}
      <div
        className={cn(
          "h-0.5 mt-6",
          hasIncidents
            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500/0"
            : "bg-[var(--color-text-primary)]",
        )}
      />

      {/* Footer note */}
      <p className="text-[10px] text-[var(--color-text-muted)] mt-3 text-center tracking-wide">
        {hasIncidents ? "Imperfection made visible" : "All systems nominal"}
      </p>
    </div>
  );
}

// ============================================================================
// Variant 4: Temple Ripple
// Concentric circles radiating from center
// Status emanates outward like ripples in water
// ============================================================================
export function TempleRippleCard({
  monitors,
  className,
}: {
  monitors: Monitor[];
  className?: string;
}) {
  const aggregateStatus: Status = monitors.some((m) => m.status === "down")
    ? "down"
    : monitors.some((m) => m.status === "degraded")
      ? "degraded"
      : "up";

  const avgTime = Math.round(
    monitors.reduce((sum, m) => sum + m.responseTime, 0) / monitors.length,
  );

  return (
    <div
      className={cn(
        "w-full max-w-md aspect-square relative",
        "bg-[var(--color-bg-elevated)]/30 backdrop-blur-sm",
        "border border-[var(--color-border-subtle)] overflow-hidden",
        className,
      )}
    >
      {/* Concentric ripples */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {[80, 60, 40, 20].map((r, i) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-[var(--color-text-primary)]"
            opacity={0.08 - i * 0.015}
          />
        ))}
      </svg>

      {/* Center status */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={cn(
            "size-16 rounded-full flex items-center justify-center",
            "bg-[var(--color-bg-primary)]/80 border border-[var(--color-border-subtle)]",
            "shadow-lg",
          )}
        >
          <div
            className={cn("size-6 rounded-full", statusDot[aggregateStatus])}
          />
        </div>
        <p className="mt-4 font-serif text-lg text-[var(--color-text-primary)]">
          {aggregateStatus === "up"
            ? "Stillness"
            : aggregateStatus === "degraded"
              ? "Rippling"
              : "Turbulence"}
        </p>
        <p className="font-mono text-xs text-[var(--color-text-muted)] mt-1 tabular-nums">
          {avgTime}ms
        </p>
      </div>

      {/* Monitor indicators on outer ring */}
      {monitors.map((m, i) => {
        const angle = (i / monitors.length) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 38;
        const y = 50 + Math.sin(angle) * 38;

        return (
          <div
            key={m.name}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className={cn(
                "size-3 rounded-full border-2 border-[var(--color-bg-primary)]",
                statusDot[m.status],
              )}
              title={m.name}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Variant 5: Shoji Layer
// Frosted glass panels, layered depth
// Stripe/Linear quality, professional but warm
// ============================================================================
export function ShojiLayerCard({
  monitors,
  className,
}: {
  monitors: Monitor[];
  className?: string;
}) {
  const aggregateStatus: Status = monitors.some((m) => m.status === "down")
    ? "down"
    : monitors.some((m) => m.status === "degraded")
      ? "degraded"
      : "up";

  return (
    <div
      className={cn(
        "w-full max-w-md",
        "bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl",
        "border border-[var(--color-border-subtle)]/50",
        "shadow-xl shadow-black/5",
        className,
      )}
    >
      {/* Header panel */}
      <div className="p-6 border-b border-[var(--color-border-subtle)]/30">
        <div className="flex items-center gap-3">
          {/* Ambient glow indicator */}
          <div className="relative">
            <div
              className={cn("size-3 rounded-full", statusDot[aggregateStatus])}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-md opacity-50",
                statusDot[aggregateStatus],
              )}
            />
          </div>
          <div>
            <p className="font-serif text-xl text-[var(--color-text-primary)]">
              {aggregateStatus === "up"
                ? "All Systems Operational"
                : aggregateStatus === "degraded"
                  ? "Partial Degradation"
                  : "Service Disruption"}
            </p>
          </div>
        </div>
      </div>

      {/* Monitor rows - separated by partial hairlines */}
      <div className="p-4">
        {monitors.map((m, i) => (
          <div key={m.name}>
            {i > 0 && (
              <div className="mx-4 h-px bg-[var(--color-border-subtle)]/40 my-3" />
            )}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-3">
                {/* Left edge glow for status */}
                <div
                  className={cn(
                    "w-0.5 h-6 rounded-full",
                    m.status === "up"
                      ? "bg-[var(--color-status-up)]/60"
                      : m.status === "degraded"
                        ? "bg-[var(--color-status-degraded)]"
                        : "bg-[var(--color-status-down)]",
                  )}
                />
                <span className="text-sm text-[var(--color-text-primary)]">
                  {m.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {statusText[m.status]}
                </span>
                <span className="font-mono text-sm text-[var(--color-text-secondary)] tabular-nums">
                  {m.responseTime}ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-[var(--color-bg-primary)]/30 border-t border-[var(--color-border-subtle)]/20">
        <p className="text-[10px] text-[var(--color-text-muted)] text-center tracking-wider uppercase">
          Updated continuously
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Variant 6: Zenolith
// Monolithic stone block, tactile and grounded
// Heavy grain texture, earth tones, carved typography
// ============================================================================
export function ZenolithCard({
  monitors,
  className,
}: {
  monitors: Monitor[];
  className?: string;
}) {
  const aggregateStatus: Status = monitors.some((m) => m.status === "down")
    ? "down"
    : monitors.some((m) => m.status === "degraded")
      ? "degraded"
      : "up";

  const avgTime = Math.round(
    monitors.reduce((sum, m) => sum + m.responseTime, 0) / monitors.length,
  );

  // Earth tone status colors
  const earthStatus = {
    up: "bg-emerald-700/80 dark:bg-emerald-600/80",
    degraded: "bg-amber-700/80 dark:bg-amber-600/80",
    down: "bg-red-800/80 dark:bg-red-700/80",
  };

  return (
    <div
      className={cn(
        "w-full max-w-md relative overflow-hidden",
        "bg-stone-200 dark:bg-stone-800",
        "border border-stone-300 dark:border-stone-700",
        "shadow-2xl",
        className,
      )}
    >
      {/* Heavy grain texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content - deep padding, monolithic feel */}
      <div className="relative p-10">
        {/* Status - letterpress style */}
        <div className="text-center mb-8">
          <p
            className="font-serif text-2xl tracking-wide text-stone-700 dark:text-stone-300"
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.3), 0 -1px 0 rgba(0,0,0,0.1)",
            }}
          >
            {aggregateStatus === "up"
              ? "Systems Stable"
              : aggregateStatus === "degraded"
                ? "Under Strain"
                : "Disrupted"}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div
              className={cn(
                "size-2.5 rounded-full",
                earthStatus[aggregateStatus],
              )}
            />
            <span className="font-mono text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
              {monitors.filter((m) => m.status === "up").length}/
              {monitors.length} healthy
            </span>
          </div>
        </div>

        {/* Monitors as floating pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {monitors.map((m) => (
            <div
              key={m.name}
              className={cn(
                "px-3 py-1.5 rounded-sm",
                "bg-stone-100/80 dark:bg-stone-900/60",
                "border border-stone-300/50 dark:border-stone-600/50",
                "flex items-center gap-2",
              )}
            >
              <div
                className={cn("size-1.5 rounded-full", earthStatus[m.status])}
              />
              <span className="text-xs text-stone-600 dark:text-stone-400">
                {m.name}
              </span>
              <span className="font-mono text-[10px] text-stone-500 dark:text-stone-500 tabular-nums">
                {m.responseTime}ms
              </span>
            </div>
          ))}
        </div>

        {/* Average response - carved at bottom */}
        <div className="mt-8 text-center">
          <span className="font-mono text-3xl text-stone-600 dark:text-stone-400 tabular-nums">
            {avgTime}
          </span>
          <span className="text-sm text-stone-500 dark:text-stone-500 ml-1">
            ms avg
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Mixed state dummy data - shows all three states
// ============================================================================
export const MIXED_STATE_MONITORS: Monitor[] = [
  {
    name: "API Gateway",
    url: "https://api.acme.io/health",
    status: "up",
    responseTime: 142,
  },
  {
    name: "Web App",
    url: "https://app.acme.io",
    status: "up",
    responseTime: 89,
  },
  {
    name: "Auth Service",
    url: "https://auth.acme.io/status",
    status: "degraded",
    responseTime: 487,
  },
  {
    name: "CDN Edge",
    url: "https://cdn.acme.io",
    status: "up",
    responseTime: 23,
  },
];

export const ALL_HEALTHY_MONITORS: Monitor[] = [
  {
    name: "API Gateway",
    url: "https://api.acme.io/health",
    status: "up",
    responseTime: 142,
  },
  {
    name: "Web App",
    url: "https://app.acme.io",
    status: "up",
    responseTime: 89,
  },
  {
    name: "Database",
    url: "https://db.acme.io/status",
    status: "up",
    responseTime: 23,
  },
];
