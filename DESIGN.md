# Production Infrastructure Architecture Design

## Architecture Overview

**Selected Approach**: Layered Infrastructure with Deep Modules

Each infrastructure component is a standalone deep module — simple interface hiding implementation complexity. Components integrate at well-defined touchpoints (layout, middleware, CI) but remain independently testable and replaceable.

**Rationale**: Six independent pillars (hooks, coverage, Sentry, logging, analytics, releases) share no runtime state. Composing them as isolated modules minimizes coupling and allows incremental rollout. Each can fail independently without cascading failures.

**Core Modules**:

| Module                  | Interface               | Hidden Complexity                                     |
| ----------------------- | ----------------------- | ----------------------------------------------------- |
| `lefthook.yml`          | Git hooks auto-run      | Parallel execution, staged file filtering, commitlint |
| `sentry.*.config.ts`    | `Sentry.init()`         | Source maps, beforeSend filters, React 19 boundaries  |
| `lib/logger/*`          | `logger.info(msg, ctx)` | Pino transport, redaction rules, correlation IDs      |
| `app/api/logs/route.ts` | `POST /api/logs`        | Rate limiting, schema validation, origin checks       |
| `@vercel/analytics`     | `<Analytics />`         | Web vitals, performance tracking                      |
| `.releaserc.json`       | Conventional commits    | Version bumping, changelog, GitHub releases           |

**Data Flow**:

```
Client Error → Sentry SDK → Sentry Dashboard
Server Error → Sentry SDK → Sentry Dashboard
Client Log → /api/logs → Pino → Vercel Logs
Server Log → Pino → stdout → Vercel Logs
Commit → Lefthook → lint/test → Git
Push → CI → test/build → semantic-release → GitHub Release
```

**Key Design Decisions**:

1. Separate Sentry DSNs (client/server) for noise isolation and security
2. Rate-limited `/api/logs` endpoint prevents client log DDoS
3. Correlation IDs trace requests across client → middleware → Convex
4. Lefthook over Husky for native Go speed and pnpm compatibility

---

## Module: Lefthook Git Hooks

**Responsibility**: Enforce code quality at commit/push time without blocking IDE performance.

**Public Interface**:

```yaml
# lefthook.yml - single config file, auto-installed via prepare script
pre-commit: # Fast checks on staged files only
pre-push: # Full test suite before remote push
commit-msg: # Conventional commit format enforcement
```

**Internal Implementation**:

- Parallel linting of staged `.ts`/`.tsx` files
- Auto-fix and re-stage formatted files
- commitlint with `@commitlint/config-conventional`
- Emergency bypass via `LEFTHOOK=0` or `--no-verify`

**Data Structures**:

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{ts,tsx}"
      run: pnpm eslint --fix {staged_files}
      stage_fixed: true
    format:
      glob: "*.{ts,tsx,json,md,css}"
      run: pnpm prettier --write {staged_files}
      stage_fixed: true
    typecheck:
      run: pnpm tsc --noEmit

pre-push:
  commands:
    test:
      run: pnpm test

commit-msg:
  commands:
    lint-commit:
      run: pnpm commitlint --edit {1}
```

```javascript
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 72],
  },
};
```

**Dependencies**:

- Requires: lefthook (Go binary), @commitlint/cli, prettier
- Used by: Developer git workflow

**Error Handling**:

- Lint errors → Block commit, show errors, suggest `--fix`
- Test failures on push → Block push, show failures
- Non-conventional commit → Block commit, show format example
- Emergency override → `LEFTHOOK=0 git commit -m "hotfix"`

**Installation Pseudocode**:

```pseudocode
function setupLefthook():
  1. Add dependencies to package.json
     - lefthook (devDependencies)
     - @commitlint/cli, @commitlint/config-conventional
     - prettier (if not present)

  2. Add prepare script to package.json
     - "prepare": "lefthook install"

  3. Create lefthook.yml at project root
     - pre-commit: lint, format, typecheck (parallel)
     - pre-push: full test suite
     - commit-msg: commitlint

  4. Create commitlint.config.js
     - extends: @commitlint/config-conventional
     - custom rules for header length, case

  5. Run pnpm install to trigger prepare script
```

---

## Module: Coverage Enforcement

**Responsibility**: Enforce 80% test coverage threshold, block PRs that regress coverage.

**Public Interface**:

```typescript
// vitest.config.ts - coverage.thresholds
thresholds: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

**Internal Implementation**:

- v8 coverage provider (native, fast)
- Strategic exclusions for UI-heavy components
- CI workflow fails on threshold violation
- Coverage badge auto-updates on master

**Data Structures**:

