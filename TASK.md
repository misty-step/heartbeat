# Security Hardening: Fix Data Leak in Public Status Pages

## Executive Summary

**Problem**: Public status page queries expose sensitive monitor configuration (auth headers, URLs, request bodies) to anyone who knows a project slug. This is a critical security vulnerability that could expose API keys, Bearer tokens, and internal infrastructure details.

**Solution**: Implement explicit field projection for all public queries. Add visibility field with fail-safe defaults. Remove broken queries.

**User Value**: Users can confidently create public status pages knowing their sensitive monitoring configuration is protected. Private infrastructure remains private.

**Success Criteria**: Zero sensitive fields exposed via public APIs; all queries either require auth OR return only safe projected fields.

---

## User Context

**Who**: Heartbeat users who create monitors for URLs (including private APIs with auth headers) and want to share public status pages.

**Problem**: Users monitoring private APIs must include authentication headers. Currently, anyone viewing `/s/{slug}` can see those headers, request bodies, and internal URLs.

**Benefit**: After fix, users get the status page visibility they want without risking credential exposure.

---

## Requirements

### Functional Requirements

**F1**: Public status pages show ONLY safe fields:
- `_id`, `name`, `status` (computed), `lastCheckAt`, `lastResponseTime`
- Never: `url`, `method`, `headers`, `body`, `expectedStatusCode`, `expectedBodyContains`, `userId`, `timeout`

**F2**: Per-monitor visibility toggle (public/private)
- Private monitors excluded from status page queries entirely
- **NEW monitors** default to `public` (user is actively creating, informed consent)
- **EXISTING monitors** default to `private` during migration (fail-safe)

**F3**: Public check/incident queries return sanitized data
- Error messages redacted
- Status codes redacted (can reveal auth state: 401/403)
- Incident descriptions hidden

**F4**: Delete `getOpenIncidents` (cross-tenant leak, dead code)

**F5**: Authenticated dashboard retains full access to user's own data

### Non-Functional Requirements

**NF1**: No breaking changes to authenticated dashboard functionality
**NF2**: Status pages may show fewer monitors after migration (intentional, fail-safe)
**NF3**: Type-safe projections prevent accidental field leakage
**NF4**: Zero-downtime deployment via two-phase migration

---

## Architecture Decision

### Selected Approach: Explicit Field Projection with Visibility Filter

Create dedicated public query variants that:
1. Filter by `visibility: "public"` at database level
2. Project to safe fields only using typed projection functions
3. Keep existing authenticated queries unchanged

**Rationale**:
- **Simplicity**: Single projection function, easy to audit
- **Explicitness**: Whitelist safe fields (not blacklist sensitive)
- **User Value**: Visibility toggle is intuitive UX
- **Risk**: Minimal - additive schema change, projection is defensive

### Alternatives Considered

| Approach | Value | Simplicity | Risk | Why Not |
|----------|-------|------------|------|---------|
| **A: Projection only (no visibility)** | HIGH | HIGHEST | LOW | Jobs recommended this. Valid, but visibility provides defense-in-depth and user control |
| **B: Separate public tables** | HIGH | LOW | MEDIUM | Over-engineered, data duplication |
| **C: View layer abstraction** | MEDIUM | LOW | LOW | Unnecessary complexity |

### Removed from Scope (Per Jobs Review)

- ~~`publicName` field~~ - Wrong solution. If monitor name is sensitive, the name itself is the problem.
- ~~Phase 3 password protection~~ - YAGNI. Build if users request.

---

## Schema Changes

```typescript
// convex/schema.ts - monitors table additions
monitors: defineTable({
  // ... existing fields ...

  // NEW: Visibility control (MUST be optional in Phase 1 for Convex migration)
  visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
})
```

**Why optional**: Convex schema validation fails on push if existing documents lack a non-optional field. Phase 2 tightens to required after backfill.

---

## Migration Strategy (Critical - Per Data Integrity Review)

### Phase 1: Add Optional Field + Deploy New Queries

```typescript
// convex/migrations.ts
export const backfillVisibility = migration({
  table: "monitors",
  migrateOne: async (ctx, doc) => {
    if (doc.visibility === undefined) {
      // FAIL-SAFE: Default existing monitors to PRIVATE
      // Users must explicitly opt-in to public
      await ctx.db.patch(doc._id, { visibility: "private" });
    }
  },
});
```

**Rationale**: Current "public by default" IS THE BUG. Don't preserve it.

### Phase 2: Tighten Schema (After Migration Completes)

```typescript
// After 100% backfill, change to required:
visibility: v.union(v.literal("public"), v.literal("private")),
```

---

## Implementation Phases

### Phase 1: Critical Security Fix (Deploy ASAP)

1. **Add visibility field to schema** (optional)
2. **Create safe projection types**
   ```typescript
   type PublicMonitor = {
     _id: Id<"monitors">;
     name: string;
     status: "up" | "degraded" | "down";
     lastCheckAt?: number;
     lastResponseTime?: number;
   };
   
   type PublicCheck = {
     _id: Id<"checks">;
     status: "up" | "down";
     responseTime: number;
     checkedAt: number;
     // NO statusCode, NO errorMessage
   };
   
   type PublicIncident = {
     _id: Id<"incidents">;
     title: string;
     status: "investigating" | "identified" | "resolved";
     startedAt: number;
     resolvedAt?: number;
     // NO description
   };
   ```
