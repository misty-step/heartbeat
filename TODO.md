# TODO: Production Infrastructure

## Context

- **Architecture**: Layered Infrastructure with Deep Modules (see DESIGN.md)
- **Key Files**: lefthook.yml, sentry._.config.ts, lib/logger/_, app/api/logs/route.ts, .releaserc.json
- **Patterns**: Vitest for testing (components/**tests**/_.test.tsx), Convex backend (convex/**tests**/_.test.ts)
- **Current Stack**: Next.js 16, React 19, Convex, Clerk, Tailwind 4, pnpm

## Phase 1: Quality Gates

- [x] Configure Lefthook git hooks with commitlint

  ```
  Files:
    - lefthook.yml (new)
    - commitlint.config.mjs (new)
    - package.json (modify: add prepare script, devDependencies)

  Approach: Follow DESIGN.md lefthook.yml structure exactly

  Dependencies to add:
    - lefthook
    - @commitlint/cli
    - @commitlint/config-conventional
    - prettier

  Success:
    - `pnpm install` triggers `lefthook install`
    - git commit with bad lint → blocked
    - git commit with "bad message" → blocked by commitlint
    - git commit with "feat: valid message" → passes
    - git push with failing tests → blocked
    - LEFTHOOK=0 git commit → bypasses hooks

  Test: Manual verification (git hooks not unit-testable)
  Time: 30min
  ```

- [x] Enforce 80% coverage thresholds

  ```
  Files: vitest.config.ts (modify lines 56-61)

  Approach: Bump thresholds from 40% to 80%, add new exclusions per DESIGN.md

  Changes:
    - thresholds.lines: 40 → 80
    - thresholds.functions: 40 → 80
    - thresholds.branches: 40 → 80
    - thresholds.statements: 40 → 80
    - Add to exclude: 'app/global-error.tsx', 'sentry.*.config.ts', 'instrumentation.ts'
    - Add to include: 'lib/**/*.ts'

  Success:
    - pnpm test:coverage fails if below 80%
    - New infrastructure files excluded from coverage

  Test: Run pnpm test:coverage, verify thresholds enforced
  Time: 15min
  ```

- [ ] Enforce lint in CI (remove continue-on-error)

  ```
  Files: .github/workflows/test.yml (modify line 39)

  Approach: Remove `continue-on-error: true` from lint step

  Success: PRs with lint errors fail CI

  Test: Verify workflow syntax, test with lint error
  Time: 10min
  ```

## Phase 2: Observability - Sentry

- [ ] Install @sentry/nextjs and create config files

  ```
  Files:
    - package.json (modify: add @sentry/nextjs dependency)
    - sentry.client.config.ts (new)
    - sentry.server.config.ts (new)
    - sentry.edge.config.ts (new)

  Approach: Copy exact code from DESIGN.md "Module: Sentry Error Tracking"

  Key points:
    - Client DSN: NEXT_PUBLIC_SENTRY_DSN
    - Server DSN: SENTRY_DSN (different!)
    - beforeSend filters for extension:// and ResizeObserver
    - Server beforeSend redacts authorization, cookie, password, token, apiKey
    - Session replay enabled with 10%/100% sampling

  Success:
    - Build succeeds with Sentry configs
    - No TypeScript errors

  Test: Type-check passes, build succeeds
  Time: 30min
  ```

- [ ] Create Next.js instrumentation hook

  ```
  Files: instrumentation.ts (new at project root)

  Approach: Exact code from DESIGN.md

  Content:
    - register() loads server/edge configs based on NEXT_RUNTIME
    - Export onRequestError for automatic error capture

  Success: Next.js recognizes instrumentation hook

  Test: Build succeeds, server starts without errors
  Time: 15min
  ```

- [ ] Create global error boundary

  ```
  Files: app/global-error.tsx (new)

  Approach: Exact code from DESIGN.md

  Key points:
    - 'use client' directive
    - useEffect captures error to Sentry
    - Simple UI with reset button
    - Must wrap html/body (App Router requirement)

  Success: Unhandled errors in production show error UI

  Test: Manual - throw error in component, verify boundary catches
  Time: 20min
  ```