```typescript
// vitest.config.ts coverage section
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'json-summary'],
  include: [
    'components/**/*.tsx',
    'app/**/*.tsx',
    'hooks/**/*.ts',
    'convex/**/*.ts',
    'lib/**/*.ts',  // NEW: include logger
  ],
  exclude: [
    '**/_generated/**',
    '**/*.test.{ts,tsx}',
    'e2e/**',
    'convex/schema.ts',
    'convex/crons.ts',
    'convex/migrations.ts',
    'convex/auth.config.ts',
    'app/layout.tsx',
    'app/providers.tsx',
    'middleware.ts',
    'app/global-error.tsx',      // NEW: Sentry error boundary
    'sentry.*.config.ts',         // NEW: Sentry configs
    'instrumentation.ts',         // NEW: Next.js instrumentation
    // Large UI surfaces covered by e2e
    'components/MonitorSettingsModal.tsx',
    'components/AddMonitorForm.tsx',
    'components/UptimeChart.tsx',
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
},
```

**CI Enforcement Pseudocode**:

```pseudocode
function enforceCoverage(workflowStep):
  1. Run vitest with coverage
     - pnpm vitest run --coverage
     - Exit code non-zero if thresholds not met

  2. If PR event, post coverage comment
     - Parse coverage-summary.json
     - Format markdown table
     - Create PR comment via GitHub API

  3. If master branch, update badge
     - Extract coverage percentage
     - Update README.md badge URL
     - Auto-commit badge change
```

---

## Module: Sentry Error Tracking

**Responsibility**: Capture unhandled exceptions across client, server, and edge runtimes with readable stack traces.

**Public Interface**:

```typescript
// Automatic capture - no explicit calls needed in application code
// Manual capture when needed:
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
Sentry.captureMessage("Something happened", "warning");
```

**Internal Implementation**:

- Three config files for client/server/edge runtimes
- Source map upload during build
- beforeSend filters for noise reduction (browser extensions)
- React 19 error boundary integration
- Separate DSNs for client vs server isolation

**Data Structures**:

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // CLIENT DSN
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay for visual debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filter out browser extension noise
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore browser extension errors
    if (typeof error === "object" && error !== null) {
      const errorString = String(error);
      if (
        errorString.includes("extension://") ||
        errorString.includes("chrome-extension://")
      ) {
        return null;
      }
    }

    // Ignore ResizeObserver loop errors (benign)
    if (event.message?.includes("ResizeObserver loop")) {
      return null;
    }

    return event;
  },
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // SERVER DSN (different!)
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Redact sensitive data from server errors
  beforeSend(event) {
    if (event.request) {
      // Remove auth headers
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      // Remove sensitive body fields
      if (event.request.data && typeof event.request.data === "object") {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.token;
        delete data.apiKey;
      }
    }
    return event;
  },
});
```

```typescript
// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // Same as server
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

```typescript
// instrumentation.ts (Next.js 15+ server instrumentation hook)
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

```typescript
// app/global-error.tsx (App Router error boundary)
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

**next.config.ts Integration**:

```typescript
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // existing config
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps for readable stack traces
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Silence build logs
  silent: !process.env.CI,

  // Auto-instrument server components
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
});
```

**Dependencies**:

- Requires: @sentry/nextjs, SENTRY_AUTH_TOKEN, two Sentry projects
- Used by: All runtime code (automatic), explicit Sentry.capture\* calls

**Error Categories**:

- Client errors → heartbeat-client Sentry project
- Server/edge errors → heartbeat-server Sentry project
- Convex errors → Sentry dashboard integration (no code)

---

## Module: Pino Structured Logging

**Responsibility**: Emit queryable JSON logs with automatic redaction and correlation IDs.

**Public Interface**:

```typescript
// Server-side (Node.js)
import { logger, createRequestLogger } from "@/lib/logger/server";
logger.info("Monitor checked", { monitorId, responseTime });
logger.error("Check failed", { monitorId, error });

// Client-side (browser)
import { clientLogger } from "@/lib/logger/client";
clientLogger.error("Component error", { component: "Dashboard", error });
```

**Internal Implementation**:

- Pino for server (fastest Node.js logger, native JSON)
- Custom client logger with batched remote transport
- Explicit redaction paths for sensitive fields
- Request-scoped correlation IDs via middleware

**Data Structures**:

