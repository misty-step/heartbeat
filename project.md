# Project: Heartbeat

## Vision

Set-and-forget uptime monitoring with beautiful public status pages for indie hackers who can't afford enterprise tools.

**North Star:** Profitable indie SaaS — simple to start, expandable into automated triage and GenTech UX (Sentry-adjacent). Portfolio-grade codebase and design.
**Target User:** Solo developers and indie hackers who need reliable uptime monitoring + client-facing status pages
**Current Focus:** Launch readiness — polished enough to share publicly with confidence
**Key Differentiators:**

- Beautiful, themeable status pages (the product face _is_ the status page)
- Simple and focused — no enterprise bloat, no annual contracts, no sales calls

## Domain Glossary

| Term              | Definition                                                                              |
| ----------------- | --------------------------------------------------------------------------------------- |
| Monitor           | A URL endpoint checked on a configurable interval (60s–3600s)                           |
| Check             | One HTTP request to a monitored URL — records status (up/down/degraded) + response time |
| Incident          | An outage record opened after 3 consecutive failures; resolved when a check succeeds    |
| Status Page       | Public-facing page (at `/s/[slug]`) showing monitor history for a project               |
| Project           | Logical grouping of monitors under a shared slug/status page                            |
| Degraded          | Status when 1–2 consecutive failures detected (not yet an incident)                     |
| Failure threshold | 3 consecutive failures → incident opens                                                 |
| Interval          | Check frequency in seconds: 60, 120, 300, 600, 1800, 3600                               |

## Active Focus

- **Milestone:** Launch Readiness
- **Key Issues:** #33 (SSRF IPv6 bypass), #25 (check engine tests), #26 (state machine tests), #38 (incidents N+1), #22 (pause/resume), #23 (interval selection)
- **Theme:** Reliability + completeness before acquisition. The engine must be trustworthy and alerts must exist before sharing the product publicly.

## Quality Bar

What "done" means beyond "tests pass":

- [ ] Monitoring engine has test coverage on state machine transitions and check logic
- [ ] Known security holes (SSRF IPv6, rate limiting) are closed
- [ ] Public status pages look polished across all themes (at least 1 premium theme)
- [ ] Email/notification alerts exist — monitoring without alerting is incomplete
- [ ] Billing infrastructure exists — can't be called a SaaS without it
- [ ] No P0/P1 issues open

## Patterns to Follow

### Convex Internal vs Public Functions

```typescript
// Public (user-facing) — always auth-checked
export const createMonitor = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");
  }
});

// Internal (cron/server-only)
export const runCheck = internalAction({
  handler: async (ctx) => { ... }
});
```

### Cleanup Jobs: Always Paginate

```typescript
// ✅ Loop until empty — single batch leaves backlog at scale
while (true) {
  const batch = await ctx.runQuery(internal.getOldItems, { limit: 1000 });
  if (batch.length === 0) break;
  await ctx.runMutation(internal.deleteItems, { ids: batch.map((b) => b._id) });
}
```

### Public Page Data Fetching

```typescript
// ✅ Promise.allSettled — partial data beats full error
const [statsResult, checksResult] = await Promise.allSettled([
  fetchStats(),
  fetchChecks(),
]);
const stats =
  statsResult.status === "fulfilled" ? statsResult.value : defaultStats;
```

## Lessons Learned

| Decision                  | Outcome                                                                  | Lesson                                                                           |
| ------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| No test harness at launch | Test gaps accumulate — state machine and check engine have zero coverage | Add Vitest setup early; test the engine, not just the UI                         |
| monitoring.ts as monolith | Hard to navigate; separation of concerns violations                      | Split into focused modules (check execution, state machine, incident management) |

---

_Last updated: 2026-02-23_
_Updated during: /groom session_
