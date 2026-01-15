/**
 * Kyoto Moss Design System - Token Types
 *
 * Flat token structure where keys map directly to CSS variable names.
 * This enables type-safe token usage and compile-time validation.
 */

/**
 * All available design tokens.
 * Keys become CSS variables: `color-bg-primary` → `--color-bg-primary`
 */
export interface DesignTokens {
  // === BACKGROUNDS ===
  "color-bg-primary": string;
  "color-bg-secondary": string;
  "color-bg-tertiary": string;
  "color-bg-elevated": string;
  "color-bg-inverse": string;

  // === TEXT HIERARCHY ===
  "color-text-primary": string;
  "color-text-secondary": string;
  "color-text-tertiary": string;
  "color-text-muted": string;
  "color-text-inverse": string;

  // === STATUS (Heartbeat core semantic colors) ===
  "color-status-up": string;
  "color-status-up-muted": string;
  "color-status-degraded": string;
  "color-status-degraded-muted": string;
  "color-status-down": string;
  "color-status-down-muted": string;

  // === ACCENTS ===
  "color-accent-primary": string;
  "color-accent-primary-hover": string;
  "color-accent-secondary": string;

  // === BORDERS ===
  "color-border-subtle": string;
  "color-border-default": string;
  "color-border-strong": string;

  // === TYPOGRAPHY ===
  "font-display": string;
  "font-body": string;
  "font-mono": string;

  // === SPACING (8px base unit) ===
  "spacing-xs": string; // 4px
  "spacing-sm": string; // 8px
  "spacing-md": string; // 16px
  "spacing-lg": string; // 24px
  "spacing-xl": string; // 32px
  "spacing-2xl": string; // 48px
  "spacing-3xl": string; // 64px

  // === RADII ===
  "radius-sm": string;
  "radius-md": string;
  "radius-lg": string;
  "radius-xl": string;
  "radius-full": string;

  // === SHADOWS ===
  "shadow-sm": string;
  "shadow-md": string;
  "shadow-lg": string;
  "shadow-glow": string;

  // === MOTION ===
  "duration-instant": string;
  "duration-fast": string;
  "duration-normal": string;
  "duration-slow": string;
  "duration-breathe": string;
  "ease-default": string;
  "ease-out": string;
  "ease-breathe": string;
}

/**
 * Token keys as a union type for type-safe access
 */
export type TokenKey = keyof DesignTokens;

/**
 * Status values used throughout Heartbeat
 */
export type StatusValue = "up" | "degraded" | "down" | "unknown";

/**
 * Spacing scale keys
 */
export type SpacingKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Radius scale keys
 */
export type RadiusKey = "sm" | "md" | "lg" | "xl" | "full";

/**
 * All required token keys - used for validation
 */
export const REQUIRED_TOKENS: readonly TokenKey[] = [
  // Backgrounds
  "color-bg-primary",
  "color-bg-secondary",
  "color-bg-tertiary",
  "color-bg-elevated",
  "color-bg-inverse",
  // Text
  "color-text-primary",
  "color-text-secondary",
  "color-text-tertiary",
  "color-text-muted",
  "color-text-inverse",
  // Status
  "color-status-up",
  "color-status-up-muted",
  "color-status-degraded",
  "color-status-degraded-muted",
  "color-status-down",
  "color-status-down-muted",
  // Accents
  "color-accent-primary",
  "color-accent-primary-hover",
  "color-accent-secondary",
  // Borders
  "color-border-subtle",
  "color-border-default",
  "color-border-strong",
  // Typography
  "font-display",
  "font-body",
  "font-mono",
  // Spacing
  "spacing-xs",
  "spacing-sm",
  "spacing-md",
  "spacing-lg",
  "spacing-xl",
  "spacing-2xl",
  "spacing-3xl",
  // Radii
  "radius-sm",
  "radius-md",
  "radius-lg",
  "radius-xl",
  "radius-full",
  // Shadows
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "shadow-glow",
  // Motion
  "duration-instant",
  "duration-fast",
  "duration-normal",
  "duration-slow",
  "duration-breathe",
  "ease-default",
  "ease-out",
  "ease-breathe",
] as const;
