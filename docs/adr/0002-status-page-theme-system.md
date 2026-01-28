# ADR 0002: Status Page Theme System

## Status

Accepted

## Context

Heartbeat offers public status pages for monitors. To differentiate from competitors (Statuspage.io, BetterUptime) and provide value to our Vital tier ($29/mo), we implemented a curated collection of 6 distinctive status page themes.

## Decision

### Theme Selection

- **Glass (default)**: Kyoto Moss design system - available to all users (Pulse tier)
- **Ukiyo Refined**: Woodblock editorial aesthetic
- **Memphis Pop**: Playful 80s design movement
- **Blueprint**: Technical engineering drawings
- **Swiss Precision**: International Typographic Style
- **Broadsheet**: Classic newspaper editorial
- **Mission Control**: Retro NASA telemetry terminal

Premium themes (non-Glass) require an **active** Vital subscription.

### Design Principles

1. **Each theme is self-contained**: Themes do NOT share UI components. Each implements its own status indicators, charts, and metrics displays to maintain distinct visual language.

2. **Themes prioritize aesthetic over consistency**: A newspaper theme (Broadsheet) uses newspaper conventions. A NASA theme (Mission Control) uses telemetry conventions. They intentionally look different from each other.

3. **Actual status must be reflected**: While themes have visual freedom, the actual monitor status (up/degraded/down) MUST be accurately represented. Hardcoded status indicators are not acceptable.

4. **Synthetic metrics are acceptable for ambiance**: Themes may display additional synthetic services/metrics for visual completeness, provided:
   - The primary monitor status is clearly distinguishable
   - Synthetic elements don't claim false operational status for the user's actual service

### Tier Gating

Theme access requires:

1. Subscription tier = "vital"
2. Subscription has active access (trialing, active, or canceled/past_due with `currentPeriodEnd > now`)

Both conditions must be checked - checking only tier allows expired subscriptions to retain premium features.

## Consequences

### Positive

- Unique market differentiation
- Clear value proposition for Vital tier upgrade
- Curated quality - every theme is polished

### Negative

- More code to maintain (7 theme components)
- Each theme needs independent testing
- Review bots may flag "inconsistent" patterns that are intentional design choices

## Related

- Issue #81: Extract shared theme validator
- Issue #82: Font loading optimization
