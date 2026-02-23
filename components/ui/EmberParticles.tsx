"use client";

/**
 * EmberParticles - Hearthstone Design System
 *
 * Floating ember particle effect for hero sections.
 * Creates warmth and visual interest with rising ember dots.
 *
 * Features:
 * - Multiple floating ember particles with staggered delays
 * - Light/dark mode opacity adjustments
 * - Respects prefers-reduced-motion
 */

import { cn } from "@/lib/cn";

interface EmberParticleProps {
  /** Horizontal position (0-100%) */
  x: number;
  /** Vertical starting position (0-100%) */
  y: number;
  /** Animation delay in seconds */
  delay: number;
  /** Size variant */
  size: "sm" | "md" | "lg";
  /** Opacity multiplier (0-1) */
  opacity?: number;
}

function EmberParticle({ x, y, delay, size, opacity = 1 }: EmberParticleProps) {
  const sizeClasses = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  };

  return (
    <div
      className={cn(
        "absolute rounded-full bg-[var(--color-ember)] animate-hs-float-up",
        "motion-reduce:hidden",
        sizeClasses[size],
      )}
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        animationDelay: `${delay}s`,
        opacity: opacity * 0.8,
        boxShadow: "0 0 6px var(--color-ember-glow)",
      }}
      aria-hidden="true"
    />
  );
}

interface EmberParticlesProps {
  /** Additional CSS classes */
  className?: string;
  /** Number of particles to render (default: 12) */
  count?: number;
  /** Opacity multiplier for all particles (default: 1) */
  intensity?: number;
}

/**
 * EmberParticles - Add floating ember effects to any container
 *
 * Usage:
 * ```tsx
 * <div className="relative overflow-hidden">
 *   <EmberParticles />
 *   {children}
 * </div>
 * ```
 */
export function EmberParticles({
  className,
  count = 12,
  intensity = 1,
}: EmberParticlesProps) {
  // Generate deterministic particle positions based on index
  // Using golden ratio for nice distribution
  const particles: EmberParticleProps[] = Array.from(
    { length: count },
    (_, i) => {
      const goldenRatio = 1.618033988749895;
      const x = (i * goldenRatio * 100) % 100;
      const y = (i * 5) % 30; // Start near bottom
      const delay = (i * 0.7) % 4; // Stagger delays
      const sizes: Array<"sm" | "md" | "lg"> = [
        "sm",
        "md",
        "sm",
        "lg",
        "sm",
        "md",
      ];
      const size = sizes[i % sizes.length];
      const opacity = 0.6 + (i % 4) * 0.1; // Vary opacity

      return { x, y, delay, size, opacity: opacity * intensity };
    },
  );

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
      aria-hidden="true"
    >
      {particles.map((particle, i) => (
        <EmberParticle key={i} {...particle} />
      ))}
    </div>
  );
}

/**
 * EmberGlow - Subtle ambient glow effect (non-animated)
 *
 * Use this for a static warm glow without particles.
 */
export function EmberGlow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none",
        "opacity-50 dark:opacity-30",
        className,
      )}
      style={{
        background:
          "radial-gradient(ellipse at 50% 100%, var(--color-ember-subtle) 0%, transparent 60%)",
      }}
      aria-hidden="true"
    />
  );
}

export default EmberParticles;
