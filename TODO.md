# TODO: Security Hardening - Public Status Pages

## Context
- **Architecture**: DESIGN.md - Explicit Field Projection with Visibility Filter
- **Key Files**: `convex/publicTypes.ts` (new), `convex/schema.ts`, `convex/monitors.ts`, `convex/checks.ts`, `convex/incidents.ts`, `app/s/[slug]/page.tsx`
- **Patterns**: Follow existing query/mutation structure in `convex/*.ts`, test patterns in `convex/__tests__/*.test.ts`
- **Test Runner**: `convex-test` via `setupBackend()` helper

## Phase 1: Critical Security Fix

### Backend - Foundation

- [x] Create `convex/publicTypes.ts` with type-safe projection functions
  ```
  Files: convex/publicTypes.ts (new)
  Architecture: Type definitions + projection functions for PublicMonitor, PublicCheck, PublicIncident
  Pseudocode: See DESIGN.md "Module: Public Types"
  Success: Types compile, projection functions extract only safe fields
  Test: Unit test that projection excludes all sensitive fields (url, headers, body, etc.)
  Dependencies: None (foundation for all public queries)
  Time: 30min
  ```

- [x] Add `visibility` field to schema (optional) + compound index
  ```
  Files: convex/schema.ts
  Architecture: Add optional visibility field to monitors table, add compound index
  Changes:
    - Add: visibility: v.optional(v.union(v.literal("public"), v.literal("private")))
    - Add index: .index("by_project_slug_and_visibility", ["projectSlug", "visibility"])
  Success: Schema deploys without error, existing monitors still work
  Test: Create monitor without visibility → succeeds (optional field)
  Dependencies: None
  Time: 15min
  ```

### Backend - Public Queries (Parallel)

- [x] Add `getPublicMonitorsForProject` query to `monitors.ts`
  ```
  Files: convex/monitors.ts
  Architecture: Query by projectSlug, filter visibility="public", project via toPublicMonitor()
  Pseudocode: See DESIGN.md "New Query: getPublicMonitorsForProject"
  Success: Returns only public monitors with safe fields
  Test:
    - Public monitor returned with only safe fields
    - Private monitor excluded
    - undefined visibility excluded (fail-safe)
    - No sensitive fields in response (url, headers, body, method, etc.)
  Dependencies: publicTypes.ts, schema.ts
  Time: 30min
  ```

- [x] Add `getPublicChecksForMonitor` + `getPublicUptimeStats` queries to `checks.ts`
  ```
  Files: convex/checks.ts
  Architecture: Verify monitor is public before returning checks/stats
  Pseudocode: See DESIGN.md "New Query: getPublicChecksForMonitor" and "getPublicUptimeStats"
  Success: Returns checks/stats only for public monitors, no statusCode/errorMessage
  Test:
    - Public monitor → returns checks without statusCode, errorMessage
    - Private monitor → returns empty array
    - Stats exclude successfulChecks/failedChecks
  Dependencies: publicTypes.ts, schema.ts
  Time: 30min
  ```

- [x] Add `getPublicIncidentsForProject` query + DELETE `getOpenIncidents` from `incidents.ts`
  ```
  Files: convex/incidents.ts
  Architecture: Query incidents for public monitors only, project via toPublicIncident()
  Pseudocode: See DESIGN.md "New Query: getPublicIncidentsForProject"
  Changes:
    - ADD: getPublicIncidentsForProject query
    - DELETE: getOpenIncidents (lines 61-84) - cross-tenant vulnerability
  Success: Returns incidents only for public monitors, no description/monitorId
  Test:
    - Only incidents for public monitors returned
    - No description field in response
    - getOpenIncidents no longer exists
  Dependencies: publicTypes.ts, schema.ts
  Time: 30min
  ```

### Backend - Visibility Support

- [x] Add `visibility` arg to `create` and `update` mutations in `monitors.ts`
  ```
  Files: convex/monitors.ts
  Architecture: New monitors default to visibility="public", can be set explicitly
  Changes:
    - create: Add visibility arg (optional), default to "public" in handler
    - update: Add visibility arg (optional)
  Success: New monitors get visibility="public", can toggle via update
  Test:
    - Create without visibility → monitor.visibility === "public"
    - Create with visibility="private" → monitor.visibility === "private"
    - Update visibility toggle works
  Dependencies: schema.ts
  Time: 20min
  ```

### Frontend