```typescript
// lib/logger/server.ts
import pino from "pino";

// Explicit redaction paths per SEC2
const REDACT_PATHS = [
  "password",
  "token",
  "apiKey",
  "secret",
  "email",
  "ip",
  "*.password",
  "*.token",
  "*.apiKey",
  "*.secret",
  "req.headers.authorization",
  "req.headers.cookie",
  "body.password",
  "body.token",
  "body.apiKey",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Redact sensitive fields
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },

  // Vercel-optimized JSON output
  formatters: {
    level: (label) => ({ level: label }),
  },

  // Add timestamp as ISO string
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create request-scoped logger with correlation ID
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Type-safe log context
export type LogContext = Record<string, unknown>;
```

```typescript
// lib/logger/client.ts
import { serializeError } from "serialize-error";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: ReturnType<typeof serializeError>;
  url?: string;
  userAgent?: string;
}

const LOG_BATCH_SIZE = 10;
const LOG_FLUSH_INTERVAL = 5000; // 5 seconds

class ClientLogger {
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
      this.startFlushTimer();
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), LOG_FLUSH_INTERVAL);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    if (error) {
      entry.error = serializeError(error);
    }

    // Console output for development
    if (process.env.NODE_ENV === "development") {
      const consoleMethod =
        level === "error" ? "error" : level === "warn" ? "warn" : "log";
      console[consoleMethod](
        `[${level.toUpperCase()}]`,
        message,
        context,
        error,
      );
    }

    this.buffer.push(entry);

    if (this.buffer.length >= LOG_BATCH_SIZE) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
        keepalive: true, // Survive page unload
      });
    } catch {
      // Re-add to buffer on failure (will retry on next flush)
      this.buffer.unshift(...entries);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error) {
    this.log("error", message, context, error);
  }
}

export const clientLogger = new ClientLogger();
```

```typescript
// lib/logger/index.ts (re-export for convenience)
export { logger, createRequestLogger, type LogContext } from "./server";
export { clientLogger } from "./client";
```

**Correlation ID Middleware**:

```typescript
// Updated middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/terms",
  "/privacy",
  "/status(.*)",
  "/s(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/logs", // Public endpoint (has its own auth)
]);

export default clerkMiddleware(async (auth, request) => {
  // Generate correlation ID for request tracing
  const requestId = crypto.randomUUID();

  // Clone headers and add correlation ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Pass correlation ID to response headers for debugging
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Dependencies**:

- Requires: pino, serialize-error, middleware updates
- Used by: All server code, client components with error handling

---

## Module: Client Log Aggregation API

**Responsibility**: Receive batched logs from client, validate, rate-limit, and forward to server logger.

**Public Interface**:

```typescript
// POST /api/logs
// Request body: { entries: LogEntry[] }
// Response: 200 OK | 400 Bad Request | 413 Payload Too Large | 429 Too Many Requests
```

**Internal Implementation**:

- Upstash Redis rate limiting (100 req/min per IP)
- Zod schema validation
- Origin whitelist (CORS)
- Max payload size enforcement (10KB)
- Forward valid logs to Pino server logger

**Data Structures**:

```typescript
// app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import { logger } from "@/lib/logger/server";

// Rate limiter: 100 requests per minute per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
});

// Schema validation
const LogEntrySchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z.string().max(1000),
  timestamp: z.string().datetime(),
  context: z.record(z.unknown()).optional(),
  error: z
    .object({
      name: z.string().optional(),
      message: z.string().optional(),
      stack: z.string().optional(),
    })
    .optional(),
  url: z.string().url().optional(),
  userAgent: z.string().max(500).optional(),
});

const RequestSchema = z.object({
  entries: z.array(LogEntrySchema).max(50), // Max 50 entries per batch
});

// Allowed origins
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000", // Development
].filter(Boolean);

