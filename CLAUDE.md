# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Heartbeat is a "set and forget" uptime monitoring service. Users create monitors for URLs, which are checked on configurable intervals (1min to 1hr). The system tracks response times, detects outages after 3 consecutive failures, and maintains incident history.

## Development Commands

```bash
pnpm dev              # Run Next.js + Convex dev servers concurrently
pnpm dev:next         # Next.js only (with Turbopack)
pnpm dev:convex       # Convex backend only
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript check
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Convex (realtime database + serverless functions)
- **Auth**: Clerk (integrated via ConvexProviderWithClerk)
- **Styling**: Tailwind v4 CSS-first config, next-themes for dark mode

### Key Data Flow

1. **Dashboard** (`app/dashboard/page.tsx`) - Authenticated users manage monitors via Convex queries/mutations
2. **Public Status Pages** (`app/s/[slug]/page.tsx`) - ISR-rendered, revalidates every 60s. Fetches via `fetchQuery` server-side
3. **Monitoring Engine** (`convex/monitoring.ts`) - Cron job runs every minute, checks due monitors in parallel

### Convex Schema (3 tables)

- `monitors` - URL endpoints to check, indexed by userId and projectSlug
- `checks` - Individual check results (up/down/degraded, response time)
- `incidents` - Outage records, auto-created after 3 consecutive failures

### Monitor State Machine

```
up (failures=0) → degraded (failures=1-2) → down (failures≥3)
```

Incident opens at failures=3, resolves when check succeeds after being down.

### File Structure

```
app/
  dashboard/        # Protected dashboard routes
  s/[slug]/         # Public status pages (SSR/ISR)
  providers.tsx     # Clerk + Convex + Theme providers
components/         # UI components (DashboardMonitorCard, StatusIndicator, etc.)
convex/
  schema.ts         # Database schema
  monitors.ts       # CRUD operations (auth-protected)
  monitoring.ts     # Check engine, incident management
  checks.ts         # Query check history/stats
  incidents.ts      # Incident queries
  crons.ts          # Heartbeat (1min) + cleanup (daily)
middleware.ts       # Clerk auth, public routes config
```

### Environment Variables

Required for development:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret (for middleware)

## Conventions

- Path alias `@/*` maps to project root
- Convex functions use internal variants (`internalQuery`, `internalMutation`, `internalAction`) for server-only operations
- Status pages are public (no auth), dashboard requires authentication
- Monitor intervals stored in seconds: 60, 120, 300, 600, 1800, 3600
