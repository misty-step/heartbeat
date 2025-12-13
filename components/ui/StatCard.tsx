interface StatCardProps {
  label: string;
  value: string;
  status?: "good" | "warn" | "bad";
}

const statusAccent: Record<string, string> = {
  good: "ring-emerald-500/20",
  warn: "ring-amber-500/20",
  bad: "ring-red-500/20",
};

/**
 * Individual stat display card with optional status coloring.
 * Used in the bento grid for uptime, response time, and last check metrics.
 */
export function StatCard({ label, value, status }: StatCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-background/30 backdrop-blur-lg
        ring-1 ${status ? statusAccent[status] : "ring-white/10"}
        shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
        p-4 text-center
      `}
    >
      {/* Top edge highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-foreground/40 mb-1">
        {label}
      </p>
      <p className="text-2xl font-mono font-medium text-foreground/90 tabular-nums">
        {value}
      </p>
    </div>
  );
}