const MAX_PAYLOAD_SIZE = 10 * 1024; // 10KB

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Rate limit check
  const { success, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  // Origin check
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // Payload size check
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const body = await request.json();

    // Schema validation
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: result.error.flatten() },
        { status: 400 },
      );
    }

    // Forward logs to server logger
    const requestId =
      request.headers.get("x-request-id") ?? crypto.randomUUID();
    const clientLoggerInstance = logger.child({
      source: "client",
      clientIp: ip,
      requestId,
    });

    for (const entry of result.data.entries) {
      const logMethod =
        entry.level === "error"
          ? "error"
          : entry.level === "warn"
            ? "warn"
            : "info";

      clientLoggerInstance[logMethod](entry.message, {
        ...entry.context,
        clientUrl: entry.url,
        clientUserAgent: entry.userAgent,
        clientTimestamp: entry.timestamp,
        clientError: entry.error,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to process client logs", { error, ip });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
```

**Dependencies**:

- Requires: @upstash/redis, @upstash/ratelimit, zod, lib/logger/server
- Used by: lib/logger/client

**Error Handling**:

- Rate limit exceeded → 429 with retry-after header
- Invalid origin → 403 Forbidden
- Oversized payload → 413 Payload Too Large
- Invalid schema → 400 with validation errors
- Server error → 500, log error, don't expose details

---

## Module: Vercel Analytics

**Responsibility**: Track Web Vitals and page views with zero configuration.

**Public Interface**:

```tsx
// Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

<Analytics />
<SpeedInsights />
```

**Internal Implementation**:

- Automatic Web Vitals collection (LCP, FID, CLS, TTFB, INP)
- Page view tracking
- Speed Insights for performance monitoring
- Vercel dashboard integration (automatic)

**Integration**:

```tsx
// app/layout.tsx (updated)
import type { Metadata } from "next";
import { Manrope, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import "./globals.css";

// ... font definitions ...

export const metadata: Metadata = {
  // ... existing metadata ...
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`...`}>
      <body className="antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Dependencies**:

- Requires: @vercel/analytics, @vercel/speed-insights
- Used by: Root layout (one-time setup)

---

## Module: semantic-release Automation

**Responsibility**: Automatically version, changelog, and release based on conventional commits.

**Public Interface**:

```bash
# Triggered by CI on master push
# Analyzes commits since last release
# Creates GitHub release with changelog
```

**Internal Implementation**:

- Commit analysis for version bumping
- CHANGELOG.md generation
- GitHub release creation
- Version commit back to repo

**Data Structures**:

```json
// .releaserc.json
{
  "branches": ["master"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": false
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [master]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    # Don't run on automated commits
    if: "!contains(github.event.head_commit.message, '[skip ci]')"

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.22.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx semantic-release
```

**Version Bump Rules**:
| Commit Type | Version Bump |
|-------------|--------------|
| `fix:` | PATCH (0.0.X) |
| `feat:` | MINOR (0.X.0) |
| `BREAKING CHANGE:` | MAJOR (X.0.0) |
| `docs:`, `style:`, `refactor:`, `test:`, `chore:` | No release |

**Dependencies**:

- Requires: semantic-release, plugins, GITHUB_TOKEN
- Used by: CI on master push

---

## File Organization

```
/
├── lefthook.yml                    # Git hooks config
├── commitlint.config.js            # Conventional commits rules
├── .releaserc.json                 # semantic-release config
├── sentry.client.config.ts         # Sentry client init
├── sentry.server.config.ts         # Sentry server init
├── sentry.edge.config.ts           # Sentry edge init
├── instrumentation.ts              # Next.js server instrumentation
├── next.config.ts                  # Wrapped with withSentryConfig
├── middleware.ts                   # Updated with correlation IDs
├── lib/
│   └── logger/
│       ├── index.ts                # Re-exports
│       ├── server.ts               # Pino server logger
│       └── client.ts               # Client logger with remote transport
├── app/
│   ├── layout.tsx                  # Add Analytics + SpeedInsights
│   ├── global-error.tsx            # Sentry error boundary
│   └── api/
│       └── logs/
│           └── route.ts            # Client log aggregation endpoint
├── .github/
│   └── workflows/
│       ├── test.yml                # Updated coverage thresholds
│       └── release.yml             # semantic-release workflow
└── vitest.config.ts                # Updated coverage to 80%
```

**Modifications to Existing Files**:

| File                         | Changes                                         |
| ---------------------------- | ----------------------------------------------- |
| `package.json`               | Add dependencies, prepare script                |
| `next.config.ts`             | Wrap with withSentryConfig                      |
| `middleware.ts`              | Add correlation ID injection                    |
| `app/layout.tsx`             | Add Analytics + SpeedInsights components        |
| `vitest.config.ts`           | Bump coverage thresholds to 80%, add exclusions |
| `.github/workflows/test.yml` | Remove continue-on-error from lint              |

---

## Environment Variables

```bash
# Sentry (SEPARATE projects for client/server)
NEXT_PUBLIC_SENTRY_DSN=https://...@o123.ingest.sentry.io/heartbeat-client
SENTRY_DSN=https://...@o123.ingest.sentry.io/heartbeat-server
SENTRY_ORG=your-org
SENTRY_PROJECT=heartbeat
SENTRY_AUTH_TOKEN=sntrys_...

# Upstash Redis (for /api/logs rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# App URL (for CORS whitelist)
NEXT_PUBLIC_APP_URL=https://heartbeat.example.com

# Existing (already configured)
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## Testing Strategy

**Unit Tests** (fast, isolated):

- `lib/logger/server.test.ts` - Pino redaction, child logger creation
- `lib/logger/client.test.ts` - Batching, flush on unload
- Log schema validation functions

**Integration Tests** (slower, real dependencies):

- `/api/logs` endpoint with mock Redis
- Rate limiting behavior
- Schema validation error responses

**E2E Tests**:

- Lefthook hooks trigger on commit/push (manual verification)
- Client errors appear in Sentry (manual verification)
- semantic-release dry-run in CI

**Mocking Strategy**:

- Mock Upstash Redis in API route tests
- Mock fetch in client logger tests
- Real Pino in server logger tests (fast enough)

**Coverage Exclusions Rationale**:

- `sentry.*.config.ts` - Configuration, not logic
- `instrumentation.ts` - Next.js hook, not testable in JSDOM
- `global-error.tsx` - Error boundary, tested via e2e
- `middleware.ts` - Edge runtime, not testable in JSDOM

---

## Security Considerations

**SEC1: Rate Limiting**

- Upstash Redis sliding window (100 req/min/IP)
- Prevents client log DDoS
- Returns 429 with retry-after header

**SEC2: Pino Redaction**

- Explicit paths: password, token, apiKey, secret, email, ip
- Nested paths: \*.password, req.headers.authorization
- Censor mode: '[REDACTED]'

**SEC3: Separate Sentry DSNs**

- Client errors → heartbeat-client project (public DSN)
- Server errors → heartbeat-server project (private DSN)
- Prevents mixing client/server noise

**SEC4: Origin Validation**

- CORS whitelist in /api/logs
- Rejects requests from unknown origins
- Payload size limit (10KB)

**Secret Management**:

- All secrets in Vercel env vars (not .env files)
- SENTRY_AUTH_TOKEN only in CI
- TruffleHog scan in CI (future phase)

---

## Performance Considerations

**Git Hooks**:

- pre-commit: <5s target (parallel lint/format)
- pre-push: Full test suite (acceptable delay before push)
- Emergency bypass: `LEFTHOOK=0`

**Logging**:

- Pino: Fastest Node.js logger (~30K logs/sec)
- Client batching: 10 entries or 5s interval
- Rate limiting: Prevents log flooding

**Sentry**:

- tracesSampleRate: 10% in production
- replaysSessionSampleRate: 10%
- replaysOnErrorSampleRate: 100%

**Analytics**:

- Zero-config, minimal bundle impact
- Automatic code splitting by Vercel

---

## Implementation Phases

### Phase 1: Quality Gates

1. Install lefthook, commitlint, prettier
2. Create lefthook.yml, commitlint.config.js
3. Update package.json prepare script
4. Bump vitest.config.ts coverage to 80%
5. Update CI lint step (remove continue-on-error)

### Phase 2: Observability

6. Create TWO Sentry projects (heartbeat-client, heartbeat-server)
7. Install @sentry/nextjs
8. Create sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
9. Create instrumentation.ts
10. Create app/global-error.tsx
11. Wrap next.config.ts with withSentryConfig
12. Create lib/logger/server.ts (Pino with redaction)
13. Create lib/logger/client.ts (batched remote transport)
14. Update middleware.ts (correlation IDs)
15. Create app/api/logs/route.ts (rate-limited endpoint)
16. Set up Upstash Redis

### Phase 3: Analytics & Releases

17. Install @vercel/analytics, @vercel/speed-insights
18. Update app/layout.tsx (add Analytics + SpeedInsights)
19. Install semantic-release + plugins
20. Create .releaserc.json
21. Create .github/workflows/release.yml

---

## Alternatives Considered

### Alternative A: Husky + lint-staged

- **Pros**: Widespread adoption, familiar to most devs
- **Cons**: JS-based (slower), pnpm compatibility issues, separate packages for lint-staged
- **Verdict**: Rejected - Lefthook is faster, single package, better pnpm support

### Alternative B: Changesets

- **Pros**: Manual control, monorepo support, explicit changeset files
- **Cons**: Requires manual changeset creation, overkill for single-package
- **Verdict**: Rejected - Single package doesn't need multi-package coordination

### Alternative C: Winston Logging

- **Pros**: Feature-rich, transports ecosystem
- **Cons**: Slower than Pino, heavier bundle, less Vercel-optimized
- **Verdict**: Rejected - Pino is faster, native JSON, better for serverless

### Alternative D: Single Sentry Project

- **Pros**: Simpler setup, one DSN
- **Cons**: Client/server errors mixed, harder to filter noise, security risk
- **Verdict**: Rejected - Separation improves debugging and security

### Alternative E: Custom Rate Limiting (in-memory)

- **Pros**: No external dependency
- **Cons**: Doesn't work across serverless instances, resets on deploy
- **Verdict**: Rejected - Upstash Redis provides distributed rate limiting
