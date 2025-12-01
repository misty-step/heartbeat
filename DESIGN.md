# Architecture: Automated QA Suite

## Overview
A layered testing architecture leveraging **Vitest** for unit/integration logic (React + Logic), **convex-test** for backend isolation, and **Playwright** for critical user flows. Coverage is aggregated via `v8` provider and reported to GitHub PRs via a custom Action workflow, bypassing paid SaaS providers.

## Design Principles Applied
-   **Separation of Concerns**: Testing tiers (Unit vs. E2E) are completely decoupled. Unit tests mock dependencies; E2E tests run against full production-like stack.
-   **Deep Modules**: The `TestRunner` logic in CI encapsulates all complexity of generating, parsing, and reporting coverage. The developer interface is just `pnpm test`.
-   **Fail Fast**: CI pipeline orders tests by speed: Lint → Types → Unit → Backend → E2E.

## Module Design

### Module: Testing Configuration (`vitest.config.ts`)

**Purpose**: Centralized configuration for unit and integration tests. Hides the complexity of Next.js + React environment setup.

**Interface**:
```typescript
// Exports ViteUserConfig
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["components/**/*.tsx", "lib/**/*.ts", "convex/**/*.ts"],
      exclude: ["**/_generated/**", "**/*.test.ts"]
    }
  }
})
```

### Module: Backend Test Harness (`tests/convex.ts`)

**Purpose**: Provides a typed, isolated environment for testing Convex functions without network calls to production. Wraps `convex-test`.

**Interface**:
```typescript
import { convexTest } from "convex-test";
import schema from "../convex/schema";

// Factory for isolated test backend
export const setupBackend = () => convexTest(schema);

/**
 * Usage:
 * const t = setupBackend();
 * await t.mutation(api.monitors.create, { ... });
 * const result = await t.query(api.monitors.list);
 */
```

### Module: E2E Test Suite (`e2e/`)

**Purpose**: Validates critical user journeys. Hides authentication complexity via reusable fixtures.

**Structure**:
-   `e2e/global-setup.ts`: Handles global auth state setup (if needed).
-   `e2e/auth.spec.ts`: Tests Login/Logout.
-   `e2e/monitors.spec.ts`: Tests CRUD operations on monitors.
-   `playwright.config.ts`: Configures browsers, base URLs, and retries.

### Module: CI/CD Workflow (`.github/workflows/test.yml`)

**Purpose**: Orchestrates the entire quality pipeline.

**Flow**:
1.  Checkout
2.  Install Dependencies (`pnpm`)
3.  **Static Analysis**: Lint + Typecheck
4.  **Fast Tests**: Vitest (Unit + Convex Integration) + Coverage
5.  **Slow Tests**: Playwright (E2E) - *Only on PRs or Master push*
6.  **Reporting**: Parse `coverage/lcov.info` -> Post PR Comment -> Update Badge

---

## Technical Decisions

### Decision: Vitest over Jest
-   **Options considered**: Jest, Vitest
-   **Chosen**: Vitest
-   **Rationale**: Native ESM support (crucial for modern Next.js/Convex), faster watch mode, shares config with Vite (if used later). Jest configuration with Next.js TS is historically painful.

### Decision: `convex-test` over Network Mocking
-   **Options considered**: Mocking `fetch` within mutations, `convex-test` library
-   **Chosen**: `convex-test`
-   **Rationale**: `convex-test` spins up a local, in-memory version of the Convex database engine. It tests the *actual* logic including schema validation and indexes, rather than just testing mocks.

### Decision: GitHub Actions for Coverage Reporting
-   **Options considered**: Codecov, Coveralls, Custom Action
-   **Chosen**: Custom Action
-   **Rationale**: Keeps the stack "Free & Easy". No third-party tokens to manage. We simply parse the `lcov` report and use the `actions/github-script` to post a markdown table.

---

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── test.yml           # Main CI pipeline
├── tests/
│   ├── setup.ts               # Vitest setup (DOM matchers)
│   └── convex.ts              # Convex backend test factory
├── components/
│   └── __tests__/             # Component unit tests
│       └── MonitorCard.test.tsx
├── convex/
│   └── __tests__/             # Backend integration tests
│       └── monitors.test.ts
├── e2e/
│   ├── example.spec.ts
│   └── playwright.config.ts
└── vitest.config.ts           # Test runner config
```

## Implementation Plan

### 1. Install Dependencies
`pnpm add -D vitest @testing-library/react @testing-library/dom jsdom @vitejs/plugin-react convex-test @playwright/test`

### 2. Configure Vitest
Create `vitest.config.ts` and `tests/setup.ts` with necessary polyfills (Next.js often needs `ResizeObserver` mocked).

### 3. Configure Playwright
Initialize Playwright: `pnpm create playwright`.

### 4. Create Backend Test Helper
Implement `tests/convex.ts` exporting the test factory.

### 5. Write Initial Tests
-   Unit: `StatusIndicator` (pure component)
-   Backend: `monitors:create` (mutation)
-   E2E: Visit landing page (smoke test)

### 6. Setup CI
Create `.github/workflows/test.yml`.

## Testing Strategy

-   **Unit Tests**: Focus on pure UI components (`StatusIndicator`, `UptimeBar`) and utility hooks. Mock `useQuery`/`useMutation`.
-   **Backend Tests**: Focus on business logic in `convex/`. Ensure permissions (auth) are enforced by passing mock identity to `convex-test`.
-   **E2E Tests**: Smoke test the "Critical Path": User loads page -> sees dashboard.

## Open Questions
-   **Auth Mocking in E2E**: Since we use Clerk, real E2E login is hard.
    -   *Strategy*: We will start with unauthenticated E2E (Marketing pages) and mock authenticated states via `page.addInitScript` to inject Clerk session tokens if possible, or stick to backend testing for auth logic for now.

## Dependencies
-   `vitest`: Runner
-   `jsdom`: Browser environment for unit tests
-   `convex-test`: Backend simulation
-   `@playwright/test`: Browser automation
