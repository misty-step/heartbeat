You’re absolutely not crazy for wanting to build this yourself. 😄 Short answer: Heartbeat *can* be a real thing, but the “it’s simple” assumption hides some dragons. Let’s surface those, sharpen the idea, and sketch how you’d actually build it with your stack.

---

## 1. Is there actually space for Heartbeat?

### The landscape (high‑level)

Rough buckets:

* **Monitoring-first tools that bolt on status pages**

  * **UptimeRobot** – free tier: 50 monitors, 5‑minute interval, 1 status page; Solo plan $7/mo for 1‑minute checks and 50 monitors. ([DEV Community][1])

    * Newer TOS: free plan can’t be used to monitor commercial sites, which annoyed a lot of indie SaaS folks. ([Reddit][2])
  * **Better Stack (Better Uptime)** – full observability + on‑call, but also very polished status pages and a free plan with one status page + some monitors; paid from ~$29/mo. ([Better Stack][3])

* **Status-page-first tools**

  * **Atlassian Statuspage** – more enterprise‑y (plans $79+ /mo etc.). ([Instatus][4])
  * **Instatus** – “beautiful status page” branding; free forever plan, then per‑status‑page pricing (e.g. ~$15/mo for custom domains, more for private pages). ([Instatus][5])

    * Many people like it *because it looks good and is simple*. Some complain that you still need a separate uptime monitor to drive it. ([Software Advice][6])

* **Open source / indie hacker solutions**

  * **Upptime** – GitHub Actions + Pages uptime monitor & status page; 5‑minute checks, static status site; used by 3k+ people/teams. ([GitHub][7])
  * **Cachet, Statping, Statusfy, OpenStatus, Uptime Kuma** – self‑hosted or OSS status pages and monitors. ([Better Stack][8])

And there are tons of listicles of “15 free status page tools in 2025”, which tells you:

* **Competition is real**, but
* Many offerings are either:

  * **Enterprise heavy**, or
  * **Fiddly/complex**, or
  * **DIY/self‑host only**, or
  * **Visually meh**. ([DEV Community][9])

### The gap you *might* exploit

Given all that, Heartbeat’s niche could be:

> **“Stupidly simple, beautiful uptime + status pages for solo devs and tiny teams. Optimized for 5–50 apps, not for 500 microservices.”**

Compare:

* UptimeRobot: generous but increasingly enterprise‑y policies, UI feels utilitarian. ([Reddit][2])
* Instatus: gorgeous & simple, but not built‑in monitoring; relies on integrations or manual incident updates. ([Software Advice][6])
* Upptime / OSS: great for hackers, but GitHub‑Actions‑as‑infra is not “set and forget” for non‑nerds.

So your differentiator could be:

* **Design-first**: treat the status page as the *product*, not the afterthought.
* **Constraints as a feature**: no incident workflow labyrinth, no “on‑call calendars”, no 50 different monitor types. Just:

  * HTTP(s) checks
  * Beautiful public page
  * Simple alerts.

---

## 2. Sharpen the product concept

Right now your concept is:

> Enter URL → we ping it → status page appears → optional custom domain → simple pricing.

That’s solid, but we should tighten what’s *in* and what’s deliberately *out*.

### Target persona (v1)

If you build this primarily for *yourself*, you’re basically also defining your ICP:

* Indie hacker / solo dev with **a stable of small apps**
* Tiny SaaS teams (2–5 people)
* Small agencies hosting client sites
* Open‑source maintainers wanting a nice status page.

Non‑goal (for now):

* SRE teams at $BIGCO who want SLO burn rates, multi‑region latency histograms, incident post‑mortem workflows, etc.

### What Heartbeat **is** (opinionated v1)

**Core objects:**

* **Monitor (Heartbeat)**

  * URL
  * Expected status (e.g. “2xx & 3xx = up”)
  * Interval (1m paid / 5m free)
  * Region (maybe single region v1)
  * Optional “component label” (e.g. “API”, “Marketing site”)

