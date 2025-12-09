# TODO: Individual Monitor Status Pages

## Status: ✅ Implementation Complete

Feature branch `feature/individual-status-pages` ready for review with 12 commits.

---

## Completed Tasks

### Phase 1: Foundation ✅

- [x] Add design tokens to globals.css
  - Added `--color-surface`, `--color-border`, `--color-accent`
  - Added `.text-display` and `.text-mono` utility classes
  - Dark mode overrides included

- [x] Add statusSlug field to schema with index
  - Field: `statusSlug: v.optional(v.string())`
  - Index: `.index("by_status_slug", ["statusSlug"])`

- [x] Create slug generator in convex/slugs.ts
  - Word lists: ~50 adjectives, nouns, verbs (~125K combinations)
  - `generateStatusSlug()` — pure function
  - `generateUniqueStatusSlug(ctx)` — DB uniqueness check
  - `isValidStatusSlugFormat()` — validation
  - 11 tests passing

- [x] Add backfillStatusSlugs migration
  - `getMonitorsNeedingStatusSlug` — query for progress
  - `backfillStatusSlugs` — batch migration mutation
  - `isStatusSlugMigrationComplete` — verification

### Phase 2: Backend ✅

- [x] Update monitors.create to auto-generate statusSlug
  - Calls `generateUniqueStatusSlug(ctx)` on create
  - Returns full document (not just ID)
  - 2 new tests for slug generation

- [x] Add getPublicMonitorByStatusSlug query
  - Uses `by_status_slug` index
  - Returns null for invalid/private slugs
  - 3 tests passing

- [x] Add getPublicIncidentsForMonitor query
  - Fetches incidents by monitorId
  - Respects monitor visibility
  - 2 tests passing

### Phase 3: Frontend Components ✅

- [x] Create StatusPageHero component
  - Giant serif headline with status message
  - 2xl StatusIndicator with cinematic glow
  - Uptime percentage and last check time
  - Added `2xl` size to StatusIndicator

- [x] Create status page route
  - Route: `app/status/[statusSlug]/page.tsx`
  - ISR with 60s revalidation
  - Uses StatusPageHero, UptimeChart, IncidentTimeline
  - 404 for invalid/private slugs

### Phase 4: Dashboard Integration ✅

- [x] Add status page link to DashboardMonitorCard
  - ExternalLink icon on hover
  - Opens `/status/{statusSlug}` in new tab
  - Only shown for monitors with statusSlug

- [x] Update AddMonitorForm to show status page URL
  - Success state shows shareable URL
  - Copy to clipboard button
  - External link to open page
  - Done button to reset form

### Phase 5: Cleanup ✅

- [x] Delete project-level status pages
  - Removed `app/s/[slug]/page.tsx`
  - Old URLs will 404

---

## Post-Deployment Tasks

- [ ] Run statusSlug migration on production

  ```bash
  npx convex run migrations:backfillStatusSlugs
  ```

- [ ] Verify migration complete

  ```bash
  npx convex run migrations:isStatusSlugMigrationComplete
  ```

- [ ] (Optional) Make statusSlug required in schema
  - Change `v.optional(v.string())` to `v.string()`
  - Only after migration verified complete

---

## Verification Checklist

- [x] Types pass: `pnpm type-check` succeeds
- [x] Feature tests pass: 46 tests for new functionality
- [ ] E2E flow: Create monitor → see URL → visit page → see status
- [ ] Dashboard link: Card hover → click link → status page opens
- [ ] 404 handling: Invalid slug → 404 page
- [ ] Privacy: Private monitor slug → 404 page

---

## Commits (12)

```
5f863c5 refactor: remove project-level status pages
5003d7a feat(form): show status page url after monitor creation
1f8eaa4 feat(dashboard): add status page link to monitor card
f2e2914 feat(status): add individual monitor status page route
89b038c feat(components): add statuspagehero with editorial design
fbaa8ac feat(incidents): add getpublicincidentsformonitor query
9c5313a feat(monitors): add getpublicmonitorbystatusslug query
b639e34 feat(monitors): auto-generate statusslug on create
28399b9 feat: add statusslug migration
d21836f feat: add status slug generator
4db2bcd feat(schema): add statusslug field with index
391bd19 feat: add design tokens for status pages
```

---

## Files Changed

**New files**:

- `convex/slugs.ts` — Slug generation utilities
- `convex/__tests__/slugs.test.ts` — Slug tests (11 tests)
- `components/StatusPageHero.tsx` — Giant editorial status display
- `app/status/[statusSlug]/page.tsx` — Individual monitor status page

**Modified files**:

- `app/globals.css` — Design tokens
- `convex/schema.ts` — statusSlug field + index
- `convex/monitors.ts` — create mutation, getPublicMonitorByStatusSlug query
- `convex/incidents.ts` — getPublicIncidentsForMonitor query
- `convex/migrations.ts` — backfillStatusSlugs migration
- `convex/__tests__/monitors.test.ts` — statusSlug tests + helper fixes
- `convex/__tests__/publicQueries.test.ts` — New query tests
- `convex/__tests__/checks.test.ts` — Helper fix for new return type
- `convex/__tests__/monitoring.test.ts` — Helper fix for new return type
- `convex/__tests__/incidents.test.ts` — Helper fix for new return type
- `components/StatusIndicator.tsx` — Added 2xl size
- `components/DashboardMonitorCard.tsx` — Status page link
- `components/AddMonitorForm.tsx` — Success state with URL

**Deleted files**:

- `app/s/[slug]/page.tsx` — Replaced by /status/[statusSlug]
