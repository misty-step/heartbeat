# TODO: Heartbeat MVP Implementation

Strategic implementation following Ousterhout's deep module principles. Each task is atomic, actionable, and builds toward "set and forget" uptime monitoring that replaces UptimeRobot for personal dogfooding.

---

## Phase 1: Core Infrastructure & Foundation

### Project Scaffolding

- [x] **Initialize Next.js 15 project with TypeScript**
  - Run `pnpm create next-app@latest heartbeat --typescript --tailwind --app --use-pnpm`
  - Select options: App Router, TypeScript, Tailwind CSS, no src/ directory
  - Success criteria: `pnpm dev` starts development server on port 3000

- [x] **Configure package.json with project metadata**
  - Set name: `"heartbeat"`, version: `"0.1.0"`, description: `"Set and forget uptime monitoring"`
  - Add scripts: `"dev"`, `"build"`, `"start"`, `"lint"`, `"type-check"`
  - Success criteria: All scripts execute without errors

- [x] **Install core dependencies**
  - Run `pnpm add convex@latest @clerk/nextjs@latest geist lucide-react recharts framer-motion resend`
  - Run `pnpm add -D @types/node typescript @convex-dev/cli`
  - Success criteria: All packages install without peer dependency warnings

### Design System Configuration

- [x] **Configure Tailwind CSS 4 with custom @theme tokens**
  - Create `app/globals.css` with @theme directive defining color palette, typography, spacing, animations
  - Define CSS variables: `--color-background`, `--color-surface`, `--color-success`, `--color-warning`, `--color-error`, `--color-text-*`
  - Add dark mode support with `@media (prefers-color-scheme: dark)` block
  - Define `--font-family-sans: "Geist Sans"` and `--font-family-mono: "Geist Mono"`
  - Success criteria: Variables accessible in Tailwind classes, dark mode toggles automatically

- [x] **Create tailwind.config.ts with extended theme**
  - Extend animations: `pulse` keyframe (3s cubic-bezier, opacity 0.4→0.1→0.4, scale 1→1.5→1)
  - Add custom colors mapping to CSS variables: `success`, `warning`, `error`, `surface`, `border`
  - Configure fontFamily: `sans: ["var(--font-geist-sans)"]`, `mono: ["var(--font-geist-mono)"]`
  - Set content paths: `["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"]`
  - Success criteria: Tailwind classes like `text-success`, `font-mono`, `animate-pulse` work in components

- [x] **Configure Geist fonts in root layout**
  - Import `GeistSans` and `GeistMono` from `"geist/font/sans"` and `"geist/font/mono"`
  - Apply to html: `className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}`
  - Set CSS variables: `--font-geist-sans` and `--font-geist-mono`
  - Success criteria: Fonts render with proper antialiasing, variable fonts load without FOUT

### Convex Backend Setup

- [x] **Define Convex schema (all tables)**
  - Created `convex/schema.ts` with complete schema
  - `monitors` table: name, url, method, interval, timeout, expectedStatusCode, expectedBodyContains, headers, body, enabled, projectSlug, userId, consecutiveFailures, lastCheckAt, lastResponseTime, createdAt, updatedAt
  - `checks` table: monitorId, status (up/down/degraded), statusCode, responseTime, errorMessage, checkedAt
  - `incidents` table: monitorId, status (investigating/identified/resolved), startedAt, resolvedAt, title, description, notifiedAt
  - Indexes optimized for queries: by_user, by_project_slug, by_enabled, by_monitor, by_status
  - Success criteria: Schema complete, ready for codegen when user runs `pnpm convex dev`

- [x] **Create Convex environment configuration**
  - Created `.env.local` with placeholder values for CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL
  - Added Clerk and Resend placeholders
  - Note: User needs to run `pnpm convex dev` to get real deployment URL and update .env.local
  - Success criteria: Structure ready, waiting for real Convex project initialization

### Authentication Integration

- [x] **Configure Clerk authentication**
  - Created `middleware.ts` with clerkMiddleware protecting non-public routes
  - Public routes: `/`, `/status(.*)`, `/sign-in(.*)`, `/sign-up(.*)`
  - Protected routes: dashboard and settings (require authentication)
  - Success criteria: Middleware configured, ready for Clerk keys

- [x] **Create Clerk provider wrapper in root layout**
  - Created `app/providers.tsx` with ClerkProvider and ConvexProviderWithClerk
  - Wrapped app in `app/layout.tsx` with Providers component
  - Success criteria: Provider structure ready, waiting for Clerk keys