* **Project**

  * Group of monitors (e.g. each SaaS = 3–5 monitors)
  * Has one **public status page**.

* **Status Page**

  * URL: `project-slug.heartbeat.engineering` or `status.heartbeat.engineering/project-slug`
  * Shows:

    * Overall status (green/amber/red)
    * List of components (API, dashboard, docs)
    * 24h / 7d uptime + response time sparkline
    * Incident history (simple text log, optional).

**Features I’d absolutely include in v1:**

1. **Monitoring**

   * HTTP(S) GET with configurable timeout (e.g. 5–10s).
   * Up if response within timeout and status in allowed set.
   * 2‑phase or 3‑strike rule before calling something “down”:

     * e.g. require 2–3 consecutive failures before “down”, to avoid noisy alerts.
   * Log response time + status per check.

2. **Status pages**

   * Public pages that *look great* on web & mobile.
   * Customizable:

     * Logo, brand color, light/dark.
     * Brief description / link to docs / support.
   * Simple, opinionated layout (you can’t break it).

3. **Notifications**

   * Email at minimum.
   * Optional: webhook or Slack webhook (so early adopters can DIY integrations without you implementing everything).

4. **Dashboard**

   * Internal view listing monitors, their uptime %, and their current state.
   * Quick “add monitor” form (url + label + project).

### Explicit **non‑goals** (at least initially)

Things to consciously *not* build at first:

* SMS / phone alerts (expensive + tricky).
* Advanced incident workflows (runbooks, on‑call rotations).
* Browser checks / transaction monitoring.
* Private/internal status pages with SSO.
* Complex alert routing rules.

You can always bolt these on later if the thing gets traction.

---

## 3. Pricing & plan shaping

Reality check: you’re competing with tooling that offers a lot for free:

* UptimeRobot free: 50 monitors, 5‑minute checks, 1 public status page. ([DEV Community][1])
* Better Stack: free plan with 1 status page + 10 monitors. ([Better Stack][8])
* Instatus: free status pages; paid for custom domains and more advanced usage. ([Instatus][5])

You *won’t* beat them on raw generosity **and** profit, so you win by:

* Targeting people who care about design and simplicity.
* Making it “cheap enough that I don’t think about it”.

Example pricing (feel free to tweak):

**Free**

* 5 monitors
* 10‑minute checks
* 1 project
* 1 status page on `*.heartbeat.engineering`
* Email alerts only
* Basic branding (text + logo)

**Indie – $9/mo**

* 30–50 monitors
* 1–minute checks
* Up to 5 projects
* Status pages on `*.heartbeat.engineering`
* Custom domain for 1 status page (e.g. `status.myapp.com`)
* Slack/webhook alerts
* 90 days of history

**Studio/Agency – $24/mo**

* 100 monitors
* 15–20 projects
* Custom domain on all status pages
* Read‑only shareable internal dashboard link for clients
* 365 days of history

You can raise prices later; your initial job is just to find a wedge that feels fair versus:

* $7/mo Solo UptimeRobot for 50 monitors/1‑min checks. ([DEV Community][1])
* Instatus ~$15/mo per status page for custom domains. ([Hyperping][10])
* Hyperping $24/mo for 50 monitors & 1 status page. ([Hyperping][11])

If Heartbeat gives:

* 1+ beautiful status pages,
* * monitoring,
* * nicer UX than UptimeRobot,
    … $9–24/mo is pretty defensible.

---

## 4. Technical design with your stack

You’re in a good spot: Next.js + Vercel + Convex/Neon + Clerk is *perfect* for this.

### 4.1. High‑level architecture

* **Frontend app**

  * Next.js (app router)
  * Tailwind for UI
  * Hosted on Vercel
* **Backend**

  * Convex for data + scheduling (monitors, checks, incidents).
  * Optional Neon (Postgres) if you want long‑term analytics later.
