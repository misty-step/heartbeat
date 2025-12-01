## Testing

We use a comprehensive testing suite to ensure quality.

### Unit & Integration Tests

We use **Vitest** for unit tests (components) and integration tests (Convex backend).

```bash
# Run all unit/integration tests
pnpm vitest

# Run with coverage report
pnpm vitest run --coverage

# Run tests in UI mode
pnpm vitest --ui
```

### End-to-End (E2E) Tests

We use **Playwright** for critical user journeys.

```bash
# Run E2E tests (headless)
pnpm playwright test

# Run E2E tests with UI
pnpm playwright test --ui

# Run E2E tests against local dev server (ensure pnpm dev is NOT running, Playwright will start it)
CI=true pnpm playwright test
```

### Writing Tests

- **Components**: Place in `components/__tests__/<Component>.test.tsx`. Use `@testing-library/react`.
- **Backend**: Place in `convex/__tests__/<module>.test.ts`. Use `setupBackend()` from `tests/convex.ts`.
- **E2E**: Place in `e2e/<flow>.spec.ts`. Use `test` from `@playwright/test`.
