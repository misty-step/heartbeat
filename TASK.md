# Production Infrastructure: Quality Gates, Observability & Release Automation

## Executive Summary

**Problem**: Heartbeat lacks production-grade infrastructure for confident deployments — no git hooks prevent broken commits, no structured logging for debugging, no error tracking for production issues, and no automated release workflow.

**Solution**: Implement six infrastructure pillars: (1) Lefthook git hooks, (2) 80% test coverage enforcement, (3) Sentry error tracking, (4) Pino structured logging with client aggregation, (5) Vercel Analytics, (6) semantic-release automation.

**User Value**: Pass the "Friday Afternoon Test" — merge to production Friday at 5pm and turn your phone off. Catch errors before users report them, trace issues through structured logs, and ship releases with confidence.

**Success Criteria**: All PRs pass quality gates (lint, type-check, tests), production errors appear in Sentry within seconds, logs are queryable with correlation IDs, releases auto-generate changelogs.

---

## Architecture Decision

### Selected Approach: Layered Infrastructure with Deep Modules

Each infrastructure component is a **deep module** — simple interface hiding implementation complexity:

| Module              | Interface                   | Hidden Complexity                             |
| ------------------- | --------------------------- | --------------------------------------------- |
| `lefthook.yml`      | git hooks auto-run          | Parallel execution, staged files, commitlint  |
| `@sentry/nextjs`    | `Sentry.captureException()` | Source maps, breadcrumbs, React 19 boundaries |
| `lib/logger`        | `logger.info(msg, ctx)`     | Pino transport, redaction, correlation IDs    |
| `@vercel/analytics` | `<Analytics />`             | Web vitals, performance tracking              |
| `semantic-release`  | Conventional commits        | Version bumping, changelog, GitHub releases   |

### Alternatives Considered

| Approach            | Value  | Simplicity | Risk   | Why Not                                                        |
| ------------------- | ------ | ---------- | ------ | -------------------------------------------------------------- |
| Husky + lint-staged | Medium | Low        | Low    | Lefthook is faster, native Go, better pnpm support             |
| Changesets          | Medium | Medium     | Low    | Overkill for single-package; requires manual changeset files   |
| Winston logging     | Medium | Medium     | Low    | Pino is faster, better JSON, Vercel-optimized                  |
| DataDog/LogRocket   | High   | Low        | Medium | Cost, vendor lock-in; Sentry+Pino sufficient for current scale |

---

## Requirements

### Functional Requirements

**FR1: Git Hooks (Lefthook)**

- Pre-commit: lint staged files, type-check, format
- Pre-push: run full test suite
- Commit-msg: enforce conventional commits via commitlint

**FR2: Test Coverage**

- Enforce 80% coverage threshold (lines, branches, functions, statements)
- Block PRs that drop coverage below threshold
- Generate coverage reports in PR comments

**FR3: Error Tracking (Sentry)**

- Capture unhandled exceptions in Next.js (client + server + edge)
- Capture Convex function errors via dashboard integration
- Upload source maps for readable stack traces
- Session replay for visual debugging

**FR4: Structured Logging (Pino)**

- Server-side: JSON logs with correlation IDs, automatic redaction
- Client-side: Structured console + remote transport to `/api/logs`
- Vercel-optimized output (automatic JSON parsing)

**FR5: Analytics (Vercel)**

- Web Vitals tracking (LCP, FID, CLS, TTFB)
- Page view analytics
- Speed Insights for performance monitoring

**FR6: Release Automation (semantic-release)**

- Auto-version based on conventional commits
- Generate CHANGELOG.md automatically
- Create GitHub releases with notes
- Commit version bumps back to repo

### Non-Functional Requirements

- **Performance**: Git hooks complete in <5s for staged files
- **Security**: No secrets in logs (Pino redaction), Sentry auth token in env vars
- **Reliability**: Hooks can be skipped with `LEFTHOOK=0` for emergencies
- **Maintainability**: Single config file per tool, documented in CLAUDE.md

### Security Requirements (from audit)

**SEC1: Rate Limit `/api/logs` Endpoint**

- Use Upstash Redis for rate limiting (100 logs/min per IP)
- Request size validation (max 10KB)
- Origin validation (CORS whitelist)
- Schema validation with Zod

