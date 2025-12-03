# DESIGN.md - Security Hardening: Public Status Pages

## Architecture Overview

**Selected Approach**: Explicit Field Projection with Visibility Filter

**Rationale**: Whitelist-based projection prevents future field leakage. Visibility filter gives users control and provides defense-in-depth. Minimal code changes, maximum security impact.

**Core Modules**:
- `convex/publicTypes.ts`: Type-safe projection definitions and transformer functions
- `convex/monitors.ts`: Add `getPublicMonitorsForProject`, modify `create`/`update` for visibility
- `convex/checks.ts`: Add `getPublicChecksForMonitor`, `getPublicUptimeStats`
- `convex/incidents.ts`: Add `getPublicIncidentsForProject`, delete `getOpenIncidents`
- `convex/migrations.ts`: Backfill migration for visibility field
- `app/s/[slug]/page.tsx`: Switch to public query variants

**Data Flow**:
```
Public Status Page → getPublicMonitorsForProject (filter: visibility="public")
                   → projectSafeFields() projection
                   → PublicMonitor[] (no sensitive data)
```

**Key Design Decisions**:
1. **Whitelist over Blacklist**: New fields cannot accidentally leak
2. **Fail-safe Default**: Existing monitors → `private`, new monitors → `public`
3. **Type-safe Projections**: TypeScript enforces field selection at compile time

---

## Module: Public Types (`convex/publicTypes.ts`)

**Responsibility**: Single source of truth for what fields are safe to expose publicly. Hides projection complexity from query handlers.

**Public Interface**:
```typescript
// Safe types - ONLY these fields ever exposed publicly
export type PublicMonitor = {
  _id: Id<"monitors">;
  name: string;
  status: "up" | "degraded" | "down";
  lastCheckAt?: number;
  lastResponseTime?: number;
};

export type PublicCheck = {
  _id: Id<"checks">;
  status: "up" | "down";  // simplified - no "degraded" in checks
  responseTime: number;
  checkedAt: number;
  // EXCLUDED: statusCode, errorMessage
};

export type PublicIncident = {
  _id: Id<"incidents">;
  title: string;
  status: "investigating" | "identified" | "resolved";
  startedAt: number;
  resolvedAt?: number;
  // EXCLUDED: description, monitorId, notifiedAt
};

// Projection functions - transform full docs to public types
export function toPublicMonitor(
  monitor: Doc<"monitors">
): PublicMonitor;

export function toPublicCheck(
  check: Doc<"checks">
): PublicCheck;

export function toPublicIncident(
  incident: Doc<"incidents">
): PublicIncident;

// Helper to compute monitor status from consecutiveFailures
export function computeMonitorStatus(
  consecutiveFailures: number
): "up" | "degraded" | "down";
```

**Internal Implementation**:
```typescript
export function toPublicMonitor(monitor: Doc<"monitors">): PublicMonitor {
  return {
    _id: monitor._id,
    name: monitor.name,
    status: computeMonitorStatus(monitor.consecutiveFailures),
    lastCheckAt: monitor.lastCheckAt,
    lastResponseTime: monitor.lastResponseTime,
  };
}

export function toPublicCheck(check: Doc<"checks">): PublicCheck {
  return {
    _id: check._id,
    status: check.status === "up" ? "up" : "down",  // collapse degraded to down
    responseTime: check.responseTime,
    checkedAt: check.checkedAt,
  };
}

export function toPublicIncident(incident: Doc<"incidents">): PublicIncident {
  return {
    _id: incident._id,
    title: incident.title,
    status: incident.status,
    startedAt: incident.startedAt,
    resolvedAt: incident.resolvedAt,
  };
}

export function computeMonitorStatus(
  consecutiveFailures: number
): "up" | "degraded" | "down" {
  if (consecutiveFailures === 0) return "up";
  if (consecutiveFailures < 3) return "degraded";
  return "down";
}
```

**Dependencies**:
- Requires: Convex `Doc` type from `_generated/dataModel`
- Used by: `monitors.ts`, `checks.ts`, `incidents.ts` public queries

**Error Handling**: Pure functions - no error states. Input validation handled at query level.

---

## Module: Public Monitor Queries (`convex/monitors.ts`)

