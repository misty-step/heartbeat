import { cn } from "@/lib/cn";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * GlassPanel - Kyoto Moss Design System
 *
 * Premium glass card with frosted blur, edge highlight, and washi texture.
 * Used for elevated content panels in the status page details section.
 */
export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl)]",
        "bg-[var(--color-bg-elevated)]",
        "border border-[var(--color-border-default)]",
        "shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* Top edge highlight - visible light catching glass */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}
