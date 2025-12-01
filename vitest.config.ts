import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8', // Use v8 coverage provider (built-in)
      reporter: ['text', 'lcov'], // Report as text summary and lcov file
      include: [
        'components/**/*.tsx',
        'app/**/*.tsx',
        'hooks/**/*.ts',
        'convex/**/*.ts',
      ],
      exclude: [
        '**/_generated/**', // Exclude Convex generated code
        '**/*.test.ts', // Exclude test files themselves
        '**/*.test.tsx', // Exclude test files themselves
        'convex/schema.ts', // Schema definitions are not executable code
        'convex/crons.ts', // Crons are external triggers, not testable directly for coverage
        'convex/auth.config.ts', // Auth config is external setup
        'app/layout.tsx', // Root layout often contains providers/metadata not easily testable
        'app/providers.tsx', // Providers are integration points, covered by e2e/integration
        'middleware.ts', // Edge middleware is not typically unit tested in JSDOM
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
});