**Changes**:
1. Add `getPublicMonitorsForProject` query (replaces `getByProjectSlug` for public use)
2. Add `visibility` arg to `create` mutation (default: `"public"`)
3. Add `visibility` arg to `update` mutation

### New Query: `getPublicMonitorsForProject`

**Interface**:
```typescript
export const getPublicMonitorsForProject = query({
  args: { projectSlug: v.string() },
  returns: v.array(/* PublicMonitor validator */),
  handler: async (ctx, args) => {
    // 1. Query monitors by projectSlug where visibility = "public"
    // 2. Transform via toPublicMonitor()
    // 3. Return PublicMonitor[]
  },
});
```

**Implementation Pseudocode**:
```pseudocode
function getPublicMonitorsForProject(projectSlug):
  1. Query monitors index "by_project_slug" where projectSlug matches

  2. Filter results:
     - visibility === "public" (explicit opt-in)
     - Exclude visibility === undefined (migration in progress - fail-safe)
     - Exclude visibility === "private"

  3. Map each monitor through toPublicMonitor():
     - Extract only: _id, name, status (computed), lastCheckAt, lastResponseTime
     - Compute status from consecutiveFailures

  4. Return PublicMonitor[]
```

### Modified: `create` mutation

**Interface Change**:
```typescript
// Add to args:
visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),

// Handler: default to "public" for NEW monitors
visibility: args.visibility ?? "public",
```

### Modified: `update` mutation

**Interface Change**:
```typescript
// Add to args:
visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
```

**Note**: Existing `getByProjectSlug` preserved for backwards compatibility during migration. Mark as `@deprecated` with TODO to remove after Phase 2.

---

## Module: Public Check Queries (`convex/checks.ts`)

**Changes**:
1. Add `getPublicChecksForMonitor` query
2. Add `getPublicUptimeStats` query

### New Query: `getPublicChecksForMonitor`

**Interface**:
```typescript
export const getPublicChecksForMonitor = query({
  args: {
    monitorId: v.id("monitors"),
    limit: v.optional(v.number()),
  },
  returns: v.array(/* PublicCheck validator */),
  handler: async (ctx, args) => {
    // 1. Verify monitor exists AND visibility = "public"
    // 2. Query recent checks
    // 3. Transform via toPublicCheck()
    // 4. Return PublicCheck[]
  },
});
```

**Implementation Pseudocode**:
```pseudocode
function getPublicChecksForMonitor(monitorId, limit = 50):
  1. Fetch monitor by ID
     - If not found → return empty array (don't leak existence)
     - If visibility !== "public" → return empty array

  2. Query checks by_monitor index, order desc, take limit

  3. Map each check through toPublicCheck():
     - Extract only: _id, status (simplified), responseTime, checkedAt
     - EXCLUDE: statusCode, errorMessage

  4. Return PublicCheck[]
```

### New Query: `getPublicUptimeStats`

**Interface**:
```typescript
export const getPublicUptimeStats = query({
  args: {
    monitorId: v.id("monitors"),
    days: v.optional(v.number()),
  },
  returns: v.object({
    uptimePercentage: v.number(),
    totalChecks: v.number(),
    avgResponseTime: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Same logic as getUptimeStats but:
    // 1. Verify monitor visibility = "public"
    // 2. Return FEWER fields (no successfulChecks/failedChecks)
  },
});
```

**Implementation Pseudocode**:
```pseudocode
function getPublicUptimeStats(monitorId, days = 30):
  1. Fetch monitor by ID
     - If not found OR visibility !== "public" → return default stats

  2. Calculate startTime = now - (days * 24h * 60m * 60s * 1000ms)

  3. Query checks by_monitor index, filter checkedAt >= startTime

  4. Calculate:
     - uptimePercentage = (checks where status = "up") / total * 100
     - avgResponseTime = mean of responseTime values

  5. Return { uptimePercentage, totalChecks, avgResponseTime }
     - EXCLUDE: successfulChecks, failedChecks (reveals failure patterns)
```

---

## Module: Public Incident Queries (`convex/incidents.ts`)

**Changes**:
1. Add `getPublicIncidentsForProject` query
2. **DELETE** `getOpenIncidents` (cross-tenant vulnerability)

### New Query: `getPublicIncidentsForProject`

