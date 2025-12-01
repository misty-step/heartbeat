# BACKLOG: Heartbeat Strategic Roadmap

> **"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."** - Antoine de Saint-Exupéry

This backlog is curated for **dogfooding success** and **security**. We deleted speculative features (SMS, Billing, Enterprise SSO) to focus on what makes the product usable and safe *right now*.

---

## 🚨 Critical Security & Stability (P0)

### Fix Data Leak in Public Status Pages
- **Vulnerability**: `api.monitors.getByProjectSlug` returns the full monitor object.
- **Risk**: Authentication headers (`Authorization: Bearer ...`) and request bodies used for monitoring private APIs are exposed to anyone viewing the public status page.
- **Fix**: Project the query result to return only public fields: `id`, `name`, `projectSlug`, `interval`, `status` (computed), `updatedAt`. **Do not return `url`, `headers`, `body`.**

### False Positive Mitigation (Retry Logic)
- **Problem**: A single network blip triggers "Down" status and incidents.
- **Solution**:
  1. If check fails, wait 10s.
  2. Retry check immediately.
  3. Only record failure if retry also fails.
- **Value**: Prevents "cry wolf" fatigue. Essential for "Set and Forget".

---

## 🚀 High Leverage Enhancements (Next 3 Months)

### Custom Domains (Vercel Platforms)
- **Feature**: `status.my-startup.com` instead of `heartbeat.engineering/s/my-startup`.
- **Why**: The #1 feature that separates "toy" from "tool".
- **Implementation**: Vercel Platforms Starter Kit pattern. Middleware routing based on Host header.

### Discord & Slack Webhooks
- **Feature**: Send "Monitor Down" alerts to a channel.
- **Why**: Email is too slow for urgent outages. Developers live in chat.
- **Effort**: Low (Standard HTTP POST payload). Much cheaper/easier than SMS.

### "Test Monitor" Generators
- **Feature**: One-click "Add Test Suite" (Always Up, Always Down, Random Flaky).
- **Why**: Immediate trust verification. Users need to see the system work (red/green/email) to trust it with real infrastructure.

---

## 🛠 Strategic Refactors (Trigger-Based)

### Scale Breaker: Cloudflare Workers Migration
- **Trigger**: Convex monthly bill > $50 OR check timeout errors appear.
- **Plan**: Move the *check execution* (fetch) to Cloudflare Workers. Keep state in Convex.
- **Why**: Convex actions have timeouts; Workers are built for fetch.

### Data Retention Policy
- **Trigger**: Database size warnings.
- **Plan**:
  - Keep raw checks for 7 days.
  - Aggregate to "Daily Uptime %" and "Avg Latency" for long-term storage.
  - Delete raw checks.

---

## 🪦 Graveyard (Deprioritized / Deleted)

- **SMS Alerts**: Too expensive ($0.01/msg) and complex (Twilio compliance) for MVP. Use Webhooks/Pushover instead.
- **Browser Transaction Monitoring**: Puppeteer is a different product category. Stick to HTTP.
- **Billing / Stripe**: Do not build billing until 10 strangers are using it for free.
- **Enterprise SSO**: You are not selling to Enterpise yet.
- **Complex Analytics**: Uptime graphs are enough. No one needs p99 latency charts for a simple heartbeat.