- [x] **Integrate Convex with Clerk authentication**
  - Created `convex/auth.config.ts` with Clerk JWT configuration
  - All mutations use `ctx.auth.getUserIdentity()` for authorization
  - Internal queries/mutations bypass auth for cron/monitoring engine
  - Success criteria: Auth integration complete, waiting for CLERK_JWT_ISSUER_DOMAIN

---

## Phase 2: Data Layer & Business Logic ✅

### Core Queries & Mutations

- [x] **Create monitors.ts queries and mutations**
  - Created `convex/monitors.ts` with complete CRUD operations
  - Queries: `list` (by user), `get` (by ID with auth), `getByProjectSlug` (public), `getInternal` (for monitoring engine)
  - Mutations: `create`, `update`, `remove` - all with proper authorization
  - Success criteria: All operations enforce user ownership, real-time subscriptions ready

- [x] **Create checks.ts queries**
  - Created `convex/checks.ts` with history and analytics queries
  - `getRecentForMonitor`: Fetch recent checks with configurable limit (default 50)
  - `getUptimeStats`: Calculate uptime %, success/failure counts, avg response time over 30 days
  - Success criteria: Efficient time-series queries with by_monitor index

- [x] **Create incidents.ts queries**
  - Created `convex/incidents.ts` with incident retrieval
  - `getForMonitor`: Fetch incident history for specific monitor
  - `getForProject`: Fetch incidents by project slug with status filtering
  - `getOpenIncidents`: Fetch all active incidents
  - Success criteria: Optimized for status page display

### Monitoring Engine Core Logic

- [x] **Complete monitoring engine implementation**
  - Created `convex/monitoring.ts` with full check orchestration
  - `getDueMonitors`: Query enabled monitors ready for checking based on interval
  - `recordCheck`: Persist check results (status, response time, errors)
  - `updateMonitorStatus`: Track consecutive failures, trigger state transitions (up → degraded → down)
  - `openIncident`: Create incident on 3rd consecutive failure, prevent duplicates
  - `resolveIncident`: Mark incident resolved when monitor recovers
  - `checkMonitor`: Execute HTTP check with AbortController timeout, measure response time, validate status/body
  - `runHeartbeat`: Main cron action, checks all due monitors in parallel with Promise.allSettled
  - `cleanupOldChecks`: Daily cleanup of checks older than 30 days (with helper queries/mutations)
  - Success criteria: Complete monitoring engine, isolated failures, atomic state transitions

- [ ] **Future enhancement: False positive mitigation with retry**
  - Note: Current implementation requires 3 consecutive failures before incident
  - Future: Add immediate 10s retry on first failure for transient network blips
  - Deferred to post-MVP based on real-world false positive rates

### Cron Scheduling

- [x] **Configure Convex cron jobs**
  - Created `convex/crons.ts` with automated scheduling
  - `heartbeat`: Runs every minute to check all due monitors
  - `cleanup-old-checks`: Runs daily at 2 AM UTC to remove checks older than 30 days
  - Success criteria: Automated monitoring engine, no manual intervention required

---

## Phase 3: Presentation Layer - Components

### Core UI Components (Status Pages)

- [x] **Create StatusIndicator component with breathing dot animation**
  - Created `components/StatusIndicator.tsx` (commit: a5430c3)
  - Breathing pulse animation only for "up" status (3s cycle, opacity 0.4)
  - Color mapping: up=success, degraded=warning, down=error, unknown=text-tertiary
  - Base dot (h-3 w-3) + animated outer ring with absolute positioning
  - Success criteria: ✅ Smooth animation, semantic colors, refined minimal aesthetic

- [x] **Create MonitorCard component for status pages**
  - Created `components/MonitorCard.tsx` (commit: 515792f)
  - Horizontal flex layout with StatusIndicator, name, response time, status text
  - Hover state with surface-hover background transition
  - Response time in monospace with tabular-nums for alignment
  - Success criteria: ✅ Clean display, hover feedback smooth, text truncation for long names

- [x] **Create StatusHeader component for status pages**
  - Created `components/StatusHeader.tsx` (commit: 7e055a1)
  - Project name as h1 heading with large StatusIndicator
  - Status-specific messaging (operational/degraded/down/unknown)
  - Relative timestamp formatting ("Just now", "5 minutes ago", etc.)
  - Success criteria: ✅ Trust-focused design, clear messaging, readable timestamps

- [x] **Create UptimeChart component with sparkline visualization**
  - Created `components/UptimeChart.tsx` (commit: 1d8fdde)
  - Two-layer visualization: Recharts AreaChart sparkline + status bar
  - Gradient fill from success color with opacity fade
  - Status bar shows up/down periods as colored blocks with hover tooltips
  - Success criteria: ✅ Response time trends visible, downtime gaps clear, responsive

