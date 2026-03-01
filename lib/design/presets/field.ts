/**
 * Field Theme Preset
 *
 * Warm matte surfaces, sage green accent, Plus Jakarta Sans.
 *
 * Philosophy:
 * - Warm stone backgrounds (#fbfaf9), white elevated cards
 * - Sage green (#5a9680) — calm, alive, trustworthy
 * - Rounded-full pills, generous padding, extrabold headings
 * - Matte only — no frosted glass on main surfaces
 */

import { defineTheme } from "../schema";
import type { DesignTokens } from "../tokens";

const lightTokens: DesignTokens = {
  // Backgrounds - Warm stone
  "color-bg-primary": "#fbfaf9",
  "color-bg-secondary": "#f7f5f2",
  "color-bg-tertiary": "#ede8e2",
  "color-bg-elevated": "#ffffff",
  "color-bg-inverse": "#1c2320",

  // Text - Warm hierarchy (WCAG AA compliant)
  "color-text-primary": "#1c2320",
  "color-text-secondary": "#4a5550",
  "color-text-tertiary": "#6b7570",
  "color-text-muted": "#948677",
  "color-text-inverse": "#f0eeeb",

  // Status - Sage / amber / brick
  "color-status-up": "#5a9680",
  "color-status-up-muted": "rgba(90, 150, 128, 0.12)",
  "color-status-degraded": "#d9a441",
  "color-status-degraded-muted": "rgba(217, 164, 65, 0.12)",
  "color-status-down": "#b35a4d",
  "color-status-down-muted": "rgba(179, 90, 77, 0.12)",

  // Accents - Sage green
  "color-accent-primary": "#5a9680",
  "color-accent-primary-hover": "#4a8068",
  "color-accent-secondary": "#d9a441",

  // Borders - warm translucent
  "color-border-subtle": "rgba(28, 35, 32, 0.06)",
  "color-border-default": "rgba(28, 35, 32, 0.12)",
  "color-border-strong": "rgba(28, 35, 32, 0.2)",

  // Typography - Warm, editorial
  "font-display": '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  "font-body": '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  "font-mono": '"Geist Mono", "SF Mono", Consolas, monospace',

  // Spacing
  "spacing-xs": "4px",
  "spacing-sm": "8px",
  "spacing-md": "16px",
  "spacing-lg": "24px",
  "spacing-xl": "32px",
  "spacing-2xl": "48px",
  "spacing-3xl": "64px",

  // Radii - pill-friendly
  "radius-sm": "6px",
  "radius-md": "12px",
  "radius-lg": "16px",
  "radius-xl": "20px",
  "radius-full": "9999px",

  // Shadows - warm, subtle
  "shadow-sm": "0 1px 2px rgba(28, 35, 32, 0.06), 0 1px 4px rgba(28, 35, 32, 0.04)",
  "shadow-md": "0 4px 12px rgba(28, 35, 32, 0.08), 0 2px 4px rgba(28, 35, 32, 0.04)",
  "shadow-lg": "0 8px 24px rgba(28, 35, 32, 0.1), 0 4px 8px rgba(28, 35, 32, 0.06)",
  "shadow-glow": "0 0 20px rgba(90, 150, 128, 0.2)",

  // Motion
  "duration-instant": "0ms",
  "duration-fast": "100ms",
  "duration-normal": "200ms",
  "duration-slow": "300ms",
  "duration-breathe": "4000ms",
  "ease-default": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-breathe": "cubic-bezier(0.4, 0, 0.6, 1)",
};

const darkTokens: DesignTokens = {
  // Backgrounds - Deep warm forest
  "color-bg-primary": "#161c1a",
  "color-bg-secondary": "#1e2623",
  "color-bg-tertiary": "#263028",
  "color-bg-elevated": "#1a2220",
  "color-bg-inverse": "#f0eeeb",

  // Text - Warm muted hierarchy
  "color-text-primary": "#f0eeeb",
  "color-text-secondary": "#b8b0a8",
  "color-text-tertiary": "#8a8278",
  "color-text-muted": "#6b6358",
  "color-text-inverse": "#1c2320",

  // Status - lighter for dark bg
  "color-status-up": "#6aaa92",
  "color-status-up-muted": "rgba(106, 170, 146, 0.15)",
  "color-status-degraded": "#e8b86d",
  "color-status-degraded-muted": "rgba(232, 184, 109, 0.15)",
  "color-status-down": "#c97068",
  "color-status-down-muted": "rgba(201, 112, 104, 0.15)",

  // Accents
  "color-accent-primary": "#6aaa92",
  "color-accent-primary-hover": "#7abaa2",
  "color-accent-secondary": "#e8b86d",

  // Borders
  "color-border-subtle": "rgba(240, 238, 235, 0.06)",
  "color-border-default": "rgba(240, 238, 235, 0.1)",
  "color-border-strong": "rgba(240, 238, 235, 0.18)",

  // Typography (same families)
  "font-display": '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  "font-body": '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  "font-mono": '"Geist Mono", "SF Mono", Consolas, monospace',

  // Spacing
  "spacing-xs": "4px",
  "spacing-sm": "8px",
  "spacing-md": "16px",
  "spacing-lg": "24px",
  "spacing-xl": "32px",
  "spacing-2xl": "48px",
  "spacing-3xl": "64px",

  // Radii (identical)
  "radius-sm": "6px",
  "radius-md": "12px",
  "radius-lg": "16px",
  "radius-xl": "20px",
  "radius-full": "9999px",

  // Shadows - darker
  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.25)",
  "shadow-md": "0 4px 12px rgba(0, 0, 0, 0.35)",
  "shadow-lg": "0 8px 24px rgba(0, 0, 0, 0.45)",
  "shadow-glow": "0 0 20px rgba(106, 170, 146, 0.2)",

  // Motion (identical)
  "duration-instant": "0ms",
  "duration-fast": "100ms",
  "duration-normal": "200ms",
  "duration-slow": "300ms",
  "duration-breathe": "4000ms",
  "ease-default": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-breathe": "cubic-bezier(0.4, 0, 0.6, 1)",
};

export const fieldTheme = defineTheme({
  id: "field",
  name: "Field",
  description:
    "Warm matte surfaces, sage green accent, Plus Jakarta Sans. Matte only — no glass on main surfaces. Uptime is alive and growing.",
  tokens: {
    light: lightTokens,
    dark: darkTokens,
  },
});

export default fieldTheme;
