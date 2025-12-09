# Heartbeat - Project Context

## Project Overview

**Heartbeat** is a "set and forget" uptime monitoring service. It provides real-time HTTP monitoring, public status pages, and incident tracking.

**Core Technology Stack:**

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4 (using `@theme` in `globals.css`)
- **Backend & Database:** Convex (Serverless functions + Real-time DB + Crons)
- **Authentication:** Clerk
- **Testing:** Vitest (Unit/Integration), Playwright (E2E)

## Architecture

The project follows a **Monorepo-style** structure where frontend and backend coexist but are distinct.

- **Frontend (`app/`, `components/`)**:
  - Uses Next.js App Router.
  - `app/dashboard`: Authenticated user interface.
  - `app/s/[slug]`: Publicly accessible status pages (ISR cached).
  - **Design Philosophy**: "Editorial Minimal". High-contrast typography (Serif headings, Mono data), generous whitespace, "medical precision" aesthetics (EKG grids, status dots).

- **Backend (`convex/`)**:
  - **`schema.ts`**: Defines the data model (`monitors`, `checks`, `incidents`).
  - **`crons.ts`**: Schedules the 1-minute monitoring job.
  - **`monitoring.ts`**: The core engine that performs HTTP checks.
  - **`monitors.ts`, `checks.ts`, `incidents.ts`**: CRUD and query modules.

## Building and Running

### Prerequisites

- Node.js 18.17+
- pnpm
- Convex & Clerk accounts (see `README.md` for env setup)

### Key Commands

```bash
# Start Development Server (Runs Next.js + Convex concurrently)
pnpm dev

# Start Services Individually
pnpm dev:next    # Next.js only
pnpm dev:convex  # Convex only

# Type Checking
pnpm type-check

# Linting
pnpm lint

# Testing
pnpm test          # Run Vitest (Unit/Integration)
pnpm test:e2e      # Run Playwright (End-to-End)
```

## Development Conventions

### Code Style

- **Strict Typing**: No `any`. Use `zod` for validation where applicable.
- **Functional**: Prefer pure functions and immutable data patterns.
- **Convex-First**: Move logic to the backend (Convex functions) whenever it involves data persistence or complex state.

### Design System ("Editorial Minimal")

- **Typography**:
  - Use `font-serif` for headings and "editorial" statements.
  - Use `font-mono` for data, IDs, and technical details.
  - Use `font-sans` for UI body text.
- **Visuals**:
  - **Status Indicators**: Use `StatusIndicator` component.
  - **Backgrounds**: Use `hero-grid` or subtle gradients.
  - **Colors**: Semantic status colors (Up=Black/White+Glow, Down=Red, Degraded=Orange).

### Testing Strategy

- **Unit**: Test components in `components/__tests__/`.
- **Integration**: Test Convex functions in `convex/__tests__/` using `convex-test`.
- **E2E**: Critical flows (Sign up, Create Monitor, View Status) in `e2e/`.

### Directory Structure

- `app/`: Next.js pages and layouts.
- `components/`: Reusable React components.
- `convex/`: Backend logic and schema.
- `lib/`: Shared utilities (domain logic, formatting).
- `e2e/`: Playwright tests.
- `tests/`: Test setup files (`convex.ts`, `setup.ts`).