- [x] **Create IncidentTimeline component**
  - Created `components/IncidentTimeline.tsx` (commit: 32561de)
  - Timeline layout with border-l visual hierarchy
  - Status badges with semantic colors (investigating/identified/monitoring/resolved)
  - Duration calculation (minutes/hours format) with timestamp formatting
  - Nested updates with secondary border for visual depth
  - Success criteria: ✅ Timeline readable, clear status progression, empty state handled

### Form Components

- [x] **Create AddMonitorForm component**
  - Created `components/AddMonitorForm.tsx` (commit: 8e80539)
  - Form fields: URL, Name, Project Slug (auto-generated from name), Check Interval
  - Removed redundant projectName field (never used by backend)
  - URL/slug validation with inline errors, success toast with auto-hide
  - Uses `useMutation(api.monitors.create)`, clears form on success
  - Simplifications: INITIAL_FORM_DATA DRY, updateField helper, useEffect cleanup
  - Success criteria: ✅ Form validates, inline errors clear, mutation succeeds, UX simplified

- [x] **Create MonitorSettingsModal component**
  - Created `components/MonitorSettingsModal.tsx` (commit: 36ff9bb)
  - Editable fields: name, URL, interval, timeout (seconds), expected status code
  - Update and delete mutations with validation
  - Native browser confirm() for delete (simpler than custom overlay)
  - Backdrop click to close, general error banner
  - Simplifications: timeout stored in seconds, consistent field updates, HTML5 validation
  - Success criteria: ✅ Saves immediately, modal dismisses, confirmation prevents accidental deletes

---

## Phase 4: Presentation Layer - Pages

### Status Page Route

- [x] **Create status page route at app/s/[slug]/page.tsx**
  - Created `app/s/[slug]/page.tsx` (commit: 6e706d2)
  - Dynamic route fetches monitors via fetchQuery(api.monitors.getByProjectSlug)
  - Returns 404 with notFound() if no monitors found
  - Status derivation: getMonitorStatus() converts consecutiveFailures → status
  - Overall status: priority-based aggregation (down > degraded > operational)
  - Simplifications: single source of truth, O(n) computation, STATUS_COLORS lookup
  - Success criteria: ✅ Server component renders, 404 handled, status logic clean

- [x] **Implement ISR configuration for status pages**
  - Added ISR exports to `app/s/[slug]/page.tsx` (commit: 6369c59)
  - revalidate = 60: Edge caching with 60s revalidation
  - dynamicParams = true: Supports any project slug
  - generateStaticParams(): Empty array (on-demand ISR), TODO for analytics-driven pre-rendering
  - Success criteria: ✅ Pages cached at edge, 60s revalidation, all slugs work

- [x] **Add status page layout with StatusHeader, MonitorCards, UptimeChart, IncidentTimeline**
  - Compose components: `<StatusHeader /> <main><section>MonitorCards</section> <section>UptimeChart</section> <section>IncidentTimeline</section></main>`
  - Container: `max-w-4xl mx-auto px-6 py-12`
  - Spacing: `mt-16` between sections (generous whitespace)
  - Success criteria: Layout matches Linear status page aesthetic, breathing room between sections

- [x] **Implement status page mobile responsiveness**
  - StatusHeader: full-width sticky, larger touch target for mobile nav
  - MonitorCards: stack vertically, full width with padding
  - UptimeChart: horizontal scroll with visible scroll indicator
  - IncidentTimeline: single column, simplified on mobile
  - Success criteria: Usable on 375px width (iPhone SE), touch targets ≥44px, no horizontal scroll

### Dashboard Route

- [ ] **Create dashboard page at app/dashboard/page.tsx**
  - Client component (`"use client"`) for real-time subscriptions
  - Use `useQuery(api.monitors.list)` to fetch monitors with live updates
  - Show loading skeleton while data fetches
  - Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile
  - Success criteria: Dashboard updates in real-time when monitor status changes, no loading flicker

- [ ] **Create DashboardMonitorCard component**
  - File: `components/DashboardMonitorCard.tsx`
  - Props: `monitor: Monitor`
  - Display: StatusIndicator, name, projectName, uptime % (calculate from checks), current status
  - Click to expand: show recent checks, response time trend
  - Actions: Edit button (opens settings modal), Manual check button
  - Success criteria: Card shows all relevant info, click-to-expand smooth, actions work

- [ ] **Implement dashboard real-time status updates**
  - Use Convex `useQuery` subscription: automatically re-renders when monitor status changes
  - Animate status transitions: fade out old status, fade in new (Framer Motion)
  - Show notification toast when monitor goes down/up
  - Success criteria: Status updates appear within 2s of check completing, animations smooth

