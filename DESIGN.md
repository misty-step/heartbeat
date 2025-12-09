# DESIGN.md — Individual Monitor Status Pages

## Architecture Overview

**Selected Approach**: Simple extension of existing patterns

**Rationale**: The codebase already has ISR-rendered status pages (`/s/[slug]`), public queries, and migration patterns. This feature adds a new route and field—no architectural innovation needed.

**Core Modules**:

- `convex/slugs.ts`: 3-word slug generator (pure function)
- `convex/monitors.ts`: Extended with statusSlug on create
- `app/status/[statusSlug]/page.tsx`: Single-monitor status page (ISR)
- `components/StatusPageHero.tsx`: Giant editorial status display

**Data Flow**:

```
Create Monitor → Generate 3-word slug → Store in DB
                                           ↓
User visits /status/[slug] → fetchQuery by slug → ISR-render page
                                                      ↓
Dashboard card → Link to /status/[slug] → Opens in new tab
```

**Key Design Decisions**:

1. **Server-side slug generation**: Guarantees uniqueness via DB check, no client race conditions
2. **Single-monitor pages only**: No `/status` index page—one monitor, one URL
3. **Delete `/s/[slug]` route**: Per TASK.md, project-level pages are removed
4. **Editorial design**: Giant status hero with serif typography, not utility dashboard

---

## Module: Slug Generator

**Responsibility**: Generate memorable, unique 3-word status slugs.

**Public Interface**:

```typescript
// convex/slugs.ts
export function generateStatusSlug(): string;
// Returns: "adjective-noun-verb" like "silver-mountain-echo"

export async function generateUniqueStatusSlug(ctx: QueryCtx): Promise<string>;
// Returns unique slug after checking DB
```

**Word Lists** (≈50 each for 125,000 combinations):

```typescript
const ADJECTIVES = [
  "amber",
  "azure",
  "bright",
  "calm",
  "coral",
  "crisp",
  "dawn",
  "deep",
  "dusk",
  "fern",
  "frost",
  "gentle",
  "golden",
  "green",
  "ivory",
  "jade",
  "kind",
  "light",
  "lunar",
  "mild",
  "misty",
  "moss",
  "noble",
  "pale",
  "pearl",
  "pine",
  "pure",
  "quiet",
  "rose",
  "sage",
  "salt",
  "serene",
  "silver",
  "slate",
  "soft",
  "solar",
  "spring",
  "still",
  "stone",
  "storm",
  "summer",
  "swift",
  "teal",
  "true",
  "warm",
  "wild",
  "winter",
  "wise",
];

const NOUNS = [
  "arch",
  "bay",
  "beam",
  "bell",
  "bird",
  "bloom",
  "brook",
  "cape",
  "cave",
  "cliff",
  "cloud",
  "cove",
  "creek",
  "crest",
  "dale",
  "dune",
  "echo",
  "edge",
  "field",
  "flame",
  "forge",
  "frost",
  "gate",
  "glen",
  "grove",
  "haven",
  "heath",
  "hill",
  "hollow",
  "lake",
  "leaf",
  "light",
  "marsh",
  "meadow",
  "mesa",
  "mist",
  "moon",
  "moss",
  "oak",
  "path",
  "peak",
  "pine",
  "pond",
  "ridge",
  "river",
  "rock",
  "sage",
  "sand",
  "shade",
  "shore",
  "sky",
  "spring",
  "star",
  "stone",
  "stream",
  "sun",
  "tide",
  "trail",
  "vale",
  "wave",
  "wind",
  "wood",
];

const VERBS = [
  "bloom",
  "break",
  "burn",
  "call",
  "cast",
  "climb",
  "cross",
  "dance",
  "dawn",
  "drift",
  "echo",
  "fade",
  "fall",
  "flash",
  "float",
  "flow",
  "fly",
  "form",
  "glow",
  "grow",
  "hide",
  "hold",
  "hunt",
  "keep",
  "leap",
  "lift",
  "light",
  "meet",
  "melt",
  "move",
  "pass",
  "reach",
  "rest",
  "ride",
  "rise",
  "roam",
  "roll",
  "run",
  "seek",
  "shine",
  "sing",
  "sleep",
  "soar",
  "spark",
  "speak",
  "spin",
  "stand",
  "stay",
  "stir",
  "storm",
  "sweep",
  "swim",
  "swing",
  "turn",
  "wake",
  "walk",
  "watch",
  "wave",
  "weave",
  "wind",
];
```