* **Auth**

  * Clerk to manage workspaces/users.
* **Background work**

  * Convex cron jobs / scheduled functions to do the actual pings. ([docs.convex.dev][12])

---

### 4.2. Data model (rough sketch)

TypeScript‑ish pseudo‑schema:

```ts
// One workspace = one customer account
type Workspace = {
  id: string;
  name: string;
  slug: string; // used in URLs
  ownerId: string; // Clerk user id
  createdAt: number;
};

type Project = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string; // for status page URL
  description?: string;
  createdAt: number;
};

type Monitor = {
  id: string;
  projectId: string;
  name: string;
  url: string;
  intervalSeconds: number; // 60 or 600
  timeoutMs: number;       // default 10000
  expectedStatus: "2xx-3xx" | "2xx-only" | "custom";
  region: "us-east-1";     // single region v1
  enabled: boolean;
  lastCheckAt?: number;
  currentStatus: "up" | "down" | "degraded" | "unknown";
  consecutiveFailures: number;
};

type CheckResult = {
  id: string;
  monitorId: string;
  startedAt: number;
  durationMs?: number;
  statusCode?: number;
  error?: string;
  status: "up" | "down";
};

type Incident = {
  id: string;
  projectId: string;
  monitorId: string;
  startedAt: number;
  resolvedAt?: number;
  status: "open" | "resolved";
  message: string;
};
```

You can let Convex own this schema. If you later need analytics (e.g. percentile response times over months), you can stream old `CheckResult` rows into Neon and downsample.

---

### 4.3. Scheduler / pinger design

This is the “hidden complexity” bit that most “I’ll just ping a URL” ideas gloss over.

#### v1 scheduling model

Use Convex cron jobs:

* **Single cron job every minute**:

  * Find all `Monitor`s where:

    * `enabled == true`
    * `now - lastCheckAt >= intervalSeconds`
  * Chunk them (e.g. batches of 20).
  * For each batch, kick off a Convex `action` that:

    * Performs `fetch` to each URL with a timeout.
    * Writes `CheckResult`s.
    * Updates `Monitor.currentStatus` and `consecutiveFailures`.
    * Opens/closes `Incident`s.

Convex supports scheduled/cron functions and durable retries for this exact pattern. ([docs.convex.dev][12])

#### Handling flakiness

A simple but decent algorithm:

* On each check, compute `status = up | down` based on HTTP result & timeout.
* If `status === down`:

  * If `monitor.consecutiveFailures === 0`, immediately re‑check once (quick double-check).
  * Increment `consecutiveFailures`.
  * If it crosses threshold (e.g. 3), open an `Incident` if one isn’t already open and mark `currentStatus = "down"`.
* If `status === up`:

  * Set `consecutiveFailures = 0`.
  * If there’s an open incident and we’ve seen N consecutive “up” checks (or some elapsed time), resolve it.

This alone will prevent a lot of “cry wolf” behavior.

#### Scaling thoughts

Rough math:
Say you have 100 users * 20 monitors = 2,000 monitors.

* If most are 60‑second checks:

  * ~2,000 fetches per minute → ~33/second.
  * That’s fine for Convex actions if you batch them carefully and set a concurrency limit per action (e.g. 10–20 simultaneous fetches) so a slow target doesn’t blow the whole job’s runtime.

If you ever outgrow this, you can:

* Add region‑specific workers (US/EU) using different Convex deployments.
* Or outsource the pinger to a tiny worker on Fly.io/Render and post results back.

For v1 (your own apps + a few early adopters), Convex alone should be more than enough.

---

### 4.4. Status pages implementation

**Routing**

* Next.js app route like `/s/[projectSlug]` for public status pages.
* Use server components or `getServerSideProps`‐ish data fetch from Convex (via API route or server helper).

**Caching**

* Since checks run at 1 min min‑interval, you can safely:

  * Cache status page output with `revalidate: 30` or `60`.
  * Or just read from Convex on each request; at small scale that’s fine.