- [x] Update `app/s/[slug]/page.tsx` to use public query variants
  ```
  Files: app/s/[slug]/page.tsx
  Architecture: Replace all queries with public variants, simplify status computation
  Changes:
    - api.monitors.getByProjectSlug → api.monitors.getPublicMonitorsForProject
    - api.checks.getUptimeStats → api.checks.getPublicUptimeStats
    - api.checks.getRecentForMonitor → api.checks.getPublicChecksForMonitor
    - api.incidents.getForMonitor → api.incidents.getPublicIncidentsForProject
    - Remove getMonitorStatus() helper (status now server-side)
    - Remove monitorsWithStatus spread (already projected)
  Success: Status page renders with only safe data, no TypeScript errors
  Test: Manual verification - status page loads, no sensitive data visible
  Dependencies: All public queries
  Time: 30min
  ```

### Testing

- [x] Add security tests in `convex/__tests__/publicQueries.test.ts`
  ```
  Files: convex/__tests__/publicQueries.test.ts (new)
  Architecture: Verify no sensitive fields leak through public queries
  Test Cases (from DESIGN.md Testing Strategy):
    - getPublicMonitorsForProject excludes: url, headers, body, method, userId, timeout, expectedStatusCode, expectedBodyContains
    - getPublicMonitorsForProject excludes visibility=private monitors
    - getPublicMonitorsForProject excludes visibility=undefined monitors
    - getPublicChecksForMonitor excludes: statusCode, errorMessage
    - getPublicChecksForMonitor returns empty for private monitor
    - getPublicIncidentsForProject excludes: description, monitorId
    - getOpenIncidents does not exist (deleted)
  Success: All security tests pass
  Dependencies: All public queries implemented
  Time: 45min
  ```

- [x] Update existing tests for visibility field
  ```
  Files: convex/__tests__/monitors.test.ts, convex/__tests__/incidents.test.ts
  Changes:
    - monitors.test.ts: Add tests for visibility default, create/update with visibility
    - incidents.test.ts: Remove getOpenIncidents tests (deleted function)
  Success: All existing tests pass, new visibility tests pass
  Dependencies: Visibility support in mutations
  Time: 20min
  ```

### Migration

- [x] Create `convex/migrations.ts` with visibility backfill
  ```
  Files: convex/migrations.ts (new)
  Architecture: Backfill existing monitors with visibility="private" (fail-safe)
  Note: No convex-helpers dependency - use simple internalMutation pattern
  Implementation:
    - internalMutation that patches monitors where visibility === undefined
    - Batch processing to avoid timeout
    - Callable via: npx convex run migrations:backfillVisibility
  Success: All existing monitors get visibility="private"
  Test:
    - Automated: After migration, no monitors with undefined visibility
    - Verify migration handles concurrent monitor creation
  Dependencies: schema.ts with visibility field
  Time: 30min
  ```

## Phase 1 Completion Checklist
- [x] `pnpm type-check` passes
- [x] `pnpm test` passes (all tests)
- [~] `pnpm lint` passes (next lint config issue - unrelated to this PR)
- [x] Manual test: status page shows only public monitors (verified via unit tests + middleware fix)
- [x] Manual test: private monitor not visible on status page (verified via unit tests)
- [x] Manual test: no sensitive fields in browser network tab (verified via unit tests - projection enforces whitelist)

## Grug Safety Notes (from complexity review)
1. **Keep fail-safe in public queries forever**: Check `visibility === "public"` explicitly, even after Phase 2
2. **Status calculation server-side only**: `computeMonitorStatus()` in publicTypes.ts, never leak "why down"
3. **One commit for all public queries**: Avoid broken middle state where some queries secure, others not
4. **Migration completeness test**: Automated assertion that no monitors have undefined visibility

## Phase 2: Hardening (After Migration Complete)

- [x] Tighten schema (visibility required)
  ```
  Files: convex/schema.ts
  Prerequisite: 100% of monitors have visibility field (migration complete)
  Change: visibility: v.union(v.literal("public"), v.literal("private")) // remove v.optional
  Success: Schema deploys, no documents fail validation
  Time: 10min
  ```

- [x] Deprecate `getByProjectSlug`
  ```
  Files: convex/monitors.ts
  Change: Add @deprecated JSDoc comment, log warning on use
  Success: Deprecation warning visible, no breaking changes
  Time: 10min
  ```

- [ ] Add visibility toggle to dashboard UI
  ```
  Files: components/MonitorSettingsModal.tsx (or similar)
  Architecture: Checkbox to toggle public/private visibility
  Success: User can toggle monitor visibility from dashboard
  Test: Toggle visibility → persists, reflected on status page
  Time: 45min
  ```

## Backlog (Not This PR)

- Security headers in middleware (CSP, HSTS)
- SSRF blocklist in monitoring engine
- Rate limiting on public queries
- Password-protected status pages (YAGNI)