### Marketing Page

- [ ] **Create marketing home page at app/page.tsx**
  - Hero section: Large heading (text-6xl) "Set and forget uptime monitoring", subheading, CTA button
  - Features section: 3 cards (Beautiful status pages, Reliable checks, Simple setup)
  - Screenshot section: Image of status page (use next/image with priority)
  - Footer: Links to docs, status, GitHub
  - Success criteria: Page loads in <2s, LCP <2.5s, CLS <0.1

- [ ] **Style marketing page with refined minimal aesthetic**
  - Hero: gradient background (`linear-gradient(to bottom, surface, background)`), centered text
  - Features: card grid with subtle hover lift (`hover:translate-y-[-2px]`)
  - Typography: generous line-height (1.6), text-balance for headings
  - Dark mode: default, subtle contrast adjustments
  - Success criteria: Page feels premium, typography readable, spacing generous

---

## Phase 5: Integration Layer

### Email Notifications

- [ ] **Configure Resend API**
  - Sign up at resend.com, create API key
  - Add to `.env.local`: `RESEND_API_KEY`
  - Create verified sender email: `noreply@heartbeat.engineering` or use personal domain
  - Success criteria: Can send test email via Resend API

- [ ] **Create email template: Monitor Down**
  - File: `emails/MonitorDown.tsx`
  - Use React Email component
  - Content: Monitor name, URL, time detected, link to status page
  - Styling: inline CSS, mobile-responsive, plain text fallback
  - Success criteria: Email renders correctly in Gmail, Outlook, Apple Mail

- [ ] **Create email template: Monitor Resolved**
  - File: `emails/MonitorResolved.tsx`
  - Content: Monitor name, downtime duration, time resolved, link to status page
  - Styling: success green accent color, celebratory but professional tone
  - Success criteria: Email clearly communicates resolution, duration formatted properly

- [ ] **Implement email sending in monitoring.ts**
  - Import Resend client in action context
  - In `openIncident` mutation, schedule email action: `ctx.scheduler.runAfter(0, internal.monitoring.sendDownEmail, { monitorId })`
  - In `resolveIncident` mutation, schedule email action: `ctx.scheduler.runAfter(0, internal.monitoring.sendResolvedEmail, { monitorId })`
  - Action implementation: fetch monitor + incident, render email template, call Resend API
  - Success criteria: Emails sent within 10s of incident state change, no duplicate sends

### Testing Utilities

- [ ] **Create test monitor URLs for validation**
  - Document test URLs in README: `httpstat.us/200` (always up), `httpstat.us/500` (always down), `httpstat.us/random/200,500` (flaky)
  - Create seed script: `convex/seed.ts` to populate test monitors
  - Success criteria: Can quickly validate monitoring engine with known-good and known-bad URLs

- [ ] **Add logging for monitoring actions**
  - Use `console.log` in Convex actions for debugging (visible in convex dashboard)
  - Log: monitor checked, status determined, incident opened/resolved, email sent
  - Format: `[Monitor:${monitorId}] Checked ${url} -> ${statusCode} (${responseTime}ms)`
  - Success criteria: Can debug monitoring issues via Convex logs, no PII logged

---

## Phase 6: Refinement & Polish

### Error Handling

- [ ] **Add error boundaries to React components**
  - Create `components/ErrorBoundary.tsx` with fallback UI
  - Wrap dashboard and status pages with error boundary
  - Fallback: "Something went wrong" message + reload button
  - Success criteria: App doesn't crash on render errors, user can recover

- [ ] **Implement graceful degradation for Convex failures**
  - Use `useQuery` with `{ retry: 3, retryDelay: 1000 }`
  - Show cached data with "offline" indicator if query fails
  - Disable mutations when offline
  - Success criteria: App remains usable during transient Convex outages

- [ ] **Add user-facing error messages**
  - Form validation errors: show inline below field
  - Mutation errors: show toast notification with actionable message
  - 404 pages: custom design matching app aesthetic
  - Success criteria: Users understand what went wrong and how to fix it

### Performance Optimization

- [ ] **Optimize Next.js images**
  - Use `next/image` for all images with `width`, `height`, `alt`
  - Add `priority` to hero image, `loading="lazy"` to below-fold images
  - Serve WebP with AVIF fallback via Next.js automatic optimization
  - Success criteria: Images load progressively, LCP includes properly sized image

- [ ] **Implement code splitting for dashboard**
  - Use dynamic imports for heavy components: `const Chart = dynamic(() => import('./Chart'))`
  - Lazy load settings modal: only load when opened
  - Success criteria: Initial bundle <200KB, dashboard interactive in <3s on 3G

