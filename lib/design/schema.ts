/**
 * Kyoto Moss Design System - Schema & Validation
 *
 * Provides type-safe theme definition with compile-time and runtime validation.
 * Ensures all required tokens exist before a theme can be used.
 */

import { type DesignTokens, type TokenKey, REQUIRED_TOKENS } from "./tokens";

/**
 * Theme configuration for a single color mode
 */
export type ThemeMode = "light" | "dark";

/**
 * Complete theme preset with both light and dark modes
 */
export interface ThemePreset {
  /** Unique identifier for the theme */
  id: string;
  /** Human-readable theme name */
  name: string;
  /** Theme description/philosophy */
  description?: string;
  /** Token values for each color mode */
  tokens: {
    light: DesignTokens;
    dark: DesignTokens;
  };
}

/**
 * Theme configuration input for defineTheme
 */
export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  tokens: {
    light: DesignTokens;
    dark: DesignTokens;
  };
}

/**
 * Validation result from theme validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that all required tokens are present in a token set
 */
function validateTokenSet(
  tokens: Partial<DesignTokens>,
  mode: ThemeMode,
  themeId: string,
): string[] {
  const errors: string[] = [];
  const tokenKeys = Object.keys(tokens) as TokenKey[];

  for (const requiredToken of REQUIRED_TOKENS) {
    if (!tokenKeys.includes(requiredToken)) {
      errors.push(
        `Theme "${themeId}" missing token "${requiredToken}" in ${mode} mode`,
      );
    }
  }

  return errors;
}

/**
 * Validates a complete theme configuration
 */
export function validateTheme(config: ThemeConfig): ValidationResult {
  const errors: string[] = [];

  // Validate light mode tokens
  errors.push(...validateTokenSet(config.tokens.light, "light", config.id));

  // Validate dark mode tokens
  errors.push(...validateTokenSet(config.tokens.dark, "dark", config.id));

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Factory function to create a validated theme preset.
 * Throws at initialization time if required tokens are missing.
 *
 * @example
 * ```ts
 * const myTheme = defineTheme({
 *   id: 'kyoto-moss',
 *   name: 'Kyoto Moss',
 *   tokens: {
 *     light: { ... },
 *     dark: { ... }
 *   }
 * });
 * ```
 */
export function defineTheme(config: ThemeConfig): ThemePreset {
  const validation = validateTheme(config);

  if (!validation.valid) {
    const errorList = validation.errors.slice(0, 5).join("\n  - ");
    const remaining =
      validation.errors.length > 5
        ? `\n  ... and ${validation.errors.length - 5} more`
        : "";
    throw new Error(
      `Invalid theme configuration:\n  - ${errorList}${remaining}`,
    );
  }

  return {
    id: config.id,
    name: config.name,
    description: config.description,
    tokens: config.tokens,
  };
}

/**
 * Type guard to check if an object is a valid ThemePreset
 */
export function isThemePreset(value: unknown): value is ThemePreset {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.tokens === "object" &&
    obj.tokens !== null
  );
}
