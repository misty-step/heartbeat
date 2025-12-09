# Individual Monitor Status Pages

Every monitor gets a beautiful, shareable status page:

```
heartbeat.app/status/silver-mountain-echo
```

## The Feature

**Slug**: Auto-generated 3-word combo on creation (adjective-noun-verb pattern)
**Page**: Giant status hero + 90-day uptime bar + response chart + incidents
**Dashboard**: "View Status Page" link on each monitor card
**Migration**: Generate slugs for existing monitors, delete `/s/[slug]` project pages

## What Makes It Special

The status page is our marketing. Every visitor should think: "I want this for my service."

- **Giant, confident status** — not just a dot, a statement
- **Editorial typography** — serif headlines, generous whitespace
- **The URL itself is memorable** — `silver-mountain-echo` not `k57x3qkx2hd7`
- **Zero friction** — create monitor, get page, share URL

## Implementation

### Schema

```typescript
monitors: defineTable({
  // ... existing fields
  statusSlug: v.string(), // "silver-mountain-echo"
}).index("by_status_slug", ["statusSlug"]);
```

### Route

`/status/[statusSlug]` — ISR 60s revalidation (existing pattern)

### Dashboard Card

Add "View Status Page" link. Opens in new tab. That's it.

### Monitor Creation Success

Show the URL prominently:

```
Your status page is live:
heartbeat.app/status/silver-mountain-echo
[Open Status Page]
```

### Delete Project Pages

Remove `/s/[slug]` entirely. One monitor = one page. Simple.

## Design Tokens (Blocking)

Fix before building (per design review):

- Add `--color-surface`, `--color-border`, `--color-accent` to @theme
- Add `.text-display`, `.text-mono` utility classes
- Create `StatusPageHero` component (giant editorial treatment)

## What We're NOT Building

- Copy-to-clipboard buttons (browser does this)
- Public/private toggle (all status pages are public)
- Subscribe/RSS (later, with notifications work)
- Custom slugs/domains/branding (paid features, later)
- Badges/embeds (feature creep)

## Success

User creates a monitor. User sees their status page URL. User shares it proudly.

That's the whole feature.