3. **Create `getPublicMonitorsForProject`** - replaces `getByProjectSlug`
4. **Create `getPublicChecksForMonitor`** - replaces `getRecentForMonitor` for public use
5. **Create `getPublicUptimeStats`** - explicit public naming
6. **Create `getPublicIncidentsForProject`** - replaces per-monitor incident fetch
7. **Update status page** to use new queries
8. **Run backfill migration** (visibility = "private" default)
9. **DELETE `getOpenIncidents`** (cross-tenant leak)

### Phase 2: Hardening (Post-Migration)

10. **Tighten schema** (visibility required)
11. **Update `create` mutation** to require visibility arg
12. **Add cascade deletes** to `monitors.remove` (clean up orphaned checks/incidents)
13. **Add visibility toggle** to dashboard UI (simple checkbox)
14. **Add compound index** on `(projectSlug, visibility)` if performance needed

### Phase 3: Additional Security (Short-term)

15. **Add security headers** (CSP, HSTS, X-Frame-Options) to middleware
16. **Add SSRF blocklist** to monitoring engine (block internal IPs, metadata endpoints)
17. **Add rate limiting** on public queries

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema validation fails on push | HIGH (if non-optional) | CRITICAL | Make visibility optional in Phase 1 |
| Status pages show empty after fix | MEDIUM | HIGH (intentional) | This is fail-safe behavior. Provide UI to enable public. |
| Missed a sensitive field in projection | LOW | CRITICAL | Type-safe projection, code review |
| Migration incomplete before Phase 2 | LOW | MEDIUM | Monitor migration progress, don't deploy Phase 2 early |

---

## Key Decisions

### D1: Whitelist vs Blacklist
**Decision**: Whitelist safe fields explicitly
**Rationale**: New fields can't accidentally leak

### D2: Default for EXISTING monitors
**Decision**: `"private"` (fail-safe)
**Rationale**: Current "public" behavior is the vulnerability. Don't preserve bugs.

### D3: Default for NEW monitors  
**Decision**: `"public"` (user is actively creating)
**Rationale**: User creating monitor = informed consent. Friction-free for legitimate use.

### D4: What to do with `getOpenIncidents`
**Decision**: DELETE entirely
**Rationale**: Cross-tenant leak, dead code (only in tests), YAGNI

### D5: Error message + statusCode handling
**Decision**: Redact both entirely
**Rationale**: Status codes leak auth state (401/403/404). Error messages unpredictable.

### D6: Remove `publicName` field
**Decision**: Cut from scope (per Jobs review)
**Rationale**: If monitor name is sensitive, fix the name. Don't add complexity for bad hygiene.

---

## Test Scenarios

### Security Tests (Critical)

- [ ] `getPublicMonitorsForProject` returns NO sensitive fields (url, headers, body, method, userId, timeout, expectedStatusCode, expectedBodyContains)
- [ ] `getPublicMonitorsForProject` excludes `visibility: "private"` monitors
- [ ] `getPublicMonitorsForProject` excludes monitors with `visibility: undefined` (during migration)
- [ ] `getPublicChecksForMonitor` returns NO errorMessage, NO statusCode
- [ ] `getPublicIncidentsForProject` returns NO description
- [ ] `getOpenIncidents` query does not exist (deleted)
- [ ] Cross-tenant: User A cannot see User B's monitors via any public query

### Functional Tests

- [ ] Public status page renders correctly with new queries
- [ ] Public status page shows only `visibility: "public"` monitors
- [ ] Dashboard shows all user's monitors (public + private)
- [ ] Dashboard can toggle monitor visibility
- [ ] New monitors default to `visibility: "public"`
- [ ] Migration sets existing monitors to `visibility: "private"`

### Regression Tests

- [ ] Authenticated queries (`list`, `get`, `create`, `update`, `remove`) unchanged
- [ ] Uptime calculations correct with new query
- [ ] Incident timeline displays correctly

### Edge Cases

- [ ] Project slug with zero public monitors returns 404
- [ ] Project slug with all private monitors returns 404
- [ ] Monitor with `visibility: undefined` excluded from public queries
- [ ] Monitor deletion cascades to checks and incidents

---

## Files to Modify

```
convex/
  schema.ts              # Add optional visibility field
  monitors.ts            # Add getPublicMonitorsForProject, update create mutation
  checks.ts              # Add getPublicChecksForMonitor, getPublicUptimeStats  
  incidents.ts           # Add getPublicIncidentsForProject, DELETE getOpenIncidents
  migrations.ts          # NEW: Backfill migration

app/
  s/[slug]/page.tsx      # Use new public query variants

components/
  MonitorSettingsModal.tsx  # Add visibility toggle (Phase 2)
```

---

## Summary

This is a surgical security fix with three parts:
1. **Projection**: Whitelist safe fields in typed projection functions
2. **Visibility**: Filter by `visibility: "public"` at database level  
3. **Cleanup**: Delete broken `getOpenIncidents`, add cascade deletes

**Simplified from original spec** (per Jobs review):
- Removed `publicName` field
- Removed Phase 3 password protection
- Changed migration default to `private` (fail-safe)

**Added hardening** (per Security review):
- Redact statusCode (not just errorMessage)
- Add cascade deletes
- Add security headers
- Add SSRF protection

**Fixed migration** (per Data Integrity review):
- Make visibility optional in Phase 1
- Two-phase deployment
- Monitor migration completion before Phase 2

**Complexity**: Low. Schema migration is simple, query changes are additive, projection is defensive.