**Algorithm**:

```pseudocode
function generateStatusSlug():
  adjective = ADJECTIVES[randomInt(0, ADJECTIVES.length)]
  noun = NOUNS[randomInt(0, NOUNS.length)]
  verb = VERBS[randomInt(0, VERBS.length)]
  return `${adjective}-${noun}-${verb}`

async function generateUniqueStatusSlug(ctx):
  maxAttempts = 10
  for i in 0..maxAttempts:
    slug = generateStatusSlug()
    existing = await ctx.db.query("monitors")
      .withIndex("by_status_slug", q => q.eq("statusSlug", slug))
      .first()
    if not existing:
      return slug

  // Fallback: append random suffix
  return `${generateStatusSlug()}-${randomHex(4)}`
```

---

## Module: Schema Extension

**Changes to `convex/schema.ts`**:

```typescript
monitors: defineTable({
  // ... existing fields
  statusSlug: v.string(), // NEW: "silver-mountain-echo"
})
  // ... existing indexes
  .index("by_status_slug", ["statusSlug"]); // NEW: for lookup
```

**Migration** (`convex/migrations.ts`):

```typescript
export const backfillStatusSlugs = internalMutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const monitors = await ctx.db.query("monitors").collect();
    const needsSlug = monitors.filter((m) => !m.statusSlug);

    const batch = needsSlug.slice(0, batchSize);
    for (const monitor of batch) {
      const slug = await generateUniqueStatusSlug(ctx);
      await ctx.db.patch(monitor._id, { statusSlug: slug });
    }

    return {
      processed: batch.length,
      remaining: needsSlug.length - batch.length,
    };
  },
});
```

---

## Module: Monitor Creation

**Changes to `convex/monitors.ts` create mutation**:

