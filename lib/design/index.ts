/**
 * Kyoto Moss Design System
 *
 * Japanese minimalism meets wabi-sabi. Technology in harmony with nature.
 *
 * @example
 * ```tsx
 * import { cn, kyotoMossTheme, getStatusClasses } from '@/lib/design';
 *
 * // Class composition
 * <div className={cn('p-4', isActive && 'bg-elevated')} />
 *
 * // Status styling
 * const { bg, bgMuted } = getStatusClasses('up');
 * ```
 */

// Re-export cn utility for convenience
export { cn } from "../cn";

// Token types and constants
export type {
  DesignTokens,
  TokenKey,
  StatusValue,
  SpacingKey,
  RadiusKey,
} from "./tokens";
export { REQUIRED_TOKENS } from "./tokens";

// Schema and validation
export type {
  ThemePreset,
  ThemeMode,
  ThemeConfig,
  ValidationResult,
} from "./schema";
export { defineTheme, validateTheme, isThemePreset } from "./schema";

// Theme presets
export { kyotoMossTheme } from "./presets/kyoto-moss";

// Runtime application
export {
  activeTheme,
  applyTokensToRoot,
  applyThemeMode,
  getToken,
  getTokens,
  generateCSSVariables,
  generateRootCSS,
  statusColorMap,
  getStatusClasses,
} from "./apply";
