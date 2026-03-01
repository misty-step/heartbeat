import { cn } from "@/lib/cn";

interface SurfacePanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SurfacePanel - Field Design System
 *
 * Matte white card panel. No frosted glass — pure surface.
 * Use for elevated content panels throughout the app.
 */
export function SurfacePanel({ children, className = "" }: SurfacePanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl",
        "bg-[var(--color-bg-elevated)]",
        "border border-[var(--color-border-subtle)]",
        "shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="relative p-6">{children}</div>
    </div>
  );
}