**Interface**:
```typescript
export const getPublicIncidentsForProject = query({
  args: {
    projectSlug: v.string(),
    limit: v.optional(v.number()),
    statusFilter: v.optional(
      v.union(v.literal("investigating"), v.literal("identified"), v.literal("resolved"))
    ),
  },
  returns: v.array(/* PublicIncident validator */),
  handler: async (ctx, args) => {
    // 1. Get public monitors for project
    // 2. Query incidents for those monitors
    // 3. Transform via toPublicIncident()
    // 4. Return PublicIncident[]
  },
});
```

**Implementation Pseudocode**:
```pseudocode
function getPublicIncidentsForProject(projectSlug, limit = 50, statusFilter?):
  1. Query monitors by_project_slug where:
     - projectSlug matches
     - visibility === "public"

  2. If no public monitors → return []

  3. For each public monitor:
     - Query incidents by_monitor index
     - Order desc by startedAt

  4. Flatten and sort all incidents by startedAt desc

  5. Apply statusFilter if provided

  6. Map through toPublicIncident():
     - Extract only: _id, title, status, startedAt, resolvedAt
     - EXCLUDE: description, monitorId, notifiedAt

  7. Take first `limit` results

  8. Return PublicIncident[]
```

### DELETE: `getOpenIncidents`

**Current Code** (incidents.ts:61-84):
```typescript
// VULNERABILITY: Returns ALL investigating incidents across ALL tenants
// No auth check, no user filtering
export const getOpenIncidents = query({...});
```

**Action**: Delete entirely. Tests reference it but test confirms cross-tenant leak.

---

## Module: Migration (`convex/migrations.ts`)

**Responsibility**: Backfill existing monitors with `visibility: "private"` (fail-safe default).

**Interface**:
```typescript
import { makeMigration } from "convex-helpers/server/migrations";

export const backfillVisibility = makeMigration(convex, {
  table: "monitors",
  migrateOne: async (ctx, doc) => {
    if (doc.visibility === undefined) {
      await ctx.db.patch(doc._id, { visibility: "private" as const });
    }
  },
});

// Run via: npx convex run migrations:backfillVisibility
```

**Why `private` default for existing**:
- Current "public by default" IS the vulnerability
- Users must explicitly opt-in to public visibility
- Fail-safe: better to show fewer monitors than leak data

**Migration Execution**:
1. Deploy schema + queries (Phase 1)
2. Run `npx convex run migrations:backfillVisibility`
3. Monitor progress via Convex dashboard
4. After 100% complete: tighten schema (Phase 2)

---

## Schema Changes (`convex/schema.ts`)

### Phase 1: Add Optional Field

```typescript
monitors: defineTable({
  // ... existing fields ...

  // NEW: Visibility control
  // Optional in Phase 1 to allow existing docs without field
  visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
})
  // ... existing indexes ...
  // NEW: Compound index for efficient public queries
  .index("by_project_slug_and_visibility", ["projectSlug", "visibility"]),
```

**Why Optional**: Convex schema validation requires all existing documents to match schema. Making it required would fail on push. Phase 2 tightens after backfill.

### Phase 2: Tighten to Required (After Migration)

```typescript
// After 100% backfill:
visibility: v.union(v.literal("public"), v.literal("private")),
```

---

## Status Page Changes (`app/s/[slug]/page.tsx`)

**Changes**: Replace all query calls with public variants.

### Before (Vulnerable):
```typescript
const monitors = await fetchQuery(api.monitors.getByProjectSlug, { projectSlug: slug });
const uptimeStats = await fetchQuery(api.checks.getUptimeStats, { monitorId });
const recentChecks = await fetchQuery(api.checks.getRecentForMonitor, { monitorId });
const incidents = await fetchQuery(api.incidents.getForMonitor, { monitorId });
```

### After (Secure):
```typescript
const monitors = await fetchQuery(api.monitors.getPublicMonitorsForProject, { projectSlug: slug });
const uptimeStats = await fetchQuery(api.checks.getPublicUptimeStats, { monitorId });
const recentChecks = await fetchQuery(api.checks.getPublicChecksForMonitor, { monitorId });
const incidents = await fetchQuery(api.incidents.getPublicIncidentsForProject, { projectSlug: slug });
```