**What to show**

* Banner: “All systems operational” / “Partial outage” / “Major outage” derived from monitors in project.
* Components list:

  * Name + current status + small dot.
  * Last 24h or 7d mini chart (you can downsample to hourly buckets).
* Incident history:

  * Short list, text only: “2025‑11‑24 – API outage – 12m.”
* Optional subscribe form (if you want to do email updates later).

Because design is your differentiator, I’d keep the layout *opinionated*:

* One or two page templates only.
* Simple theming (primary color, logo, maybe font choice).
* No “drag layout blocks around” UI.

---

### 4.5. Domains & URLs

You mentioned `your-app.heartbeat.engineering` — nice.

**Implementation options:**

* On Vercel, set up `*.heartbeat.engineering` as a wildcard domain.
* Each project stores a `subdomain` field (e.g. `"your-app"`).
* Public URL: `https://your-app.heartbeat.engineering`.

For **custom domains**:

* User adds `status.yourdomain.com`.
* You give them a CNAME to `cname.heartbeat.engineering` (or direct to Vercel’s endpoint).
* Store `customDomain` on `Project`.
* Status page route handler picks the project by:

  * Host header → lookup `Project` where `host in {subdomain.heartbeat.engineering, customDomain}`.

Vercel already has first‑class custom domain support, so most of the heavy lifting is DNS + verifying CNAME.

---

### 4.6. Notifications

Given your “simple” goal, I’d do:

* **Email**

  * Use Resend / Postmark / whatever you like.
  * Send on:

    * Incident opened
    * Incident resolved
  * Optional: daily summary (“everything was fine” email).

* **Slack/Webhook (v1.5+)**

  * User pastes Slack incoming webhook URL or generic webhook.
  * You POST simple JSON on incident open/close.

Alert fatigue is real; with small teams, “one email per incident state change” is enough.

---

## 5. Where your “it’s simple” assumption breaks

Here’s me challenging you a bit:

1. **Single-region checks**

   * Monitoring from one region can call “down” when your users in another region are fine (or vice versa).
   * For v1, this is okay if your positioning is “basic uptime”.
   * But know that “multi‑region checks” is a common differentiator for more serious tools.

2. **What is actually “down”?**

   * Is a 404 “down”? Many people would say “the app is up but this URL is wrong”.
   * Is a 401/403 “down”? Probably not.
   * Distinguish between:

     * “Endpoint not reachable at all” (network/TLS/timeouts).
     * “App is up but misbehaving for some paths.”
   * I’d default to: **2xx–3xx = up; timeouts/5xx = down; 4xx = configurable** but treat as “up” in uptime %, to keep semantics clean.

3. **Storage growth**

   * With 100 monitors @ 1‑min checks:

     * 100 * 60 * 24 ≈ 144k checks/day
     * ~4.3M checks/month
   * You probably don’t want raw rows forever.
   * Plan a simple retention:

     * Keep per‑check records 7–30 days.
     * Beyond that, keep hourly/daily aggregates in separate collection.

4. **False positives & trust**

   * If Heartbeat cries “DOWN” when things are actually fine, users will churn hard.
   * Your “3 strikes” rule and double‑check on failure are crucial.
   * Also consider: “maintenance windows” where monitors are temporarily allowed to fail without alerts.

5. **Free tier abuse**

   * People will absolutely try to monitor huge fleets on the free tier.
   * You’ll want:

     * Hard cap on monitors per workspace.
     * Possibly “hobby only” language like UptimeRobot tried (but that annoyed startups). ([Reddit][2])
   * Simpler: small but generous free tier (e.g. 5 monitors) and that’s it.

---

## 6. Concrete v0 slice & next steps

If I were you, I’d structure v0 like this:

### v0: “Heartbeat for Phaedrus”

Goal: replace UptimeRobot for your own apps only.

1. **Auth & workspaces**

   * Clerk integration.
   * Single workspace for now.