- [ ] Wrap next.config.ts with withSentryConfig

  ```
  Files: next.config.ts (modify)

  Approach: Follow DESIGN.md next.config.ts Integration

  Changes:
    - Import withSentryConfig from @sentry/nextjs
    - Wrap export with withSentryConfig()
    - Add org, project, authToken from env vars
    - Enable sourcemaps.deleteSourcemapsAfterUpload
    - Enable autoInstrument* options

  Success:
    - Build uploads source maps when SENTRY_AUTH_TOKEN present
    - Build succeeds without auth token (silently skips upload)

  Test: pnpm build succeeds
  Time: 20min
  ```

## Phase 2: Observability - Pino Logging

- [ ] Create server logger with Pino

  ```
  Files: lib/logger/server.ts (new - create lib/logger/ directory)

  Approach: Exact code from DESIGN.md "Module: Pino Structured Logging"

  Key points:
    - REDACT_PATHS: password, token, apiKey, secret, email, ip + nested paths
    - Censor mode: '[REDACTED]'
    - ISO timestamp format
    - Level formatter for Vercel JSON parsing
    - createRequestLogger(requestId) factory

  Dependencies to add: pino

  Success:
    - logger.info('test', { password: 'secret' }) → password: '[REDACTED]'
    - createRequestLogger('abc') → child logger with requestId: 'abc'

  Test: lib/logger/__tests__/server.test.ts
    - Test redaction of each sensitive field
    - Test child logger includes requestId
  Time: 45min
  ```

- [ ] Create client logger with batched transport

  ```
  Files: lib/logger/client.ts (new)

  Approach: Exact code from DESIGN.md ClientLogger class

  Key points:
    - Buffer entries until batch size (10) or interval (5s)
    - Flush on beforeunload
    - POST to /api/logs with keepalive: true
    - Retry on failure (re-add to buffer)
    - Console output in development

  Dependencies to add: serialize-error

  Success:
    - clientLogger.error() buffers entry
    - Flush sends POST to /api/logs
    - Failed fetch retries on next flush

  Test: lib/logger/__tests__/client.test.ts
    - Mock fetch, verify batching
    - Test flush behavior
    - Test error serialization
  Time: 45min
  ```

- [ ] Create logger index with re-exports

  ```
  Files: lib/logger/index.ts (new)

  Approach: Simple re-export per DESIGN.md

  Content:
    export { logger, createRequestLogger, type LogContext } from './server';
    export { clientLogger } from './client';

  Success: Import from '@/lib/logger' works

  Test: TypeScript resolves imports
  Time: 10min
  ```

- [ ] Update middleware with correlation IDs

  ```
  Files: middleware.ts (modify)

  Approach: Follow DESIGN.md "Correlation ID Middleware"

  Changes:
    - Import NextResponse
    - Generate requestId = crypto.randomUUID()
    - Add x-request-id to request headers
    - Add x-request-id to response headers
    - Add '/api/logs' to isPublicRoute

  Success:
    - Every request gets x-request-id header
    - Response includes same x-request-id
    - /api/logs is accessible without auth

  Test: Manual - check response headers for x-request-id
  Time: 20min
  ```

- [ ] Create /api/logs endpoint with rate limiting

  ```
  Files: app/api/logs/route.ts (new - create app/api/logs/ directory)

  Approach: Exact code from DESIGN.md "Module: Client Log Aggregation API"

  Key points:
    - Upstash Redis rate limiting (100 req/min/IP)
    - Zod schema validation
    - Origin whitelist from NEXT_PUBLIC_APP_URL + localhost
    - Max payload 10KB
    - Forward to Pino logger with source: 'client'

  Dependencies to add: @upstash/ratelimit, @upstash/redis, zod

  Success:
    - Valid POST → 200 + logs appear in server output
    - 101st request/min → 429 + Retry-After header
    - Invalid origin → 403
    - >10KB payload → 413
    - Invalid schema → 400

  Test: app/api/logs/__tests__/route.test.ts (mock Redis)
    - Test rate limiting (mock Ratelimit.limit)
    - Test schema validation
    - Test origin validation
    - Test size validation
  Time: 1hr
  ```

## Phase 3: Analytics & Releases

