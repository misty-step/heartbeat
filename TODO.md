# TODO: Automated QA Suite

## Phase 0: Foundation & Configuration (Early Wins)
- [x] **Install Dependencies** <!-- est: 10m, deps: none -->
  - Run `pnpm add -D vitest @testing-library/react @testing-library/dom jsdom @vitejs/plugin-react convex-test @playwright/test`
  - Success criteria: `package.json` updated, no peer dep warnings.

- [x] **Configure Vitest** <!-- est: 20m, deps: Phase 0.1 -->
  - Create `vitest.config.ts` with `jsdom` env and coverage settings.
  - Create `tests/setup.ts` to polyfill `ResizeObserver` (needed for Recharts).
  - Success criteria: `pnpm vitest --version` runs without error.

- [x] **Initialize Playwright** <!-- est: 10m, deps: Phase 0.1 -->
  - Run `pnpm create playwright`.
  - Configure `playwright.config.ts` (set `baseURL: 'http://localhost:3000'`).
  - Success criteria: `e2e/example.spec.ts` exists.

## Phase 1: Testing Infrastructure
- [x] **Backend Test Factory** <!-- est: 45m, deps: Phase 0 -->
  - Create `tests/convex.ts`.
  - Implement `setupBackend()` wrapper around `convex-test`.
  - Success criteria: Can import `setupBackend` in a test file.

- [x] **First Backend Test (Monitors)** <!-- est: 1h, deps: Phase 1.1 -->
  - Create `convex/__tests__/monitors.test.ts`.
  - Test `monitors.create` mutation (happy path).
  - Test `monitors.list` query (data retrieval).
  - Success criteria: `pnpm vitest` passes with 1 test suite.

- [x] **First Unit Test (Components)** <!-- est: 1h, deps: Phase 0 -->
  - Create `components/__tests__/StatusIndicator.test.tsx`.
  - Test rendering with different status props (up, down, degraded).
  - Success criteria: `pnpm vitest` passes with component tests.

## Phase 2: Critical Path Coverage
- [x] **E2E Smoke Test** <!-- est: 2h, deps: Phase 0 -->
  - Create `e2e/smoke.spec.ts`.
  - Test: Load Homepage -> Check for "Heartbeat" text.
  - Test: Navigate to /terms -> Check content.
  - Success criteria: `pnpm playwright test` passes against local dev server.

- [x] **Critical Flow: Monitor Creation (Backend)** <!-- est: 2h, deps: Phase 1.2 -->
  - Expand `convex/__tests__/monitors.test.ts`.
  - Test validation logic (invalid URL, missing fields).
  - Test auth protection (ensure unauthorized users can't create).
  - Success criteria: High coverage on `convex/monitors.ts`.

## Phase 3: CI/CD & Enforcement
- [ ] **GitHub Actions Workflow** <!-- est: 1h, deps: Phase 1, Phase 2 -->
  - Create `.github/workflows/test.yml`.
  - Steps: Checkout -> Install -> Lint -> Typecheck -> Vitest (with coverage) -> Playwright.
  - Success criteria: Push to branch triggers green build.

- [ ] **Coverage Reporting Script** <!-- est: 2h, deps: Phase 3.1 -->
  - Add step to `test.yml` to parse `coverage/lcov.info`.
  - Use `actions/github-script` to post PR comment with coverage summary.
  - Success criteria: PR gets a comment with a markdown table.

- [ ] **README Badge Integration** <!-- est: 1h, deps: Phase 3.1 -->
  - Add step to update `README.md` regex match with new coverage %.
  - Commit back to repo (if on master) or use gist badge.
  - Success criteria: README shows "Coverage: XX%".

## Phase 4: Documentation
- [ ] **Update Contributing Guide** <!-- est: 30m, deps: all -->
  - Add `TESTING.md` or update `README.md`.
  - Document commands: `pnpm test`, `pnpm test:e2e`.
  - Success criteria: New dev knows how to run tests.