2. **Convex schema**

   * Implement `Workspace`, `Project`, `Monitor`, `CheckResult`, `Incident`.

3. **Monitor creation UI**

   * Simple “Add monitor” form.
   * Assign each monitor to a “Default project” initially.

4. **Cron / pinger**

   * Convex cron that runs once per minute.
   * Implement the ping → record → incident logic.
   * No status page yet, just an internal dashboard.

5. **Internal dashboard**

   * List monitors with:

     * Status
     * Last checked
     * Uptime over last 24h/7d.

### v0.5: Public status pages

6. **Public status page route**

   * `/s/[projectSlug]` or `projectSlug.heartbeat.engineering`.
   * Show overall + component statuses + recent incidents.

7. **Custom domains**

   * Wire up wildcard subdomains and one custom domain as a test.

### v1: SaaS for others

8. **Onboarding flow + billing**

   * Very simple Stripe subscription: Free vs Indie.
   * Usage limits enforced in Convex mutations.

9. **Notifications**

   * Email for incident open/close.

10. **Polish**

* Make the status page and dashboard *feel* like Heartbeat: minimal, crisp, nice typography, small animations.

Once you’re using it for your whole stable and you *trust* it more than UptimeRobot, you’re ready to quietly invite others.

---

## 7. TL;DR where I’d polish your original idea

* **Yes**, “enter URL → we ping it → pretty status page” is a viable core.
* The moat is:

  * laser‑simple UX,
  * genuinely great visual design,
  * and tight scope (don’t chase full incident management).
* **Challenge points**:

  * Don’t underestimate scheduling, false positives, and data retention.
  * Decide early how generous your free tier is vs. your own hosting costs.
  * Think in terms of “project + components” not just raw URLs, so the status page makes sense to normal humans.

If you want, next step we can:

* Design the exact **status page layout** (sections, copy, visual states), or
* Sketch actual **Convex functions / Next.js routes**, or
* Work through a **landing page** narrative that sells this specifically to indie hackers and small studios.

[1]: https://dev.to/maxshash/status-page-pricing-guide-for-2025-41p8?utm_source=chatgpt.com "Status Page Pricing Guide for 2025"
[2]: https://www.reddit.com/r/SaaS/comments/1g15mvl/you_can_no_longer_use_uptimerobot_to_monitor_for/?utm_source=chatgpt.com "You can no longer use UptimeRobot to monitor for free on ..."
[3]: https://betterstack.com/pricing?utm_source=chatgpt.com "Pricing"
[4]: https://instatus.com/blog/what-is-statuspage?utm_source=chatgpt.com "What Is Statuspage? Find Out Whether It's Worth It"
[5]: https://instatus.com/?utm_source=chatgpt.com "Instatus – Get ready for downtime"
[6]: https://www.softwareadvice.com/issue-tracking/instatus-profile/?utm_source=chatgpt.com "Instatus Software Reviews, Demo & Pricing - 2025"
[7]: https://github.com/upptime/upptime?utm_source=chatgpt.com "upptime/upptime: ⬆️ GitHub Actions uptime monitor & ..."
[8]: https://betterstack.com/community/comparisons/statuspage-alternatives/?utm_source=chatgpt.com "7 Best Statuspage Alternatives in 2025"
[9]: https://dev.to/cbartlett/15-free-status-page-tools-in-2025-5elg?utm_source=chatgpt.com "15 Free Status Page Tools in 2025"
[10]: https://hyperping.com/blog/best-status-page-software?utm_source=chatgpt.com "Best status page software in 2025 [25 analyzed, top 5 picks]"
[11]: https://hyperping.com/blog/betterstack-vs-uptime-vs-hyperping?utm_source=chatgpt.com "Better Stack vs Uptime.com vs Hyperping (Hands-On ..."
[12]: https://docs.convex.dev/scheduling/cron-jobs?utm_source=chatgpt.com "Cron Jobs | Convex Developer Hub"