- [ ] **Add React Suspense boundaries**
  - Wrap async components in `<Suspense fallback={<Skeleton />}>`
  - Create skeleton loaders matching component layout
  - Success criteria: No layout shift during loading, skeleton → content smooth transition

### Documentation

- [ ] **Write inline JSDoc comments for Convex functions**
  - Document all exported queries/mutations/actions
  - Format: `/** @param {Id<"monitors">} id - Monitor ID to check */`
  - Include success/failure behavior, side effects
  - Success criteria: Developers understand function purpose without reading implementation

- [ ] **Create README.md with setup instructions**
  - Sections: Overview, Tech Stack, Local Development, Environment Variables, Deployment
  - Include: `pnpm install`, `pnpm convex dev`, `pnpm dev` commands
  - Document required env vars with example values
  - Success criteria: Someone can clone and run locally in <5 minutes

- [ ] **Document data retention policy**
  - Add comment in schema.ts explaining 30-day check retention
  - Document cleanup cron behavior
  - Success criteria: Future contributors understand data lifecycle

---

## Phase 7: Production Deployment

### Environment Configuration

- [ ] **Create production environment variables**
  - Add to Vercel project settings: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `RESEND_API_KEY`
  - Use Vercel CLI: `vercel env add VARIABLE_NAME production` (use printf to avoid newlines)
  - Success criteria: All environment variables set, values match production services

- [ ] **Configure Vercel domain**
  - Add custom domain: `heartbeat.engineering` in Vercel project settings
  - Configure DNS: A record pointing to Vercel's IP
  - Enable automatic HTTPS via Vercel's SSL
  - Success criteria: Domain resolves, SSL certificate valid, redirects www → apex

- [ ] **Set up wildcard subdomain for status pages**
  - Add wildcard domain: `*.heartbeat.engineering` in Vercel project settings
  - Configure DNS: CNAME `*.heartbeat` → `cname.vercel-dns.com`
  - Test with test project: `myapp.heartbeat.engineering` resolves
  - Success criteria: Any subdomain routes to Next.js app, middleware handles routing

### Deployment

- [ ] **Deploy to Vercel production**
  - Connect GitHub repo to Vercel project
  - Configure build settings: Framework Preset: Next.js, Build Command: `pnpm build`, Output Directory: `.next`
  - Enable automatic deployments for main branch
  - Success criteria: Push to main triggers deploy, site live within 2 minutes

- [ ] **Verify Convex production deployment**
  - Run `pnpm convex deploy --prod` to deploy backend to production
  - Verify crons are running: check Convex dashboard for heartbeat executions
  - Success criteria: Crons execute every minute, no errors in logs

- [ ] **Test production monitoring flow end-to-end**
  - Create test monitor pointing to httpstat.us/200
  - Wait 5 minutes, verify check recorded
  - Break monitor (change to httpstat.us/500), verify incident opens and email sends
  - Fix monitor (change back to /200), verify incident resolves and email sends
  - Success criteria: Full flow works in production, emails delivered, status page updates

---

## Dogfooding Checklist

- [ ] **Migrate first personal app from UptimeRobot**
  - Create monitor for your most critical app
  - Configure 5-minute check interval
  - Set up email notifications to personal email
  - Verify status page accessible at `yourapp.heartbeat.engineering`
  - Success criteria: Monitor running reliably, status page reflects reality

- [ ] **Add 5-10 more personal apps**
  - Group related monitors by projectSlug
  - Test different check intervals (1min vs 5min cost comparison)
  - Verify no false positives over 7 days
  - Success criteria: All personal apps monitored, trust Heartbeat over UptimeRobot

- [ ] **Monitor Heartbeat performance metrics**
  - Track Convex function execution time (target: <5s per heartbeat cron)
  - Monitor Convex costs (target: <$10/month for 20 monitors @ 5min interval)
  - Check Vercel analytics for status page performance (target: <1s TTFB)
  - Success criteria: System performs within budget, no scaling issues

---

**Implementation Philosophy**: Each task builds a deep module - simple interface, powerful implementation. Status updates propagate via Convex real-time subscriptions (no polling). Monitor checks isolated from each other (one failure doesn't cascade). Email sending decoupled via scheduled actions (incident logic stays pure).

**Critical Path**: Schema → Monitoring Engine → Status Pages → Dashboard. Can deploy and dogfood after completing monitoring engine, even without full UI polish.

**Success Signal**: When you disable UptimeRobot monitors and rely solely on Heartbeat for 30+ days without incident, MVP is validated.
