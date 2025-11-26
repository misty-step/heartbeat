# BACKLOG: Heartbeat Post-MVP Enhancements

Features, improvements, and technical debt opportunities identified during MVP planning but deferred to validate core value proposition first. Prioritize based on dogfooding feedback.

---

## Future Enhancements

### Custom Domains for Status Pages
- **Feature**: Allow users to host status page at `status.their-domain.com` instead of `project.heartbeat.engineering`
- **Value**: Professional branding, SEO benefits, customer trust
- **Implementation**: Vercel Platforms API for dynamic domain management, SSL cert provisioning
- **Estimated Effort**: 2-3 days (domain verification flow, DNS config UI, middleware routing updates)
- **Prerequisite**: Billing system (custom domains as paid feature)

### Multi-User Workspaces & Teams
- **Feature**: Multiple users per workspace, role-based access (owner, editor, viewer), team invitations
- **Value**: Agency use case (manage client status pages), team collaboration
- **Implementation**: Convex schema for workspace memberships, Clerk organizations integration, permission checks in mutations
- **Estimated Effort**: 3-5 days (schema changes, invite flow, permission layer, UI for team management)
- **Prerequisite**: Validate product-market fit with single-user dogfooding first

### SMS & Phone Call Alerts
- **Feature**: Send SMS/phone alerts on critical incidents (alternative to email)
- **Value**: Higher urgency notifications, on-call engineer workflows
- **Implementation**: Twilio integration, phone number verification, alert preferences per monitor
- **Estimated Effort**: 2-3 days (Twilio setup, phone number validation, SMS templates, cost management)
- **Cost Concern**: SMS is expensive (~$0.01/message), needs careful tier design to avoid abuse
- **Prerequisite**: Paying users willing to cover SMS costs

### Stripe Billing & Subscription Management
- **Feature**: Freemium tiers (5 monitors free), paid plans (Indie $9/mo, Agency $29/mo)
- **Value**: Revenue generation, sustainable growth
- **Implementation**: Stripe integration, usage enforcement in Convex mutations, upgrade/downgrade flows
- **Estimated Effort**: 5-7 days (Stripe setup, subscription sync, usage metering, billing portal, dunning emails)
- **Prerequisite**: 20+ validated users requesting paid features (custom domains, higher limits)

### Advanced Incident Management
- **Feature**: Manual incident creation, incident postmortems, runbook attachments, status update broadcast
- **Value**: Communicate planned maintenance, historical incident analysis
- **Implementation**: Incident editor UI, Markdown support, incident broadcast via email/webhook
- **Estimated Effort**: 3-4 days (incident CRUD, rich text editor, broadcast scheduling)
- **Prerequisite**: Users requesting manual control over status page messaging

### Historical Analytics Dashboard
- **Feature**: Uptime trends over 90 days, response time percentiles (p50, p95, p99), SLA reporting
- **Value**: Long-term reliability insights, compliance reporting
- **Implementation**: Aggregate checks into daily/hourly summaries, ClickHouse or TimescaleDB for OLAP queries, chart UI
- **Estimated Effort**: 4-6 days (data pipeline, aggregation cron, analytics queries, chart components)
- **Data Concern**: Raw checks beyond 30 days require separate OLAP storage (Convex not ideal for high-volume analytics)

### Browser Transaction Monitoring
- **Feature**: Monitor multi-step user flows (e.g., login → checkout), not just single URL pings
- **Value**: Catch UX-breaking bugs, not just server downtime
- **Implementation**: Puppeteer in Cloudflare Workers, script editor for user flows, screenshot on failure
- **Estimated Effort**: 7-10 days (browser automation, script DSL, screenshot storage, significantly more complex)
- **Cost Concern**: Browser rendering is expensive, requires separate infrastructure tier

### Private Status Pages with SSO
- **Feature**: Password-protected status pages, SAML/OAuth SSO for enterprise customers
- **Value**: Internal status pages, compliance with security policies
- **Implementation**: Status page authentication middleware, SSO provider integrations
- **Estimated Effort**: 5-7 days (auth layer, SSO setup, enterprise plan tier)
- **Prerequisite**: Enterprise customer segment validation

