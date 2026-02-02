/**
 * Hearthstone Theme Preset
 *
 * Warm workshop aesthetic. Fireplace, amber glow, evening comfort.
 *
 * Philosophy:
 * - Uptime is ember glow (amber warmth, life)
 * - Degraded is deeper orange (cooling, attention needed)
 * - Downtime is cooled ash (stillness, requires action)
 *
 * Typography: Lora (serif display) + Nunito (rounded sans body)
 * Feel: Cozy hearth, fireplace glow, evening warmth, comfort
 */

import { defineTheme } from "../schema";
import type { DesignTokens } from "../tokens";

/**
 * Light mode tokens - Daylight by the Fire
 */
const lightTokens: DesignTokens = {
  // Backgrounds - Warm parchment tones (SOLID)
  "color-bg-primary": "#f5efe5", // Warm parchment
  "color-bg-secondary": "#f0e8dc", // Aged cream
  "color-bg-tertiary": "#e8dcc8", // Soft tan
  "color-bg-elevated": "#faf6f0", // Bright parchment
  "color-bg-inverse": "#2a2018", // Deep brown

  // Text - Rich brown hierarchy (WCAG AA compliant)
  "color-text-primary": "#2a2018", // Deep brown
  "color-text-secondary": "#5c4a3a", // Warm brown
  "color-text-tertiary": "#8b7359", // Clay
  "color-text-muted": "#a69078", // Faded brown
  "color-text-inverse": "#faf6f0", // Light on dark

  // Status - Ember glow system
  "color-status-up": "#d4891a", // Amber glow
  "color-status-up-muted": "rgba(212, 137, 26, 0.12)",
  "color-status-degraded": "#c1762e", // Deeper orange
  "color-status-degraded-muted": "rgba(193, 118, 46, 0.12)",
  "color-status-down": "#8b7359", // Cooled ash
  "color-status-down-muted": "rgba(139, 115, 89, 0.12)",

  // Accents - Burnt sienna
  "color-accent-primary": "#a0522d", // Burnt sienna
  "color-accent-primary-hover": "#8b4513", // Saddle brown
  "color-accent-secondary": "#d4891a", // Amber

  // Borders - Warm tones (SOLID)
  "color-border-subtle": "#e5d9c9",
  "color-border-default": "#d4c4b0",
  "color-border-strong": "#c4b09a",

  // Typography - Cozy warmth
  "font-display": '"Lora", Georgia, "Times New Roman", serif',
  "font-body": '"Nunito", system-ui, -apple-system, sans-serif',
  "font-mono": '"IBM Plex Mono", "SF Mono", Consolas, monospace',

  // Spacing (4px base)
  "spacing-xs": "4px",
  "spacing-sm": "8px",
  "spacing-md": "16px",
  "spacing-lg": "24px",
  "spacing-xl": "32px",
  "spacing-2xl": "48px",
  "spacing-3xl": "64px",

  // Radii - Softer, cozier
  "radius-sm": "6px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "radius-xl": "16px",
  "radius-full": "9999px",

  // Shadows - Sienna-tinted warmth
  "shadow-sm": "0 1px 2px rgba(160, 82, 45, 0.05)",
  "shadow-md":
    "0 4px 6px -1px rgba(160, 82, 45, 0.08), 0 2px 4px -2px rgba(160, 82, 45, 0.05)",
  "shadow-lg":
    "0 10px 15px -3px rgba(160, 82, 45, 0.1), 0 4px 6px -4px rgba(160, 82, 45, 0.05)",
  "shadow-glow": "0 0 20px rgba(255, 149, 0, 0.3)",

  // Motion - Gentle ember rhythm
  "duration-instant": "0ms",
  "duration-fast": "100ms",
  "duration-normal": "200ms",
  "duration-slow": "300ms",
  "duration-breathe": "3000ms", // Faster flicker for ember
  "ease-default": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-breathe": "cubic-bezier(0.4, 0, 0.6, 1)",
};

/**
 * Dark mode tokens - Evening by the Fire
 */
const darkTokens: DesignTokens = {
  // Backgrounds - Deep brown (SOLID)
  "color-bg-primary": "#1f1815", // Deep brown
  "color-bg-secondary": "#2a2018", // Shadowed brown
  "color-bg-tertiary": "#362a20", // Warm charcoal
  "color-bg-elevated": "#3d3025", // Elevated surface
  "color-bg-inverse": "#faf6f0", // Inverted light

  // Text - Warm light hierarchy
  "color-text-primary": "#faf6f0", // Warm white
  "color-text-secondary": "#e5d9c9", // Cream
  "color-text-tertiary": "#c4b09a", // Muted tan
  "color-text-muted": "#a69078", // Faded
  "color-text-inverse": "#2a2018", // Dark on light

  // Status - Brighter ember for dark backgrounds
  "color-status-up": "#ffb366", // Bright amber
  "color-status-up-muted": "rgba(255, 179, 102, 0.15)",
  "color-status-degraded": "#ffcc8a", // Light orange
  "color-status-degraded-muted": "rgba(255, 204, 138, 0.15)",
  "color-status-down": "#a69078", // Muted ash
  "color-status-down-muted": "rgba(166, 144, 120, 0.15)",

  // Accents - Ember glow
  "color-accent-primary": "#ff9500", // Ember
  "color-accent-primary-hover": "#ffb366", // Brighter ember
  "color-accent-secondary": "#ffcc8a", // Light amber

  // Borders - Warm tones (SOLID)
  "color-border-subtle": "#4a3a2d",
  "color-border-default": "#5c4a3a",
  "color-border-strong": "#6b5645",

  // Typography (same families)
  "font-display": '"Lora", Georgia, "Times New Roman", serif',
  "font-body": '"Nunito", system-ui, -apple-system, sans-serif',
  "font-mono": '"IBM Plex Mono", "SF Mono", Consolas, monospace',

  // Spacing (identical to light)
  "spacing-xs": "4px",
  "spacing-sm": "8px",
  "spacing-md": "16px",
  "spacing-lg": "24px",
  "spacing-xl": "32px",
  "spacing-2xl": "48px",
  "spacing-3xl": "64px",

  // Radii (identical)
  "radius-sm": "6px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "radius-xl": "16px",
  "radius-full": "9999px",

  // Shadows - Warm glow in dark
  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.3)",
  "shadow-md":
    "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
  "shadow-lg":
    "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
  "shadow-glow": "0 0 30px rgba(255, 149, 0, 0.3)",

  // Motion (identical)
  "duration-instant": "0ms",
  "duration-fast": "100ms",
  "duration-normal": "200ms",
  "duration-slow": "300ms",
  "duration-breathe": "3000ms",
  "ease-default": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-breathe": "cubic-bezier(0.4, 0, 0.6, 1)",
};

/**
 * The Hearthstone theme - validated and ready for use
 */
export const hearthstoneTheme = defineTheme({
  id: "hearthstone",
  name: "Hearthstone",
  description:
    "Warm workshop aesthetic. Fireplace glow, amber embers, evening comfort. Uptime is warmth; downtime is cooled ash.",
  tokens: {
    light: lightTokens,
    dark: darkTokens,
  },
});

export default hearthstoneTheme;
