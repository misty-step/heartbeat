# PRD: Automated Quality Assurance Suite

## Summary
Implement a comprehensive testing strategy including Unit, Integration, and End-to-End (E2E) tests with automated coverage reporting and enforcement to ensure code quality and prevent regressions as the product scales.

## Context

### Problem Statement
The `heartbeat` project has graduated from MVP to a functional product. However, it lacks automated testing. Refactoring features (like the upcoming "Custom Domains" or "Cloudflare Workers" migration) carries high risk of breaking existing functionality. The developer lacks visibility into code quality and regression status during PRs.

### User Benefit
- **Confidence**: Refactor and ship features without fear of breaking core uptime monitoring.
- **Visibility**: Immediate feedback on code quality via PR comments and README badges.
- **Enforcement**: Prevent "lazy commits" that degrade code quality over time.

### Success Metrics
- **Coverage**: >80% Unit/Integration coverage enforced on new code.
- **Reliability**: CI pipeline catches 100% of syntax/type errors and failing tests before merge.
- **Visibility**: Every PR receives a coverage comment; README shows current coverage badge.

## Requirements

### Must Have (P0)
- [ ] **Unit/Integration Framework**: Vitest set up for React components and generic logic.
- [ ] **Backend Testing**: `convex-test` set up for testing Convex queries/mutations in isolation.
- [ ] **E2E Framework**: Playwright set up for critical user flows (Login -> Dashboard -> Create Monitor).
- [ ] **Coverage Generation**: Generate `lcov` reports via Vitest.
- [ ] **CI Integration**: GitHub Actions workflow running all tests on push/PR.
- [ ] **Coverage Enforcement**: CI fails if global coverage drops below 80% (or defined threshold).
- [ ] **PR Reporting**: GitHub Action posts coverage summary comment on PRs.
- [ ] **README Badge**: GitHub Action updates a coverage badge in `README.md`.

### Should Have (P1)
- [ ] **E2E Smoke Test**: Run against a preview deployment (if available) or local dev server.
- [ ] **Component Testing**: Testing specifically for the "Status Page" visuals (critical for user trust).

### Could Have (P2)
- [ ] **Visual Regression Testing**: Playwright snapshots for the dashboard and status pages.
- [ ] **Flaky Test Detection**: Automatic retries for known flaky E2E tests.

## User Experience

### Developer Flow
1.  **Local Dev**: Developer runs `pnpm test` for fast unit tests or `pnpm test:e2e` for flows.
2.  **Commit**: Pre-commit hook (husky) runs fast unit tests (Optional, maybe too heavy for now).
3.  **Push/PR**: GitHub Action triggers.
    -   Runs `pnpm lint` & `pnpm type-check`.
    -   Runs `pnpm test:coverage`.
    -   Runs `pnpm test:e2e`.
4.  **Feedback**:
    -   If tests fail → CI Red ❌.
    -   If coverage < threshold → CI Red ❌.
    -   If success → CI Green ✅, Bot comments on PR with coverage breakdown.
5.  **Merge**: `README.md` badge updates to reflect `master` coverage.

## Technical Constraints

### Stack Requirements
-   **Test Runner**: Vitest (Fast, compatible with modern ecosystem).
-   **DOM Testing**: React Testing Library.
-   **Backend**: `convex-test` (Official Convex testing library).
-   **E2E**: Playwright (Industry standard).
-   **CI**: GitHub Actions.

### Coverage Reporting (No Codecov)
-   Use `vitest --coverage` (v8 provider).
-   Use a custom or open-source GitHub Action to parse `coverage/lcov.info` and:
    1.  Post PR comment.
    2.  Update dynamic badge (Shields.io JSON endpoint or direct README text replacement).

### Performance
-   Unit tests should run in < 10s.
-   Full CI suite should run in < 5 mins.

## Out of Scope
-   **SaaS Coverage Services**: No Codecov, Coveralls, etc. Self-hosted/Action-based only.
-   **Load Testing**: Not needed yet.

## Questions
-   **Convex Mocking**: Do we test against a real local Convex instance or mock the network? *Decision: Use `convex-test` which runs against a real backend in isolation or mocks.*
-   **Auth E2E**: How to bypass Clerk in E2E? *Answer: Use Clerk testing tokens or a "Testing Mode" in Convex if necessary, or just mock the auth state in component tests.*

## Timeline
-   **Target**: Immediate (Next Task).
-   **Effort**: M (1-2 days).
