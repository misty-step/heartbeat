# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Heartbeat is a "set and forget" uptime monitoring service. Users create monitors for URLs, which are checked on configurable intervals (1min to 1hr). The system tracks response times, detects outages after 3 consecutive failures, and maintains incident history.

## Development Commands

```bash
bun dev               # Run Next.js + Convex dev servers concurrently
bun dev:next          # Next.js only (with Turbopack)
bun dev:convex        # Convex backend only
bun build             # Production build
bun lint              # ESLint
bun type-check        # TypeScript check
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

## Convex Schema Migrations

Schema changes require coordination with production data. **New required fields break deployment if existing documents lack them.**

### Migration Workflow

1. **Add new fields as optional** (`v.optional(v.string())`)
2. **Enforce at application layer** — mutations always set the field for new documents
3. **Deploy** — schema validates against existing data
4. **Run backfill**: `bunx convex run migrations:<backfillFn> --prod`
5. **Verify**: `bunx convex run migrations:<checkFn> --prod`
6. **Tighten schema** — remove `v.optional()` after backfill completes

### Available Migrations (`convex/migrations.ts`)

| Field        | Backfill              | Check                           |
| ------------ | --------------------- | ------------------------------- |
| `visibility` | `backfillVisibility`  | `isMigrationComplete`           |
| `statusSlug` | `backfillStatusSlugs` | `isStatusSlugMigrationComplete` |

### CI Schema Validation

The `test.yml` workflow runs `bunx convex deploy --dry-run` if `CONVEX_DEPLOY_KEY` is set. Add this secret to GitHub to catch schema incompatibilities before Vercel deploys.

## Conventions

- Path alias `@/*` maps to project root
- Convex functions use internal variants (`internalQuery`, `internalMutation`, `internalAction`) for server-only operations
- Status pages are public (no auth), dashboard requires authentication
- Monitor intervals stored in seconds: 60, 120, 300, 600, 1800, 3600

### Convex Cleanup Jobs

When writing cleanup/batch jobs that use `.take(N)` for bounded queries, **always paginate in a loop** until no documents remain. Single-batch cleanup leaves backlog at scale.

```typescript
// ✅ Correct: loop until empty
while (true) {
  const batch = await ctx.runQuery(internal.getOldItems, { limit: 1000 });
  if (batch.length === 0) break;
  await ctx.runMutation(internal.deleteItems, { ids: batch.map((b) => b._id) });
}

// ❌ Wrong: single batch leaves backlog
const batch = await ctx.runQuery(internal.getOldItems, { limit: 1000 });
await ctx.runMutation(internal.deleteItems, { ids: batch.map((b) => b._id) });
```

### Public Page Data Fetching

Use `Promise.allSettled` (not `Promise.all`) for ISR/SSR pages with multiple data sources. This enables graceful degradation — show partial data rather than full error page.

```typescript
// ✅ Graceful degradation with error logging
const [statsResult, checksResult] = await Promise.allSettled([
  fetchStats(),
  fetchChecks(),
]);

// Log failures for debugging while still rendering partial data
if (statsResult.status === "rejected") {
  console.error("Failed to fetch stats:", statsResult.reason);
}
if (checksResult.status === "rejected") {
  console.error("Failed to fetch checks:", checksResult.reason);
}

const stats =
  statsResult.status === "fulfilled" ? statsResult.value : defaultStats;
const checks = checksResult.status === "fulfilled" ? checksResult.value : [];

// ❌ Fail-fast breaks entire page
const [stats, checks] = await Promise.all([fetchStats(), fetchChecks()]);
```