**Additional Changes**:
- Remove `getMonitorStatus()` helper (status now computed server-side)
- Remove spread of monitor fields into `monitorsWithStatus` (already projected)
- Update TypeScript types to use `PublicMonitor`, `PublicCheck`, `PublicIncident`

---

## File Organization

```
convex/
  publicTypes.ts           # NEW: Type definitions + projection functions
  schema.ts                # MODIFY: Add visibility field + index
  monitors.ts              # MODIFY: Add getPublicMonitorsForProject, modify create/update
  checks.ts                # MODIFY: Add getPublicChecksForMonitor, getPublicUptimeStats
  incidents.ts             # MODIFY: Add getPublicIncidentsForProject, DELETE getOpenIncidents
  migrations.ts            # NEW: Backfill migration
  __tests__/
    publicQueries.test.ts  # NEW: Security tests for public queries
    monitors.test.ts       # MODIFY: Add visibility tests
    incidents.test.ts      # MODIFY: Remove getOpenIncidents tests

app/
  s/[slug]/page.tsx        # MODIFY: Use public query variants

components/
  MonitorSettingsModal.tsx # MODIFY (Phase 2): Add visibility toggle
```

---

## Error Handling Strategy

**Public Query Errors**:
| Scenario | Response | Rationale |
|----------|----------|-----------|
| Project not found | Return `[]` | Don't leak existence |
| All monitors private | Return `[]` | Fail-safe, don't leak |
| Monitor not public | Return `[]` | Don't leak existence |
| Database error | Log, return `[]` | Don't expose internals |

**Status Page Handling**:
```typescript
const monitors = await fetchQuery(api.monitors.getPublicMonitorsForProject, { projectSlug: slug });

if (!monitors || monitors.length === 0) {
  notFound();  // 404 - no public monitors
}
```

---

## Testing Strategy

### Security Tests (Critical) - `convex/__tests__/publicQueries.test.ts`

```typescript
describe('getPublicMonitorsForProject - Security', () => {
  test('excludes sensitive fields: url', async () => {
    // Create monitor with URL
    // Query public
    // Assert url NOT in response
  });

  test('excludes sensitive fields: headers', async () => {...});
  test('excludes sensitive fields: body', async () => {...});
  test('excludes sensitive fields: method', async () => {...});
  test('excludes sensitive fields: userId', async () => {...});
  test('excludes sensitive fields: timeout', async () => {...});
  test('excludes sensitive fields: expectedStatusCode', async () => {...});
  test('excludes sensitive fields: expectedBodyContains', async () => {...});

  test('excludes visibility=private monitors', async () => {
    // Create public + private monitors
    // Query public
    // Assert only public returned
  });

  test('excludes visibility=undefined monitors (migration)', async () => {
    // Direct DB insert with no visibility
    // Query public
    // Assert not returned
  });

  test('cross-tenant isolation', async () => {
    // User A creates monitor in project X
    // User B creates monitor in project X (different userId)
    // Both set visibility=public
    // Query public for project X
    // Assert ONLY sees monitors marked public, not by userId
  });
});

describe('getPublicChecksForMonitor - Security', () => {
  test('excludes statusCode', async () => {...});
  test('excludes errorMessage', async () => {...});
  test('returns empty for private monitor', async () => {...});
});

describe('getPublicIncidentsForProject - Security', () => {
  test('excludes description', async () => {...});
  test('excludes monitorId', async () => {...});
  test('only returns incidents for public monitors', async () => {...});
});

describe('getOpenIncidents - DELETED', () => {
  test('query does not exist', async () => {
    expect(api.incidents.getOpenIncidents).toBeUndefined();
  });
});
```

### Functional Tests - Extend existing test files

```typescript
// convex/__tests__/monitors.test.ts
describe('visibility field', () => {
  test('new monitors default to visibility=public', async () => {...});
  test('can set visibility=private on create', async () => {...});
  test('can toggle visibility via update', async () => {...});
  test('getPublicMonitorsForProject excludes private', async () => {...});
});

// convex/__tests__/incidents.test.ts
describe('getPublicIncidentsForProject', () => {
  test('returns incidents for public monitors only', async () => {...});
  test('respects statusFilter', async () => {...});
  test('respects limit', async () => {...});
});
```

### Regression Tests