**SEC2: Pino Redaction Rules**

- Explicit redact paths for: password, token, apiKey, secret, email, ip
- Nested paths: `*.password`, `req.headers.authorization`, `body.password`
- Use `censor: '[REDACTED]'` mode

**SEC3: Separate Sentry DSNs**

- `heartbeat-client` project (browser errors)
- `heartbeat-server` project (backend errors)
- Different DSNs in `NEXT_PUBLIC_SENTRY_DSN` vs `SENTRY_DSN`

**SEC4: Secrets Management**

- Migrate secrets to Vercel encrypted storage (not .env files)
- Add TruffleHog CI scan for leaked secrets
- Document secrets rotation process

---

## Implementation Phases

### Phase 1: Quality Gates (MVP)

1. Install Lefthook, configure pre-commit/pre-push/commit-msg hooks
2. Install commitlint with conventional commits config
3. Increase coverage thresholds to 80%
4. Update CI workflow to enforce coverage

### Phase 2: Observability

5. Create TWO Sentry projects (client/server), get separate DSNs
6. Install @sentry/nextjs, configure client/server/edge configs with separate DSNs
7. Add instrumentation.ts for Next.js 15+ server tracking
8. Create global-error.tsx error boundary
9. Enable Convex Sentry integration via dashboard
10. Install Pino with explicit redaction rules (SEC2)
11. Create lib/logger/server.ts and lib/logger/client.ts
12. Add correlation ID middleware
13. Install Upstash Redis, create /api/logs endpoint with rate limiting (SEC1)
14. Migrate secrets to Vercel encrypted storage (SEC4)

### Phase 3: Analytics & Releases

15. Install @vercel/analytics and @vercel/speed-insights
16. Add Analytics component to root layout
17. Install semantic-release with changelog/git/github plugins
18. Create .releaserc.json config
19. Add release.yml GitHub workflow
20. Add TruffleHog CI scan for leaked secrets (SEC4)

---

## Test Scenarios

### Lefthook

- [ ] Pre-commit runs on staged .ts/.tsx files only
- [ ] Pre-commit fails on lint errors, succeeds after fix
- [ ] Pre-push runs full test suite
- [ ] Commit blocked with non-conventional message
- [ ] `LEFTHOOK=0 git commit` bypasses hooks

### Sentry

- [ ] Unhandled client error appears in Sentry dashboard
- [ ] Server error in route handler appears with stack trace
- [ ] Convex function error appears via integration
- [ ] Source maps resolve to original TypeScript

### Logging

- [ ] Server logs appear in Vercel logs as parsed JSON
- [ ] Client error logs arrive at /api/logs endpoint
- [ ] Correlation ID traces request through client → server → Convex
- [ ] Sensitive fields (password, token, apiKey) redacted

### Security (/api/logs)

- [ ] Rate limit rejects after 100 requests/min from same IP
- [ ] Oversized payloads (>10KB) rejected with 413
- [ ] Invalid origin rejected with 403
- [ ] Invalid log schema rejected with 400
- [ ] Pino redacts nested sensitive fields (\*.password, req.headers.authorization)

### semantic-release

- [ ] `feat:` commit triggers minor version bump
- [ ] `fix:` commit triggers patch version bump
- [ ] CHANGELOG.md updated with release notes
- [ ] GitHub release created with assets

---

## Dependencies & Assumptions

### External Systems

- **Sentry**: Requires Sentry project + DSN (auth token at ~/.secrets/sentry-auth-token)
- **Vercel**: Deployment platform with built-in analytics
- **GitHub**: Actions for CI/CD, Releases for semantic-release
- **Convex**: Dashboard integration for Sentry (no code change)

### Assumptions

- Single-package repository (no monorepo)
- Vercel deployment (not self-hosted)
- Node.js 22 (current package.json engines)
- Team follows conventional commits after setup

### Environment Variables Required

```bash
# Sentry (use SEPARATE projects for client/server)
NEXT_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/client-project
SENTRY_DSN=https://...@o123.ingest.sentry.io/server-project
SENTRY_ORG=your-org
SENTRY_PROJECT=heartbeat
SENTRY_AUTH_TOKEN=sntrys_...

# Upstash Redis (for /api/logs rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Existing (already configured)
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
```

---

## Risks & Mitigation

