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

- [~] **Configure Tailwind CSS 4 with custom @theme tokens**
  - Create `app/globals.css` with @theme directive defining color palette, typography, spacing, animations
  - Define CSS variables: `--color-background`, `--color-surface`, `--color-success`, `--color-warning`, `--color-error`, `--color-text-*`
  - Add dark mode support with `@media (prefers-color-scheme: dark)` block
  - Define `--font-family-sans: "Geist Sans"` and `--font-family-mono: "Geist Mono"`
  - Success criteria: Variables accessible in Tailwind classes, dark mode toggles automatically

- [ ] **Create tailwind.config.ts with extended theme**
  - Extend animations: `pulse` keyframe (3s cubic-bezier, opacity 0.4→0.1→0.4, scale 1→1.5→1)
  - Add custom colors mapping to CSS variables: `success`, `warning`, `error`, `surface`, `border`
  - Configure fontFamily: `sans: ["var(--font-geist-sans)"]`, `mono: ["var(--font-geist-mono)"]`
  - Set content paths: `["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"]`
  - Success criteria: Tailwind classes like `text-success`, `font-mono`, `animate-pulse` work in components

- [ ] **Configure Geist fonts in root layout**
  - Import `GeistSans` and `GeistMono` from `"geist/font/sans"` and `"geist/font/mono"`
  - Apply to html: `className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}`
  - Set CSS variables: `--font-geist-sans` and `--font-geist-mono`
  - Success criteria: Fonts render with proper antialiasing, variable fonts load without FOUT

### Convex Backend Setup

- [ ] **Initialize Convex project**
  - Run `pnpm convex dev` to create convex/ directory and link to cloud
  - Accept prompts to create project, select "Next.js" template
  - Success criteria: `convex/_generated/` folder created with API types

- [ ] **Define Convex schema for monitors table**
  - Create `convex/schema.ts` with `defineSchema` and `defineTable`
  - Define `monitors` table fields: `name` (string), `url` (string), `slug` (string), `projectName` (string), `projectSlug` (string), `checkInterval` (number), `timeoutMs` (number), `expectedStatus` (array of strings), `enabled` (boolean), `currentStatus` (union: "up" | "down" | "degraded" | "unknown"), `consecutiveFailures` (number), `lastCheckAt` (optional number), `lastResponseTime` (optional number), `createdAt` (number), `userId` (string)
  - Add indexes: `.index("by_project_slug", ["projectSlug"])`, `.index("by_user", ["userId"])`
  - Success criteria: Schema validates, types generated in `_generated/dataModel.d.ts`

- [ ] **Define Convex schema for checks table**
  - Add `checks` table to `convex/schema.ts`
  - Fields: `monitorId` (Id<"monitors">), `startedAt` (number), `completedAt` (number), `success` (boolean), `statusCode` (optional number), `responseTimeMs` (optional number), `errorMessage` (optional string)
  - Add indexes: `.index("by_monitor", ["monitorId", "startedAt"])` for efficient queries
  - Success criteria: Can query recent checks for a monitor sorted by time

- [ ] **Define Convex schema for incidents table**
  - Add `incidents` table to `convex/schema.ts`
  - Fields: `monitorId` (Id<"monitors">), `projectSlug` (string), `startedAt` (number), `detectedAt` (number), `resolvedAt` (optional number), `status` ("open" | "resolved"), `failureCount` (number), `title` (string), `description` (optional string)
  - Add indexes: `.index("by_project", ["projectSlug", "startedAt"])`, `.index("by_monitor", ["monitorId", "status"])`
  - Success criteria: Can efficiently query open incidents per project

- [ ] **Create Convex environment configuration**
  - Create `.env.local` with `CONVEX_DEPLOYMENT` URL from `pnpm convex dev` output
  - Add `NEXT_PUBLIC_CONVEX_URL` for client-side access
  - Add to `.gitignore`: `.env.local`, `convex/_generated/`
  - Success criteria: Convex client connects from browser, real-time subscriptions work

### Authentication Integration

