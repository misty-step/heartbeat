"use client";

/**
 * BackgroundAtmosphere - Technical control center aesthetic
 *
 * REPLACES BackgroundOrbs (purple/pink AI slop)
 *
 * Features:
 * 1. Dot matrix grid pattern (SVG) - 0.06 opacity
 * 2. Noise texture overlay - 0.02 opacity
 * 3. Single cyan radial gradient (subtle, large radius)
 *
 * NO purple, NO pink - pure technical aesthetic
 */
export function BackgroundAtmosphere() {
  return (
    <>
      {/* SVG Definitions for patterns and filters */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ zIndex: -1 }}
      >
        <defs>
          {/* Dot Matrix Pattern */}
          <pattern
            id="dot-matrix"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="12"
              cy="12"
              r="0.8"
              className="fill-text-primary"
              opacity="0.06"
            />
          </pattern>

          {/* Noise Texture Filter */}
          <filter id="noise-texture">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend mode="overlay" in="SourceGraphic" />
          </filter>
        </defs>

        {/* Apply dot matrix pattern */}
        <rect width="100%" height="100%" fill="url(#dot-matrix)" />

        {/* Apply noise texture */}
        <rect
          width="100%"
          height="100%"
          filter="url(#noise-texture)"
          opacity="0.02"
          className="mix-blend-overlay"
        />
      </svg>

      {/* Single cyan radial gradient (replaces orbs) */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-10%",
          right: "-10%",
          width: "1400px",
          height: "1400px",
          background:
            "radial-gradient(circle, var(--color-accent-glow) 0%, transparent 60%)",
          opacity: 0.05,
          zIndex: -1,
        }}
      />
    </>
  );
}