- [ ] Add Vercel Analytics and Speed Insights

  ```
  Files:
    - package.json (modify: add @vercel/analytics, @vercel/speed-insights)
    - app/layout.tsx (modify)

  Approach: Add components per DESIGN.md

  Changes to layout.tsx:
    - Import Analytics from @vercel/analytics/next
    - Import SpeedInsights from @vercel/speed-insights/next
    - Add <Analytics /> after <Providers>
    - Add <SpeedInsights /> after <Analytics />

  Success:
    - Web Vitals visible in Vercel dashboard
    - No console errors
    - Bundle size impact minimal (<5KB)

  Test: Manual - verify analytics in Vercel dashboard
  Time: 20min
  ```

- [ ] Configure semantic-release

  ```
  Files:
    - package.json (modify: add semantic-release + plugins to devDependencies)
    - .releaserc.json (new)

  Approach: Exact config from DESIGN.md

  Dependencies to add:
    - semantic-release
    - @semantic-release/changelog
    - @semantic-release/git
    - @semantic-release/github

  Key points:
    - branches: ["master"]
    - Plugins: commit-analyzer, release-notes-generator, changelog, npm (no publish), git, github
    - Commit message: "chore(release): ${nextRelease.version} [skip ci]"

  Success:
    - npx semantic-release --dry-run shows what would happen
    - No errors in dry-run

  Test: Run dry-run locally
  Time: 30min
  ```

- [ ] Create release workflow

  ```
  Files: .github/workflows/release.yml (new)

  Approach: Exact YAML from DESIGN.md

  Key points:
    - Trigger on push to master
    - Skip if commit message contains [skip ci]
    - fetch-depth: 0 for full git history
    - Run build before release
    - GITHUB_TOKEN for release creation

  Success:
    - Workflow appears in GitHub Actions
    - Push to master triggers release job
    - Version bumped based on conventional commits

  Test: Push feat: commit to master, verify release created
  Time: 30min
  ```

## Phase 4: Testing (after implementation)

- [x] Write server logger tests

  ```
  Files: lib/logger/__tests__/server.test.ts (new)

  Tests:
    - Redacts password field
    - Redacts token field
    - Redacts apiKey field
    - Redacts nested *.password paths
    - Redacts req.headers.authorization
    - createRequestLogger includes requestId in child
    - Timestamp is ISO format

  Time: 30min
  ```

- [x] Write client logger tests

  ```
  Files: lib/logger/__tests__/client.test.ts (new)

  Tests:
    - Batches entries until LOG_BATCH_SIZE
    - Flushes after LOG_FLUSH_INTERVAL
    - flush() POSTs to /api/logs
    - Failed fetch retries on next flush
    - Error is serialized correctly
    - Console output in development mode

  Time: 30min
  ```

- [x] Write /api/logs endpoint tests

  ```
  Files: app/api/logs/__tests__/route.test.ts (new)

  Tests:
    - Returns 200 for valid request
    - Returns 429 when rate limited (mock Redis)
    - Returns 403 for invalid origin
    - Returns 413 for oversized payload
    - Returns 400 for invalid schema
    - Returns 405 for GET request
    - Logs are forwarded to server logger

  Time: 45min
  ```

## Environment Setup (Manual - Not Tasks)

Before implementation, ensure these are configured:

1. **Sentry** (manual setup in Sentry dashboard):
   - Create project: heartbeat-client
   - Create project: heartbeat-server
   - Get DSNs for both
   - Create auth token for source map uploads

2. **Upstash Redis** (manual setup):
   - Create Redis database
   - Get REST URL and token

3. **Vercel Environment Variables**:
   - NEXT_PUBLIC_SENTRY_DSN (client DSN)
   - SENTRY_DSN (server DSN)
   - SENTRY_ORG
   - SENTRY_PROJECT
   - SENTRY_AUTH_TOKEN
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - NEXT_PUBLIC_APP_URL

## Design Iteration

After Phase 2: Review logging patterns, assess if correlation IDs are being used effectively
After Phase 3: Review release workflow, verify conventional commits are being followed

## Automation Opportunities

- Pre-commit hook handles lint/format automatically
- semantic-release handles versioning automatically
- Coverage badge updates automatically on master

## Dependency Summary

```bash
# Production dependencies
pnpm add @sentry/nextjs @vercel/analytics @vercel/speed-insights pino serialize-error @upstash/ratelimit @upstash/redis zod

# Development dependencies
pnpm add -D lefthook @commitlint/cli @commitlint/config-conventional prettier semantic-release @semantic-release/changelog @semantic-release/git @semantic-release/github pino-pretty
```