- [ ] **Configure Clerk authentication**
  - Sign up for Clerk account at clerk.com, create application
  - Install middleware: create `middleware.ts` with `authMiddleware` protecting `/dashboard/*` routes
  - Configure public routes: `["/", "/s/:path*"]` (status pages are public)
  - Add Clerk keys to `.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - Success criteria: Unauthenticated users redirected to sign-in, authenticated users access dashboard

- [ ] **Create Clerk provider wrapper in root layout**
  - Wrap `{children}` in `app/layout.tsx` with `<ClerkProvider>`
  - Add `<UserButton />` component in header (shows avatar, sign out)
  - Import CSS: `import "@clerk/nextjs/dist/clerk.css"`
  - Success criteria: Clerk UI renders, sign-in/sign-up flows work, user session persists

- [ ] **Integrate Convex with Clerk authentication**
  - Create `convex/auth.config.ts` with Clerk provider configuration
  - Use `auth()` helper in Convex functions to get `userId`
  - Add authentication to mutations: check `ctx.auth.getUserIdentity()` exists before writes
  - Success criteria: Convex functions can access Clerk userId, unauthorized calls rejected

---

## Phase 2: Data Layer & Business Logic

### Core Queries & Mutations

- [ ] **Create monitors.ts query: list all monitors for user**
  - File: `convex/monitors.ts`
  - Query function: `export const list = query(async (ctx) => { ... })`
  - Get userId from `ctx.auth.getUserIdentity()`, return empty array if unauthenticated
  - Query monitors by userId, order by `createdAt` descending
  - Success criteria: Dashboard can subscribe to live monitor list, updates reactively

- [ ] **Create monitors.ts query: get single monitor by ID**
  - Query function: `export const get = query(async (ctx, { id }: { id: Id<"monitors"> }) => { ... })`
  - Validate monitor belongs to authenticated user before returning
  - Return null if not found or unauthorized
  - Success criteria: Can fetch monitor details for edit form, enforces ownership

- [ ] **Create monitors.ts query: get monitors by projectSlug**
  - Query function: `export const getByProjectSlug = query(async (ctx, { projectSlug }: { projectSlug: string }) => { ... })`
  - Use `.index("by_project_slug", ["projectSlug"])` for efficient lookup
  - Return all monitors for project (public query, no auth required for status pages)
  - Success criteria: Status page can fetch all monitors for a project in <100ms

- [ ] **Create monitors.ts mutation: create new monitor**
  - Mutation function: `export const create = mutation(async (ctx, args: { name, url, slug, projectName, projectSlug, checkInterval, timeoutMs, expectedStatus }) => { ... })`
  - Require authentication, get userId from ctx
  - Validate URL format (starts with http:// or https://)
  - Validate slug uniqueness within project
  - Set defaults: `enabled: true`, `currentStatus: "unknown"`, `consecutiveFailures: 0`, `createdAt: Date.now()`
  - Success criteria: Monitor created, immediately visible in dashboard via real-time subscription

- [ ] **Create monitors.ts mutation: update monitor**
  - Mutation function: `export const update = mutation(async (ctx, { id, ...fields }) => { ... })`
  - Verify ownership before update (check userId matches)
  - Allow updating: `name`, `url`, `checkInterval`, `timeoutMs`, `expectedStatus`, `enabled`
  - Success criteria: Changes save and propagate to dashboard and status page in real-time

- [ ] **Create monitors.ts mutation: delete monitor**
  - Mutation function: `export const remove = mutation(async (ctx, { id }) => { ... })`
  - Verify ownership before delete
  - Cascade delete: remove all related checks and incidents
  - Success criteria: Monitor and all related data removed, dashboard updates immediately

### Monitoring Engine Core Logic

- [ ] **Create monitoring.ts internal query: getDueMonitors**
  - File: `convex/monitoring.ts`
  - Internal query (not exposed to client): `export const getDueMonitors = internalQuery(async (ctx) => { ... })`
  - Find monitors where `enabled === true` AND `(Date.now() - lastCheckAt) >= (checkInterval * 1000)`
  - Include monitors where `lastCheckAt` is undefined (never checked)
  - Success criteria: Returns only monitors that need checking, optimized with index scan

- [ ] **Create monitoring.ts internal mutation: recordCheck**
  - Internal mutation: `export const recordCheck = internalMutation(async (ctx, { monitorId, startedAt, completedAt, success, statusCode?, responseTimeMs?, errorMessage? }) => { ... })`
  - Insert into `checks` table with all provided fields
  - Success criteria: Check result persisted, can be queried for monitor history

- [ ] **Create monitoring.ts internal mutation: updateMonitorStatus**
  - Internal mutation: `export const updateMonitorStatus = internalMutation(async (ctx, { monitorId, success, responseTime }) => { ... })`
  - Fetch current monitor state
  - If success: reset `consecutiveFailures` to 0, set `currentStatus: "up"`, update `lastCheckAt` and `lastResponseTime`
  - If failure: increment `consecutiveFailures`, update `lastCheckAt`
  - Trigger state transitions: `consecutiveFailures === 2` → "degraded", `consecutiveFailures >= 3` → "down"
  - Success criteria: Monitor status updates atomically, triggers incident logic correctly

- [ ] **Create monitoring.ts internal mutation: openIncident**
  - Internal mutation: `export const openIncident = internalMutation(async (ctx, { monitorId }) => { ... })`
  - Fetch monitor to get `projectSlug` and `name`
  - Check if open incident already exists (status: "open", monitorId matches)
  - If not exists, insert new incident: `status: "open"`, `startedAt: Date.now()`, `detectedAt: Date.now()`, `title: "${monitor.name} is down"`, `failureCount: monitor.consecutiveFailures`
  - Success criteria: Only one open incident per monitor, incident visible on status page immediately

- [ ] **Create monitoring.ts internal mutation: resolveIncident**
  - Internal mutation: `export const resolveIncident = internalMutation(async (ctx, { monitorId }) => { ... })`
  - Find open incident for monitorId (status: "open")
  - If found, update: `status: "resolved"`, `resolvedAt: Date.now()`
  - Success criteria: Incident marked resolved, no longer shows as active on status page

- [ ] **Create monitoring.ts internal action: checkMonitor**
  - Internal action: `export const checkMonitor = internalAction(async (ctx, { monitorId }) => { ... })`
  - Fetch monitor details via `ctx.runQuery(internal.monitoring.getMonitor, { id: monitorId })`
  - Create AbortController for timeout: `setTimeout(() => controller.abort(), monitor.timeoutMs)`
  - Execute fetch: `fetch(monitor.url, { signal: controller.signal, headers: { "User-Agent": "HeartbeatMonitor/1.0" } })`
  - Measure response time: `endTime - startTime`
  - Determine success: `monitor.expectedStatus.includes(String(response.status))`
  - Call `ctx.runMutation(internal.monitoring.recordCheck, { ... })` with results
  - Call `ctx.runMutation(internal.monitoring.updateMonitorStatus, { monitorId, success, responseTime })`
  - On catch (timeout/error): record failed check with errorMessage
  - Success criteria: HTTP check executes with proper timeout, results persisted, status updated

- [ ] **Implement false positive mitigation: immediate retry on first failure**
  - In `updateMonitorStatus` mutation, add retry logic
  - When `consecutiveFailures === 1` (first failure), schedule immediate re-check
  - Use `ctx.scheduler.runAfter(10000, internal.monitoring.checkMonitor, { monitorId })` to retry after 10 seconds
  - Don't count as failure until retry also fails
  - Success criteria: Transient network blips don't trigger incidents, requires sustained failure

- [ ] **Create monitoring.ts internal action: runHeartbeat**
  - Internal action: `export const runHeartbeat = internalAction(async (ctx) => { ... })`
  - Query due monitors: `const monitors = await ctx.runQuery(internal.monitoring.getDueMonitors)`
  - Dispatch checks in parallel: `await Promise.allSettled(monitors.map(m => ctx.runAction(internal.monitoring.checkMonitor, { monitorId: m._id })))`
  - Use `Promise.allSettled` to prevent one failure from blocking others
  - Success criteria: All due monitors checked, failures isolated, cron completes within 60s

### Cron Scheduling

- [ ] **Configure Convex crons in crons.ts**
  - Create `convex/crons.ts`
  - Export default object with `heartbeat` cron: `{ schedule: "* * * * *", handler: internal.monitoring.runHeartbeat }`
  - Add `cleanupChecks` cron: `{ schedule: "0 2 * * *", handler: internal.monitoring.cleanupOldChecks }` (runs daily at 2 AM)
  - Success criteria: `pnpm convex dev` shows crons registered, heartbeat runs every minute

- [ ] **Create monitoring.ts internal action: cleanupOldChecks**
  - Internal action: `export const cleanupOldChecks = internalAction(async (ctx) => { ... })`
  - Query checks where `completedAt < (Date.now() - 30 * 24 * 60 * 60 * 1000)` (older than 30 days)
  - Delete in batches of 100 to avoid timeout
  - Success criteria: Old checks removed, database size stays manageable

---

## Phase 3: Presentation Layer - Components

### Core UI Components

- [ ] **Create StatusIndicator component with breathing dot animation**
  - File: `components/StatusIndicator.tsx`
  - Props: `status: "up" | "down" | "degraded" | "unknown"`
  - Render pulsing dot: base dot (h-3 w-3 rounded-full) + animated outer ring (absolute positioned, pulse animation)
  - Color mapping: up=success, degraded=warning, down=error, unknown=text-tertiary
  - Only animate pulse for "up" status (subtle organic motion)
  - Success criteria: Dot pulses smoothly with 3s cycle, color matches status, accessible contrast ratios

- [ ] **Create MonitorCard component for status pages**
  - File: `components/MonitorCard.tsx`
  - Props: `monitor: { name, currentStatus, lastResponseTime? }`
  - Layout: horizontal flex with StatusIndicator, name, response time (mono font), status text
  - Hover state: subtle background color change (surface → surface-hover)
  - Response time formatting: `{lastResponseTime}ms` in monospace, tertiary color
  - Success criteria: Card displays all info clearly, hover feedback smooth, responsive on mobile

- [ ] **Create StatusHeader component for status pages**
  - File: `components/StatusHeader.tsx`
  - Props: `status: "operational" | "degraded" | "down"`, `projectName: string`
  - Sticky positioning: `sticky top-0 z-50` with glassmorphism backdrop-blur
  - Large status message: "All Systems Operational" (operational), "Partial Outage" (degraded), "Major Outage" (down)
  - Color-coded background: success-soft, warning-soft, error-soft
  - Success criteria: Header stays visible on scroll, status message prominent, mobile-friendly

- [ ] **Create UptimeChart component with sparkline visualization**
  - File: `components/UptimeChart.tsx`
  - Props: `monitors: Array<{ _id, name, /* 30-day check history */ }>`
  - Use Recharts LineChart with minimal styling (no grid, no axes, only line and area fill)
  - Gradient fill under line: `linearGradient(to bottom, rgba(success, 0.2), transparent)`
  - Tooltip on hover showing exact uptime % for day
  - Success criteria: Chart renders quickly (<100ms), responsive width, gradient smooth

- [ ] **Create IncidentTimeline component**
  - File: `components/IncidentTimeline.tsx`
  - Props: `incidents: Array<{ title, startedAt, resolvedAt?, description? }>`
  - Timeline layout: vertical line with dots, incident cards offset alternating sides (desktop only, stack on mobile)
  - Format timestamps: relative time (e.g., "2 hours ago") with absolute time in tooltip
  - Show duration if resolved: `Resolved after 12m`
  - Success criteria: Timeline readable, timestamps clear, mobile stacks vertically

### Form Components

- [ ] **Create AddMonitorForm component**
  - File: `components/AddMonitorForm.tsx`
  - Form fields: URL (required, validated), Name (required), Project Name, Project Slug (auto-generated from name), Check Interval (dropdown: 1min, 5min)
  - Validation: URL must start with http/https, slug must be kebab-case
  - Use Convex mutation: `useMutation(api.monitors.create)`
  - Show success toast on submit, clear form
  - Success criteria: Form validates before submit, errors shown inline, mutation succeeds

- [ ] **Create MonitorSettingsModal component**
  - File: `components/MonitorSettingsModal.tsx`
  - Props: `monitor: Monitor`, `onClose: () => void`
  - Editable fields: name, url, checkInterval, timeoutMs, expectedStatus (comma-separated)
  - Use Convex mutation: `useMutation(api.monitors.update)`
  - Delete button with confirmation dialog
  - Success criteria: Changes save immediately, modal dismisses, confirmation prevents accidental deletes

---

## Phase 4: Presentation Layer - Pages

### Status Page Route

- [ ] **Create status page route at app/s/[slug]/page.tsx**
  - Dynamic route with params: `{ slug: string }`
  - Server component: fetch monitors via `await fetchQuery(api.monitors.getByProjectSlug, { projectSlug: params.slug })`
  - If no monitors found, show 404 page
  - Calculate overall status: "operational" (all up), "degraded" (any degraded), "down" (any down)
  - Success criteria: Page renders as static HTML with ISR, loads in <1s, SEO-friendly

- [ ] **Implement ISR configuration for status pages**
  - Add `export const revalidate = 60` to page.tsx (revalidate every 60 seconds)
  - Add `generateStaticParams` to pre-render common project slugs
  - Configure fallback: `export const dynamicParams = true` (allow new slugs)
  - Success criteria: Status page cached at edge, updates within 60s of status change, works for all project slugs

- [ ] **Add status page layout with StatusHeader, MonitorCards, UptimeChart, IncidentTimeline**
  - Compose components: `<StatusHeader /> <main><section>MonitorCards</section> <section>UptimeChart</section> <section>IncidentTimeline</section></main>`
  - Container: `max-w-4xl mx-auto px-6 py-12`
  - Spacing: `mt-16` between sections (generous whitespace)
  - Success criteria: Layout matches Linear status page aesthetic, breathing room between sections

- [ ] **Implement status page mobile responsiveness**
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