- Authenticated `list`, `get`, `create`, `update`, `remove` unchanged
- Dashboard shows all monitors (public + private) for owner
- Uptime calculations correct
- Incident timeline displays correctly

---

## Performance Considerations

**Expected Load**: Public status pages cached via ISR (60s revalidation), minimal query pressure.

**Optimizations**:
1. **Compound Index**: `by_project_slug_and_visibility` enables efficient public query without client-side filter
2. **Projection at Query**: Only selected fields transferred over network
3. **ISR Caching**: Next.js caches rendered pages for 60s

**No Performance Regression**: New queries are additive; existing authenticated queries unchanged.

---

## Security Considerations

**Threats Mitigated**:
| Threat | Mitigation |
|--------|------------|
| Credential exposure (headers, body) | Whitelist projection excludes fields |
| Internal URL exposure | `url` field excluded from public types |
| Auth state leakage (401/403) | `statusCode` excluded from PublicCheck |
| Error message leakage | `errorMessage` excluded from PublicCheck |
| Cross-tenant incident access | Delete `getOpenIncidents`, scope to project |
| Existence oracle | Return empty array, don't throw "not found" |

**Defense in Depth**:
1. **Layer 1**: Visibility filter at database query level
2. **Layer 2**: Type-safe projection functions
3. **Layer 3**: TypeScript types enforce field selection
4. **Layer 4**: Tests verify no sensitive field leakage

---

## Alternative Architectures Considered

### Alternative A: Blacklist Sensitive Fields
```typescript
const { url, headers, body, ...safeFields } = monitor;
return safeFields;
```
- **Pros**: Less code
- **Cons**: New fields auto-leak, violates security-by-default
- **Verdict**: Rejected - whitelist is safer

### Alternative B: Separate Public Tables
```typescript
// publicMonitors table with only safe fields
// Sync on write
```
- **Pros**: Physical separation
- **Cons**: Data duplication, sync complexity, over-engineered
- **Verdict**: Rejected - projection achieves same goal simpler

### Alternative C: RLS (Row-Level Security)
```typescript
// Convex doesn't have native RLS
// Would require custom middleware
```
- **Pros**: Database-enforced
- **Cons**: Not supported, would need major architecture change
- **Verdict**: N/A - not available in Convex

### Alternative D: API Gateway / Edge Function
```typescript
// Proxy requests through edge function that strips fields
```
- **Pros**: Central control point
- **Cons**: Additional infrastructure, latency, complexity
- **Verdict**: Rejected - query-level projection is simpler

**Selected**: Projection functions with visibility filter
- Simple, auditable, type-safe
- No new infrastructure
- Defense-in-depth with multiple layers

---

## Implementation Phases

### Phase 1: Critical Security Fix (Deploy ASAP)
1. Create `convex/publicTypes.ts`
2. Add `visibility` field to schema (optional)
3. Add `getPublicMonitorsForProject` to `monitors.ts`
4. Add `getPublicChecksForMonitor`, `getPublicUptimeStats` to `checks.ts`
5. Add `getPublicIncidentsForProject` to `incidents.ts`
6. Delete `getOpenIncidents` from `incidents.ts`
7. Update `app/s/[slug]/page.tsx` to use public queries
8. Add security tests
9. Deploy to Convex
10. Run backfill migration (`visibility: "private"` for existing)

### Phase 2: Hardening (After Migration)
11. Tighten schema (`visibility` required)
12. Add `visibility` arg to `create` mutation
13. Add compound index `by_project_slug_and_visibility`
14. Add visibility toggle to dashboard UI
15. Mark `getByProjectSlug` as deprecated

### Phase 3: Future Hardening (If Needed)
16. Add security headers to middleware
17. Add SSRF blocklist to monitoring engine
18. Add rate limiting on public queries

---

## Summary

This is a surgical security fix with three parts:
1. **Projection**: Type-safe whitelist via `publicTypes.ts`
2. **Visibility**: Database-level filter + user control
3. **Cleanup**: Delete cross-tenant `getOpenIncidents`

**Complexity**: Low. Schema migration is simple, queries are additive, projection is defensive.

**Risk**: Minimal. Fail-safe defaults mean worst case is fewer public monitors (intentional).

**Next**: Run `/plan` to convert this architecture into atomic implementation tasks.