---

## Nice-to-Have Improvements

### Slack/Discord/PagerDuty Integration
- **Improvement**: Native integrations beyond generic webhooks
- **Impact**: Better developer experience, no custom webhook config required
- **Estimated Effort**: 1-2 days per integration (OAuth flow, platform-specific API calls)
- **Prioritize After**: Validating webhook integration is sufficient for MVP users

### Monitor Response Time SLA Alerts
- **Improvement**: Alert not just on down, but also when response time exceeds threshold (e.g., >5s for 5 consecutive checks)
- **Impact**: Catch performance degradation before full outage
- **Estimated Effort**: 1 day (add responseTimeThreshold to monitor schema, alert logic in updateMonitorStatus)
- **Prerequisite**: Users requesting performance alerting

### Status Page Customization Options
- **Improvement**: Theme editor (colors, fonts, logo placement), custom CSS injection, white-labeling
- **Impact**: Agency differentiation, status page as brandable asset
- **Estimated Effort**: 3-4 days (theme editor UI, CSS sanitization, preview mode)
- **Prerequisite**: Agency users willing to pay premium for customization

### Monitor Groups & Dependencies
- **Improvement**: Define dependencies (e.g., API depends on Database), cascade incident visibility
- **Impact**: More accurate incident communication (root cause clarity)
- **Estimated Effort**: 2-3 days (dependency graph schema, cascade logic, visualization)
- **Prioritize After**: Core monitoring proven reliable

### Maintenance Window Scheduling
- **Improvement**: Schedule expected downtime windows, suppress alerts during maintenance
- **Impact**: Avoid false positive alerts during deployments
- **Estimated Effort**: 2 days (maintenance window schema, scheduler check before alert, status page indicator)
- **Prerequisite**: Users frequently deploying during business hours

### Status Page Subscriber Management
- **Improvement**: Email subscription form on status page, notify subscribers on incident updates
- **Impact**: Proactive customer communication
- **Estimated Effort**: 2-3 days (subscription form, subscriber list management, broadcast on incident updates)
- **Prerequisite**: Users with external customers viewing status pages

### Monitor Check Location Selection
- **Improvement**: Choose check origin region (US-East, US-West, EU, Asia)
- **Impact**: Regional performance monitoring, reduce false positives for geo-restricted services
- **Estimated Effort**: 3-4 days (multi-region Convex deployments or Cloudflare Workers routing)
- **Prerequisite**: Users complaining about false positives due to single-region checks

### API for Programmatic Monitor Management
- **Improvement**: REST API or SDK for creating/updating monitors via IaC (Terraform, Pulumi)
- **Impact**: DevOps workflow integration, GitOps for monitor config
- **Estimated Effort**: 2-3 days (API routes wrapping Convex mutations, API key authentication)
- **Prioritize After**: Power users requesting automation

---

## Technical Debt Opportunities

### Migrate Monitoring Engine to Cloudflare Workers
- **Context**: Current MVP uses Convex actions for HTTP checks. This is simple but has scaling limitations (cost per invocation, single-region, 60s timeout risk)
- **Benefit**: If Convex costs exceed $50/month or false positives become problematic
- **Migration Path**:
  - Keep Convex for app state (monitors, incidents, user data)
  - Move check execution to Cloudflare Workers with Durable Objects for scheduling
  - Workers write check results back to Convex via HTTP API
  - Enable multi-region verification (primary check + 2 regional retries on failure)
- **Estimated Effort**: 4-5 days (Cloudflare Worker setup, Durable Object scheduler, Convex API auth, migration testing)
- **Decision Criteria**: Execute migration if (1) Convex monthly bill >$50 OR (2) >5 false positives per week

