import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "components/**/*.test.{ts,tsx}",
      "convex/**/*.test.{ts,tsx}",
      "hooks/**/*.test.{ts,tsx}",
      "lib/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    // Coverage configuration
    coverage: {
      provider: "v8", // Use v8 coverage provider (built-in)
      reporter: ["text", "lcov", "json-summary"], // Report as text summary, lcov file, and json summary
      include: [
        "components/**/*.tsx",
        "app/**/*.tsx",
        "hooks/**/*.ts",
        "convex/**/*.ts",
        "lib/**/*.ts", // Include logger and other lib modules
      ],
      exclude: [
        "**/_generated/**", // Exclude Convex generated code
        "**/*.test.ts", // Exclude test files themselves
        "**/*.test.tsx", // Exclude test files themselves
        "**/index.ts", // Barrel files (re-exports only)
        "e2e/**", // Exclude Playwright E2E tests
        "convex/schema.ts", // Schema definitions are not executable code
        "convex/crons.ts", // Crons are external triggers, not testable directly for coverage
        "convex/migrations.ts", // Manual backfill script, covered via integration when executed
        "convex/monitoring.ts", // Action-based HTTP monitoring - requires runtime, tested via e2e
        "convex/http.ts", // HTTP action for Stripe webhooks - requires signature verification, tested via e2e
        "convex/notifications.ts", // Action-based notification sending - external API (Resend), tested via e2e
        "convex/lib/email.ts", // Email sending requires Resend runtime - tested via e2e
        "convex/auth.config.ts", // Auth config is external setup
        "app/layout.tsx", // Root layout often contains providers/metadata not easily testable
        "app/providers.tsx", // Providers are integration points, covered by e2e/integration
        "app/dashboard/**", // Dashboard pages are containers with auth/query wiring - tested via e2e
        "app/privacy/**", // Static content pages
        "app/terms/**", // Static content pages
        "app/s/**", // Status pages are SSR containers - tested via e2e
        "app/status/**", // Individual status pages (ISR) - async server components
        "middleware.ts", // Edge middleware is not typically unit tested in JSDOM
        "components/MonitorSettingsModal.tsx", // Large UI surface exercised via e2e
        "components/AddMonitorForm.tsx", // Form wiring covered in higher-level tests
        "components/UptimeChart.tsx", // Charting relies on Recharts runtime, better suited for visual tests
        "components/DashboardMonitorCard.tsx", // Container component with useQuery - tested via e2e
        "components/DashboardNavbar.tsx", // Navigation component - tested via e2e
        "components/LiveMonitorPreview.tsx", // Demo component with setInterval - visual testing
        "app/global-error.tsx", // Sentry error boundary, tested via e2e
        "sentry.*.config.ts", // Sentry configuration, not executable logic
        "instrumentation.ts", // Next.js instrumentation hook, not testable in JSDOM
        "lib/logger/client.ts", // Client logger uses mocked dependencies in tests
        "lib/logger/server.ts", // Server logger uses mocked dependencies in tests
        "lib/convex-public.ts", // ISR infrastructure wrapper - integration tested via e2e
        "app/design-lab/**", // Design exploration pages - visual review, not unit tested
        "components/landing/**", // Landing page presentational components - visual review
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
