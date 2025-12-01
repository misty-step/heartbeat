"use client";

/**
 * BackgroundOrbs - Atmospheric gradient orbs that create depth and visual interest
 *
 * Protocol Obsidian atmospheric foundation:
 * - 3 large gradient orbs with staggered drift animations
 * - Dual-mode support: softer in light, more intense in dark
 * - Fixed positioning behind all content
 * - 80px blur for soft atmospheric effect
 */
export function BackgroundOrbs() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {/* Orb 1 - Cyan, top-right */}
      <div
        className="gradient-orb gradient-orb-cyan"
        style={{
          width: "600px",
          height: "600px",
          top: "-200px",
          right: "-100px",
          animationDelay: "0s",
        }}
      />

      {/* Orb 2 - Purple, bottom-left */}
      <div
        className="gradient-orb gradient-orb-purple"
        style={{
          width: "500px",
          height: "500px",
          bottom: "-150px",
          left: "-150px",
          animationDelay: "7s",
        }}
      />

      {/* Orb 3 - Pink, center-right (subtle accent) */}
      <div
        className="gradient-orb gradient-orb-pink"
        style={{
          width: "400px",
          height: "400px",
          top: "50%",
          right: "10%",
          transform: "translateY(-50%)",
          animationDelay: "14s",
          opacity: 0.04, // More subtle than the others
        }}
      />
    </div>
  );
}