### Implement Time-Series Database for Check History
- **Context**: Current MVP stores raw checks in Convex, deletes after 30 days
- **Benefit**: Long-term analytics, lower storage costs, faster aggregate queries
- **Options**: VictoriaMetrics (best compression), ClickHouse (best query speed), TimescaleDB (Postgres-compatible)
- **Migration Path**:
  - Stream check results to TSDB after writing to Convex
  - Keep Convex for recent checks (7 days), TSDB for historical (90+ days)
  - Build analytics queries against TSDB
- **Estimated Effort**: 5-7 days (TSDB deployment, streaming pipeline, query layer, UI updates)
- **Decision Criteria**: Execute if users request >30 day history or analytics features

### Extract Email Sending to Dedicated Worker
- **Context**: Current MVP sends emails directly from Convex actions
- **Benefit**: Decouple email delivery from incident logic, retry failed sends, batch daily digests
- **Migration Path**:
  - Implement queue (BullMQ on Redis or Cloudflare Queues)
  - Convex pushes email jobs to queue
  - Worker consumes queue, sends via Resend with retries
- **Estimated Effort**: 2-3 days (queue setup, worker implementation, retry logic)
- **Decision Criteria**: Execute if email delivery failures impact user experience

### Add Comprehensive Integration Tests
- **Context**: Current MVP relies on manual testing + unit tests for mutations
- **Benefit**: Prevent regressions in critical monitoring flows
- **Approach**:
  - Use Playwright for E2E tests (create monitor → wait for check → verify status page)
  - Mock external HTTP services (intercept fetch in Convex actions)
  - Test incident open/resolve flows with time manipulation
- **Estimated Effort**: 3-4 days (test setup, critical path coverage, CI integration)
- **Decision Criteria**: Execute after first production incident caused by regression

### Implement Observability for Monitoring System
- **Context**: Current MVP has basic Convex logs
- **Benefit**: Diagnose monitoring issues, optimize check performance, detect system-level problems
- **Approach**:
  - Add structured logging (Pino) with correlation IDs
  - Instrument Convex actions with metrics (check duration, failure rate, queue depth)
  - Set up alerting on monitoring system health (Sentry, PagerDuty for ops team)
- **Estimated Effort**: 2-3 days (instrumentation, metrics collection, dashboard setup)
- **Decision Criteria**: Execute when managing >100 monitors (complexity requires observability)

### Optimize Database Indexes for Scale
- **Context**: Current MVP has basic indexes (by_user, by_project_slug, by_monitor)
- **Benefit**: Maintain query performance as data grows
- **Approach**:
  - Add composite index on checks: (monitorId, startedAt, success) for uptime calculations
  - Add index on incidents: (projectSlug, status, resolvedAt) for status page queries
  - Monitor Convex query performance metrics
- **Estimated Effort**: 1 day (index creation, query plan analysis)
- **Decision Criteria**: Execute when status page load time exceeds 500ms or dashboard queries slow

---

## Deprioritized Features

### Features Explicitly Out of Scope (Re-evaluate after 6 months):
- Server CPU/RAM monitoring (requires agent installation, different product category)
- Complex on-call scheduling with rotations (compete with PagerDuty, not core value prop)
- Distributed tracing / APM (complementary to uptime monitoring, not replacement)
- Status page comments / public incident discussion (moderation burden)
- Custom monitor types beyond HTTP (TCP, DNS, Ping) (80/20 rule: HTTP covers most use cases)

---

**Prioritization Framework**:
1. **Now** (Current TODO.md): Core MVP features required for personal dogfooding
2. **Next** (This backlog, top section): Features blocking expansion beyond dogfooding (billing, teams, custom domains)
3. **Later** (Nice-to-have): Improvements adding polish or power-user features
4. **Maybe** (Technical debt): Refactors improving scalability/maintainability but not user-facing

**Decision Process**: After 30 days of dogfooding, review this backlog with actual usage data. Prioritize features that:
1. Solve real pain points observed during dogfooding
2. Are requested by ≥3 early users independently
3. Have high value-to-effort ratio (< 3 days implementation, clear monetization path)

**Anti-Pattern**: Do not build features speculatively. Every item in this backlog requires validation signal before implementation begins.
