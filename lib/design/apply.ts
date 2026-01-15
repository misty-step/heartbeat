/**
 * Kyoto Moss Design System - Theme Application
 *
 * Runtime utilities for applying theme tokens to the DOM.
 * Works with next-themes for dark mode switching.
 */

import type { ThemePreset, ThemeMode } from "./schema";
import type { DesignTokens, TokenKey } from "./tokens";
import { kyotoMossTheme } from "./presets/kyoto-moss";

/**
 * The active theme preset (currently only Kyoto Moss)
 * Future: Could support multiple themes via registry
 */
export const activeTheme: ThemePreset = kyotoMossTheme;

/**
 * Applies a complete token set to the document root
 */
export function applyTokensToRoot(tokens: DesignTokens): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${key}`, value);
  }
}

/**
 * Applies theme tokens for the specified color mode
 */
export function applyThemeMode(mode: ThemeMode): void {
  const tokens = activeTheme.tokens[mode];
  applyTokensToRoot(tokens);
}

/**
 * Gets a single token value for the current mode
 */
export function getToken(key: TokenKey, mode: ThemeMode = "light"): string {
  return activeTheme.tokens[mode][key];
}

/**
 * Gets all tokens for a specific mode
 */
export function getTokens(mode: ThemeMode = "light"): DesignTokens {
  return activeTheme.tokens[mode];
}

/**
 * Generates CSS custom properties string for SSR/static rendering
 * Useful for injecting into <style> tags or CSS-in-JS
 */
export function generateCSSVariables(mode: ThemeMode): string {
  const tokens = activeTheme.tokens[mode];
  return Object.entries(tokens)
    .map(([key, value]) => `--${key}: ${value};`)
    .join("\n  ");
}

/**
 * Generates complete :root CSS block
 */
export function generateRootCSS(): string {
  const lightVars = generateCSSVariables("light");
  const darkVars = generateCSSVariables("dark");

  return `
:root {
  ${lightVars}
}

.dark {
  ${darkVars}
}
`.trim();
}

/**
 * Status color mapping for type-safe status styling
 */
export const statusColorMap = {
  up: {
    bg: "var(--color-status-up)",
    bgMuted: "var(--color-status-up-muted)",
  },
  degraded: {
    bg: "var(--color-status-degraded)",
    bgMuted: "var(--color-status-degraded-muted)",
  },
  down: {
    bg: "var(--color-status-down)",
    bgMuted: "var(--color-status-down-muted)",
  },
  unknown: {
    bg: "var(--color-text-muted)",
    bgMuted: "var(--color-border-subtle)",
  },
} as const;

/**
 * Type-safe status class getter
 */
export function getStatusClasses(status: keyof typeof statusColorMap): {
  bg: string;
  bgMuted: string;
} {
  return statusColorMap[status];
}