```typescript
export const create = mutation({
  args: {
    // ... existing args (NO statusSlug - auto-generated)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Generate unique status slug
    const statusSlug = await generateUniqueStatusSlug(ctx);

    const now = Date.now();
    return await ctx.db.insert("monitors", {
      ...args,
      statusSlug, // NEW
      visibility: args.visibility ?? "public",
      userId: identity.subject,
      enabled: true,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

**Return value change**: After creation, client needs the slug to show URL.

Option A: Return just the ID (current) + separate query
Option B: Return the full monitor document

**Decision**: Return full document. It's one extra field fetch, enables immediate URL display.

```typescript
// Change return type
handler: async (ctx, args) => {
  // ... creation logic
  const id = await ctx.db.insert("monitors", {...});
  return await ctx.db.get(id);  // Return full doc with statusSlug
},
```

---

## Module: Public Query

**New query in `convex/monitors.ts`**:

```typescript
export const getPublicMonitorByStatusSlug = query({
  args: { statusSlug: v.string() },
  returns: v.union(publicMonitorValidator, v.null()),
  handler: async (ctx, args) => {
    const monitor = await ctx.db
      .query("monitors")
      .withIndex("by_status_slug", (q) => q.eq("statusSlug", args.statusSlug))
      .first();

    if (!monitor || monitor.visibility !== "public") {
      return null;
    }

    return toPublicMonitor(monitor);
  },
});
```

---

## Module: Status Page Route

**File**: `app/status/[statusSlug]/page.tsx`

**ISR Configuration** (same as existing `/s/[slug]`):

```typescript
export const revalidate = 60;
export const dynamicParams = true;
```

**Data Fetching**:

```typescript
export default async function StatusPage({ params }: PageProps) {
  const { statusSlug } = await params;

  // Fetch single monitor by status slug
  const monitor = await fetchQuery(api.monitors.getPublicMonitorByStatusSlug, {
    statusSlug,
  });

  if (!monitor) {
    notFound();
  }

  // Fetch uptime stats
  const uptimeStats = await fetchQuery(api.checks.getPublicUptimeStats, {
    monitorId: monitor._id,
    days: 90,  // 90-day history per TASK.md
  });

  // Fetch recent checks for chart
  const recentChecks = await fetchQuery(api.checks.getPublicChecksForMonitor, {
    monitorId: monitor._id,
    limit: 90,
  });

  // Fetch incidents
  const incidents = await fetchQuery(api.incidents.getPublicIncidentsForMonitor, {
    monitorId: monitor._id,
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-background">
      <StatusPageHero
        status={monitor.status}
        monitorName={monitor.name}
        lastCheckAt={monitor.lastCheckAt}
        uptimePercentage={uptimeStats.uptimePercentage}
      />

      {/* 90-day uptime bar */}
      <UptimeDayBar days={90} monitorId={monitor._id} />

      {/* Response time chart */}
      <UptimeChart data={chartData} />

      {/* Incident timeline */}
      <IncidentTimeline incidents={incidents} />
    </div>
  );
}
```

**New query needed**: `getPublicIncidentsForMonitor` (by monitorId, not projectSlug)

---

## Module: StatusPageHero Component

**Responsibility**: Giant, editorial status display. "The URL is the feature" — make it statement-worthy.

**Props**:

```typescript
interface StatusPageHeroProps {
  status: "up" | "degraded" | "down";
  monitorName: string;
  lastCheckAt?: number;
  uptimePercentage: number;
}
```

**Design** (editorial treatment per TASK.md):

- **Giant status**: Full viewport height above fold
- **Serif headlines**: "All Systems Operational" in display font
- **Generous whitespace**: Breathing room, not cramped dashboard
- **Memorable URL visible**: Show the slug itself as design element
- **Confident typography**: 4-6rem status text, not small utility font

**Implementation**:

```tsx
export function StatusPageHero({
  status,
  monitorName,
  lastCheckAt,
  uptimePercentage,
}: StatusPageHeroProps) {
  const statusMessages = {
    up: "All Systems Operational",
    degraded: "Experiencing Issues",
    down: "Service Disruption",
  };

  return (
    <header className="min-h-[60vh] flex flex-col justify-center px-page py-16">
      {/* Monitor name - smaller, secondary */}
      <p className="text-mono text-text-tertiary text-sm mb-4">{monitorName}</p>

      {/* Giant status message - hero treatment */}
      <h1 className="text-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight">
        {statusMessages[status]}
      </h1>

      {/* Status indicator + uptime */}
      <div className="flex items-center gap-6 mt-8">
        <StatusIndicator status={status} size="2xl" cinematic />
        <div className="text-text-secondary">
          <span className="text-mono text-2xl font-medium">
            {uptimePercentage.toFixed(2)}%
          </span>
          <span className="ml-2 text-text-tertiary">uptime</span>
        </div>
      </div>

      {/* Last check time */}
      {lastCheckAt && (
        <p className="text-mono text-text-tertiary text-sm mt-6">
          Last checked {formatRelativeTime(lastCheckAt)}
        </p>
      )}
    </header>
  );
}
```

---

## Module: Dashboard Integration

**Changes to `DashboardMonitorCard.tsx`**:

Add "View Status Page" link in the card header:

```tsx
interface DashboardMonitorCardProps {
  monitor: {
    // ... existing fields
    statusSlug: string; // NEW
  };
  // ...
}

// In the card header, after settings button:
<a
  href={`/status/${monitor.statusSlug}`}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="p-2 text-foreground/20 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-foreground/5 transition-all duration-150"
  title="View Status Page"
>
  <ExternalLink className="h-4 w-4" />
</a>;
```

**Changes to `AddMonitorForm.tsx`**:

After successful creation, show the status page URL:

```tsx
const handleSubmit = async (e: FormEvent) => {
  // ... existing validation

  try {
    const monitor = await createMonitor({...});

    // Show success with URL (via callback or toast)
    onSuccess?.(monitor.statusSlug);
  } catch (err) {
    // ...
  }
};

// Update callback signature
interface AddMonitorFormProps {
  onSuccess?: (statusSlug: string) => void;
}
```

**Dashboard page** shows toast/modal with URL:

```tsx
<AddMonitorForm
  onSuccess={(slug) => {
    setShowSuccess(true);
    setNewStatusSlug(slug);
  }}
/>;

{
  showSuccess && (
    <SuccessModal
      title="Monitor Created"
      message={`Your status page is live at:`}
      url={`/status/${newStatusSlug}`}
    />
  );
}
```

---

## Module: Design Tokens

**Changes to `app/globals.css`** (per TASK.md blocking items):

```css
@theme {
  /* ... existing tokens */

  /* NEW: Surface tokens for cards/panels */
  --color-surface: #ffffff;
  --color-surface-elevated: #faf9f7;

  /* NEW: Border token */
  --color-border: color-mix(in srgb, var(--color-foreground) 10%, transparent);
  --color-border-strong: color-mix(
    in srgb,
    var(--color-foreground) 20%,
    transparent
  );

  /* NEW: Accent color for interactive elements */
  --color-accent: #0066cc;
}

.dark {
  --color-surface: #1a1a1a;
  --color-surface-elevated: #242424;
  --color-accent: #4da6ff;
}

/* NEW: Display text utility (editorial headlines) */
.text-display {
  font-family: var(--font-serif);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* NEW: Mono text utility (technical values) */
.text-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

---

## File Organization

```
app/
  status/
    [statusSlug]/
      page.tsx          # NEW: Individual monitor status page

components/
  StatusPageHero.tsx    # NEW: Giant editorial status display
  DashboardMonitorCard.tsx  # MODIFY: Add status page link

convex/
  schema.ts             # MODIFY: Add statusSlug field + index
  monitors.ts           # MODIFY: Auto-generate slug on create
  slugs.ts              # NEW: Slug generation utilities
  migrations.ts         # MODIFY: Add statusSlug backfill
  incidents.ts          # MODIFY: Add getPublicIncidentsForMonitor

lib/
  domain/
    slugs.ts            # NEW: Word lists (shared with convex/slugs.ts)

app/
  globals.css           # MODIFY: Add surface/border/accent tokens
  s/                    # DELETE: Remove project-level status pages
```

**Files to delete**:

- `app/s/[slug]/page.tsx` — replaced by `/status/[statusSlug]`

---

## Testing Strategy

**Unit Tests**:

- `convex/slugs.test.ts`: Slug format validation, uniqueness retry logic
- `lib/domain/slugs.test.ts`: Word list coverage, pattern matching

**Integration Tests**:

- Monitor creation includes statusSlug
- Status page returns 404 for invalid slugs
- Status page returns 404 for private monitors

**E2E Tests**:

- Create monitor → see status page URL → visit page → see status
- Dashboard card → click status page link → opens in new tab

---

## Migration Plan

1. **Deploy schema change**: Add `statusSlug` field (optional initially)
2. **Deploy queries**: New public query for status slug lookup
3. **Run migration**: Backfill existing monitors with status slugs
4. **Make field required**: Update schema to require statusSlug
5. **Deploy new route**: `/status/[statusSlug]` page
6. **Update dashboard**: Add status page links
7. **Delete old route**: Remove `/s/[slug]` after confirming migration complete

---

## What We're NOT Building

Per TASK.md:

- ❌ Copy-to-clipboard buttons (browser does this)
- ❌ Public/private toggle (all status pages are public)
- ❌ Subscribe/RSS (later, with notifications)
- ❌ Custom slugs/domains/branding (paid features)
- ❌ Badges/embeds (feature creep)
- ❌ `/status` index page (one monitor = one URL)

---

## Implementation Order

1. **Design tokens** (blocking per TASK.md)
2. **Schema + migration** (foundation)
3. **Slug generator** (pure function, easy to test)
4. **Monitor create mutation** (auto-generate slug)
5. **Public query** (lookup by statusSlug)
6. **StatusPageHero component** (editorial design)
7. **Status page route** (ISR, follows existing pattern)
8. **Dashboard integration** (link + success feedback)
9. **Delete `/s/[slug]`** (cleanup)
10. **E2E test** (create → view flow)
