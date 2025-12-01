# Repository Guidelines

## Project Structure & Module Organization
- `app/` Next.js App Router pages: marketing `page.tsx`, auth’d `dashboard/`, public status `s/[slug]/`, shared layout/providers/fonts, styles in `globals.css`.
- `components/` UI building blocks (cards, charts, timelines, nav, theme toggle). Keep presentational; fetch or mutate data in parents.
- `convex/` backend schema + actions (`monitors.ts`, `monitoring.ts`, `checks.ts`, `incidents.ts`), cron scheduling in `crons.ts`, Clerk auth config in `auth.config.ts`, generated types in `_generated/`.
- `hooks/` custom React hooks (`useScrollAnimation.ts`).  
- `public/` static assets. Config: `next.config.ts`, `tsconfig.json` (alias `@/*`), `postcss.config.mjs`, `tailwind` lives in CSS-first classes.

## Build, Test, and Development Commands
- `pnpm install` (Node >=18.17).  
- `pnpm dev` runs Next (Turbopack) + Convex together; or split via `pnpm dev:next` and `pnpm dev:convex`.
- `pnpm lint`, `pnpm type-check` must pass before PR.  
- `pnpm build` → production bundle; `pnpm start` serves it.  
- Convex ops: `pnpm convex dev` (generates `_generated/` types), `pnpm convex deploy`, `pnpm convex dashboard`.  
- Requires `.env.local` with Convex + Clerk keys (see README). Never commit secrets.

## Coding Style & Naming Conventions
- TypeScript strict; 2-space indent; favor pure components/server actions over prop-drilling.  
- Tailwind CSS v4 utilities; keep styling close to components, avoid bespoke globals unless shared.  
- Names: components PascalCase, hooks `useThing`, routes/folders kebab-case, Convex functions verb-first (e.g., `createMonitor`).  
- Prefer deep modules: hide Convex details behind minimal interfaces; avoid pass-throughs and “Manager/Helper” blobs; keep props small and intentional.  
- Imports: use `@/...` alias instead of long relative chains.

## Testing Guidelines
- No harness yet—add tests alongside code as `<name>.test.tsx` using Vitest + React Testing Library or Playwright for flows.  
- Target 80% patch coverage; prioritize branch coverage on cron logic (timeouts, incident thresholds) and auth guards.  
- Always run `pnpm lint` + `pnpm type-check`; note any skipped cases in PR.

## Commit & Pull Request Guidelines
- Follow conventional commits (`feat|fix|refactor|docs: summary`) as in git history.  
- Keep PRs small (aim 50–200 LOC); describe scope, link issue/task, list commands run, include screenshots for UI changes, and call out shortcuts/debt.  
- Protect secrets; include rollout notes for Convex/Clerk changes when relevant.