| Risk                                 | Likelihood | Impact | Mitigation                                                          |
| ------------------------------------ | ---------- | ------ | ------------------------------------------------------------------- |
| 80% coverage slows development       | Medium     | Medium | Exclude UI-heavy components (already done), focus on business logic |
| Sentry noise from browser extensions | High       | Low    | beforeSend filter to ignore extension:// errors                     |
| Client logs overwhelming server      | Low        | Medium | Rate limit /api/logs, batch client sends                            |
| semantic-release breaks on edge case | Low        | High   | Test in dry-run mode first, document manual override                |
| Lefthook slows VS Code               | Medium     | Low    | Keep pre-commit fast (<5s), move heavy checks to pre-push           |

---

## Key Decisions

### D1: Lefthook over Husky

- **What**: Use Lefthook for git hooks instead of Husky + lint-staged
- **Alternatives**: Husky (JS-based, slower), simple-git-hooks (minimal)
- **Rationale**: Native Go binary = faster, built-in parallel execution, `{staged_files}` support, better pnpm compatibility
- **Tradeoff**: Less ecosystem adoption, but actively maintained by Evil Martians

### D2: semantic-release over Changesets

- **What**: Fully automated releases via semantic-release
- **Alternatives**: Changesets (manual changeset files), release-please (Google)
- **Rationale**: Single-package repo doesn't need Changesets' multi-package coordination; user preference for full automation
- **Tradeoff**: Less control over release timing; mitigated by conventional commit discipline

### D3: Pino over console.log/Winston

- **What**: Pino for structured logging
- **Alternatives**: Winston (feature-rich), Bunyan (JSON), console.log (simple)
- **Rationale**: Fastest Node.js logger, native JSON, Vercel-optimized, built-in redaction
- **Tradeoff**: Less feature-rich than Winston; sufficient for current needs

### D4: 80% Coverage Threshold

- **What**: Enforce 80% lines/branches/functions/statements
- **Alternatives**: 60% (moderate), 40% (current), 90% (strict)
- **Rationale**: User preference for high coverage; existing exclusions for UI components keep this achievable
- **Tradeoff**: May slow feature development; worth it for production confidence

---

## File Changes Summary

### New Files

```
lefthook.yml                    # Git hooks config
commitlint.config.js            # Conventional commits rules
.releaserc.json                 # semantic-release config
sentry.client.config.ts         # Sentry client init
sentry.server.config.ts         # Sentry server init
sentry.edge.config.ts           # Sentry edge init
instrumentation.ts              # Next.js 15+ server instrumentation
app/global-error.tsx            # App Router error boundary
lib/logger/server.ts            # Pino server logger
lib/logger/client.ts            # Client logger with remote transport
app/api/logs/route.ts           # Client log aggregation endpoint
middleware.ts                   # Add correlation ID injection
.github/workflows/release.yml   # semantic-release workflow
```

### Modified Files

```
package.json                    # Add dependencies, prepare script
next.config.ts                  # Wrap with withSentryConfig
app/layout.tsx                  # Add Analytics component
app/providers.tsx               # Add Sentry ErrorBoundary
vitest.config.ts                # Update coverage thresholds to 80%
.github/workflows/test.yml      # Update coverage enforcement
README.md                       # Add badges for coverage, version
CLAUDE.md                       # Document new infrastructure
```

### Dependencies to Add

```json
{
  "dependencies": {
    "@sentry/nextjs": "^9.0.0",
    "@vercel/analytics": "^1.4.0",
    "@vercel/speed-insights": "^1.1.0",
    "@upstash/ratelimit": "^2.0.0",
    "@upstash/redis": "^1.37.0",
    "pino": "^9.0.0",
    "serialize-error": "^11.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "lefthook": "^1.10.0",
    "@commitlint/cli": "^19.8.0",
    "@commitlint/config-conventional": "^19.8.0",
    "semantic-release": "^25.0.0",
    "@semantic-release/changelog": "^6.0.0",
    "@semantic-release/git": "^10.0.0",
    "@semantic-release/github": "^11.0.0",
    "pino-pretty": "^13.0.0"
  }
}
```

**Note**: Upstash Redis costs ~$10/month (free tier: 10K requests/day). Zod is already in the project via Convex dependencies.
