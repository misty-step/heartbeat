interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Premium glass card with frosted blur, edge highlight, and noise texture.
 * Used for elevated content panels in the status page details section.
 */
export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-background/40 backdrop-blur-xl
        ring-1 ring-white/10
        shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
        ${className}
      `}
    >
      {/* Top edge highlight - simulates light catching glass */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Noise texture overlay - tactile glass feel */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay noise-texture" />

      {/* Content */}
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}
