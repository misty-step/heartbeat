# ADR-0001: Kyoto Moss Design System Architecture

**Date**: 2025-01-11
**Status**: Accepted
**Deciders**: Design, Engineering

## Context

Heartbeat needs a cohesive design system that:

1. **Enforces visual consistency** across dashboard and public status pages
2. **Makes design violations difficult** through type safety and CVA variants
3. **Supports theming** with light/dark mode
4. **Aligns with brand metaphor** - "Heartbeat" as a living, breathing system

The existing UI uses inconsistent patterns, hardcoded colors, and lacks a unified aesthetic. This leads to:

- Visual inconsistency across pages
- Easy introduction of off-brand styling
- Difficult maintenance as the application grows
- No clear guidance for future development

## Decision

Adopt the **Kyoto Moss** aesthetic with the following technical architecture:

### 1. Flat Token Structure

Keys map directly to CSS variable names (inspired by linejam):

```typescript
interface DesignTokens {
  "color-bg-primary": string;
  "color-text-primary": string;
  "color-status-up": string;
  // ... all tokens
}
```

**Rationale**: Direct mapping reduces indirection and makes tokens easy to reference in both TypeScript and CSS.

### 2. CSS-First Tokens via Tailwind v4 @theme

```css
@theme {
  --color-background: var(--color-bg-primary);
  --color-foreground: var(--color-text-primary);
  /* ... */
}
```

**Rationale**: Tailwind v4's `@theme` directive bridges CSS variables to utility classes, enabling both approaches.

### 3. defineTheme() Validation Factory

```typescript
export function defineTheme(config: ThemeConfig): ThemePreset {
  // Validates all required tokens exist
  // Throws at initialization if missing
}
```

**Rationale**: Catches missing tokens at dev time, not runtime.

### 4. CVA for Component Variants

```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
});
```

**Rationale**: Type-safe variants prevent invalid combinations and provide autocomplete.

### 5. Semantic Status Colors

Status is the core domain of Heartbeat. Three semantic status colors:

- **Up**: Moss green (healthy, growing)
- **Degraded**: Clay amber (warning, transition)
- **Down**: Brick red (incident, stillness)

**Rationale**: Domain-specific semantics make the code self-documenting.

### 6. Breathing Animation System

Status indicators use a meditative breathing animation (`animate-km-breathe`) to convey liveness:

- 4-second cycle
- Subtle scale transformation (1 → 1.15)
- Respects `prefers-reduced-motion`

**Rationale**: Reinforces the "heartbeat" brand and creates a calm, professional aesthetic.

## Consequences

### Positive

- **Single source of truth** for design values
- **Compile-time enforcement** of valid variants via TypeScript
- **Easy dark mode** support through CSS variable overrides
- **Clear aesthetic identity** that differentiates from generic SaaS
- **Maintainable** as application grows
- **Onboarding-friendly** with documented skill and audit command

### Negative

- **Initial migration effort** for existing components
- **Learning curve** for CVA pattern
- **Font loading** for Noto Serif JP (larger than system fonts)

### Neutral

- **No runtime theme switching** (beyond light/dark) needed currently
- **No multi-theme support** required yet

## Implementation

### Files Created

```
lib/design/
  tokens.ts          # Token type definitions
  schema.ts          # defineTheme factory + validation
  presets/kyoto-moss.ts  # Theme preset values
  apply.ts           # Runtime utilities
  index.ts           # Re-exports

lib/cn.ts            # clsx + tailwind-merge utility

components/ui/
  Button.tsx         # CVA-based button
  Card.tsx           # CVA-based card
  StatusIndicator.tsx # CVA-based status indicator
  index.ts           # Re-exports
```

### Files Modified

- `app/globals.css` - Full @theme rewrite with Kyoto Moss tokens
- `app/layout.tsx` - Font imports (Noto Serif JP, Manrope, IBM Plex Mono)

### Tooling Created

- `~/.claude/skills/heartbeat-design/SKILL.md` - Design system skill for Claude
- `~/.claude/commands/heartbeat/audit-design.md` - Compliance audit command

## Migration Strategy

1. **Core primitives** - Button, Card, StatusIndicator (done)
2. **Status components** - UptimeBar, ApdexScore
3. **Dashboard components** - DashboardMonitorCard, DashboardNavbar
4. **Status page components** - ZenStatusHero, StatusPageDetails
5. **Forms** - AddMonitorForm, MonitorSettingsModal

## Verification

```bash
pnpm type-check    # TypeScript compiles
pnpm lint          # No ESLint errors
pnpm build         # Production build succeeds
pnpm dev           # Visual verification
```

## References

- [linejam design system](https://github.com/...) - Token architecture inspiration
- [Class Variance Authority](https://cva.style/) - Component variant pattern
- [Tailwind CSS v4](https://tailwindcss.com/) - @theme directive
- Wabi-sabi philosophy - Aesthetic foundation
