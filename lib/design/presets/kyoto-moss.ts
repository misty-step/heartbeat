/**
 * Kyoto Moss Theme Preset
 *
 * Japanese minimalism meets wabi-sabi. Technology in harmony with nature.
 *
 * Philosophy:
 * - Uptime is spring growth (moss green vitality)
 * - Degraded is autumn warning (clay/amber transition)
 * - Downtime is winter stillness (brick red, managed with composure)
 *
 * The interface should feel like a calm garden—incidents are natural
 * cycles to acknowledge and address, not emergencies that induce panic.
 */

import { defineTheme } from "../schema";
import type { DesignTokens } from "../tokens";

/**
 * Light mode tokens - Unbleached cotton with moss accents
 */
const lightTokens: DesignTokens = {
  // Backgrounds - Warm, natural paper tones (SOLID - no opacity)
  "color-bg-primary": "#f5f2eb", // Unbleached cotton
  "color-bg-secondary": "#ebe8e1", // Aged paper
  "color-bg-tertiary": "#e0ddd6", // Stone wash
  "color-bg-elevated": "#fdfcfa", // Slightly lighter than primary
  "color-bg-inverse": "#2d4a3e", // Deep moss (for inverse sections)

  // Text - Moss-tinted hierarchy (WCAG AA compliant)
  "color-text-primary": "#21362e", // Deep moss (11.2:1)
  "color-text-secondary": "#46544c", // Weathered moss (7.5:1)
  "color-text-tertiary": "#705d45", // Clay accent (5.8:1)
  "color-text-muted": "#766555", // Faded ink (5.1:1)
  "color-text-inverse": "#f5f2eb", // Light on dark

  // Status - The heartbeat of the system
  "color-status-up": "#2d4a3e", // Moss = healthy, alive, growing
  "color-status-up-muted": "rgba(45, 74, 62, 0.12)",
  "color-status-degraded": "#b08d57", // Amber/clay = autumn warning
  "color-status-degraded-muted": "rgba(176, 141, 87, 0.12)",
  "color-status-down": "#a94442", // Brick red = winter, needs attention
  "color-status-down-muted": "rgba(169, 68, 66, 0.12)",

  // Accents
  "color-accent-primary": "#2d4a3e", // Moss
  "color-accent-primary-hover": "#3d5a4e", // Lighter moss
  "color-accent-secondary": "#8b7355", // Clay

  // Borders - SOLID colors, no opacity
  "color-border-subtle": "#d5d2cb",
  "color-border-default": "#c0bdb6",
  "color-border-strong": "#a5a29b",

  // Typography - Refined, editorial
  "font-display": '"Noto Serif JP", "Noto Serif", Georgia, serif',
  "font-body": '"Manrope", system-ui, sans-serif',
  "font-mono": '"IBM Plex Mono", "SF Mono", Consolas, monospace',

  // Spacing - 8px base unit
  "spacing-xs": "4px",
  "spacing-sm": "8px",
  "spacing-md": "16px",
  "spacing-lg": "24px",
  "spacing-xl": "32px",
  "spacing-2xl": "48px",
  "spacing-3xl": "64px",

  // Radii - Soft but not bubbly
  "radius-sm": "4px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "radius-xl": "16px",
  "radius-full": "9999px",

  // Shadows - subtle but visible
  "shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.1)",
  "shadow-md": "0 4px 12px rgba(0, 0, 0, 0.15)",
  "shadow-lg": "0 8px 24px rgba(0, 0, 0, 0.2)",
  "shadow-glow": "0 0 20px rgba(45, 74, 62, 0.25)",

  // Motion - Calm, breathing rhythms
  "duration-instant": "0ms",
  "duration-fast": "100ms",
  "duration-normal": "200ms",
  "duration-slow": "300ms",
  "duration-breathe": "4000ms", // For status indicator pulse
  "ease-default": "cubic-bezier(0.4, 0, 0.2, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-breathe": "cubic-bezier(0.4, 0, 0.6, 1)", // Gentle in-out for breathing
};

/**
 * Dark mode tokens - Deep forest night
 */
const darkTokens: DesignTokens = {
  // Backgrounds - Deep, rich moss tones (SOLID - no opacity)
  "color-bg-primary": "#1a1f1c", // Deep forest floor
  "color-bg-secondary": "#242a26", // Shadowed moss
  "color-bg-tertiary": "#2e3630", // Stone in shadow
  "color-bg-elevated": "#2a302c", // Slightly lighter than primary
  "color-bg-inverse": "#f5f2eb", // Inverted light

  // Text - Muted, restful hierarchy
  "color-text-primary": "#e8e5de", // Moonlit paper
  "color-text-secondary": "#b5b0a5", // Weathered parchment
  "color-text-tertiary": "#8b8578", // Faded clay
  "color-text-muted": "#6b665c", // Shadow ink
  "color-text-inverse": "#1a1f1c", // Dark on light

  // Status - Adjusted for dark backgrounds
  "color-status-up": "#5a8a6f", // Lighter moss for visibility
  "color-status-up-muted": "rgba(90, 138, 111, 0.15)",
  "color-status-degraded": "#c9a86c", // Warmer amber
  "color-status-degraded-muted": "rgba(201, 168, 108, 0.15)",
  "color-status-down": "#c75a58", // Brighter brick
  "color-status-down-muted": "rgba(199, 90, 88, 0.15)",

  // Accents
  "color-accent-primary": "#5a8a6f", // Lighter moss
  "color-accent-primary-hover": "#6a9a7f", // Even lighter
  "color-accent-secondary": "#c9a86c", // Warm clay

  // Borders - SOLID colors, no opacity
  "color-border-subtle": "#3a403c",
  "color-border-default": "#4a504c",
  "color-border-strong": "#5a605c",

  // Typography (same families)
  "font-display": '"Noto Serif JP", "Noto Serif", Georgia, serif',
  "font-body": '"Manrope", system-ui, sans-serif',
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
  "radius-sm": "4px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "radius-xl": "16px",
  "radius-full": "9999px",

  // Shadows - Darker, more dramatic
  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.2)",
  "shadow-md": "0 4px 12px rgba(0, 0, 0, 0.3)",
  "shadow-lg": "0 8px 24px rgba(0, 0, 0, 0.4)",
  "shadow-glow": "0 0 20px rgba(90, 138, 111, 0.2)", // Moss glow

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

/**
 * The Kyoto Moss theme - validated and ready for use
 */
export const kyotoMossTheme = defineTheme({
  id: "kyoto-moss",
  name: "Kyoto Moss",
  description:
    "Japanese minimalism meets wabi-sabi. Technology in harmony with nature. Uptime is spring; downtime is winter.",
  tokens: {
    light: lightTokens,
    dark: darkTokens,
  },
});

export default kyotoMossTheme;
