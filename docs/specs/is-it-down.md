# Is It Down Spec

## Goal

Ship a top-of-funnel public tool that answers:

- `Is this service down for everyone?`
- `Or is it likely local to me?`

This is a distribution surface for Heartbeat, not a separate product.

## User Experience

1. User opens `/is-it-down`.
2. User enters domain or URL (`github.com`, `https://example.com`).
3. System runs fresh probes (with short cache guard) and shows:
   - verdict
   - short explanation
   - recent probe evidence
   - active incident context from matching public Heartbeat monitors
4. User can visit indexable pages at `/is-it-down/[hostname]`.

## Scope (v1)

- Convex-backed probe history (`serviceChecks`)
- Managed tracked services (`serviceTargets`)
- On-demand public probe action with SSRF protection
- Scheduled probe cron for tracked targets
- Daily cleanup cron for probe history
- Public pages:
  - `/is-it-down`
  - `/is-it-down/[hostname]`
- JSON API:
  - `GET /api/is-it-down?target=<domain-or-url>`
- Sitemap inclusion for tracked host pages

## Out of Scope (v1)

- Crowd-sourced “me too” outage reports
- Per-region probe infrastructure
- Authenticated alert subscription from the tool page
- External provider integrations

## Data Model

### `serviceTargets`

- `hostname`
- `url`
- `label`
- `enabled`
- `createdAt`, `updatedAt`

### `serviceChecks`

- `hostname`
- `url`
- `status` (`up` | `down`)
- `statusCode?`
- `responseTime`
- `errorMessage?`
- `source` (`scheduled` | `on_demand`)
- `targetId?`
- `checkedAt`

## Verdict Rules

Verdicts:

- `likely_down_for_everyone`
- `likely_local_issue`
- `unclear_retrying`
- `no_data`

Evidence inputs:

- recent probe samples
- active incidents from matching public monitors

Rule summary:

- Any active incident => `likely_down_for_everyone`
- Recent majority down (>=2 and greater than up) => `likely_down_for_everyone`
- Recent majority up (>=2 and at least down count) => `likely_local_issue`
- No samples => `no_data`
- Otherwise => `unclear_retrying`

## Semantics Justification (LLM-First Exception)

This classification is intentionally deterministic in v1.

Reason:

- Hard real-time request path
- Low-latency and low-cost requirement for public anonymous traffic
- Contract must be stable and explainable for API consumers

Tradeoff:

- Less nuanced than an LLM-based assessor
- Possible edge-case misclassification under mixed partial failures

Mitigation:

- Surface raw probe evidence + incident context
- Keep verdict labels probabilistic (“likely”, “unclear”)
- Revisit LLM adjudication after stable traffic baseline and eval suite

## Acceptance Criteria

- User can check any valid public URL/domain at `/is-it-down`
- Tool persists probe evidence and can reuse recent samples
- Tracked targets are probed on schedule via cron
- `/is-it-down/[hostname]` renders indexed service pages
- `/api/is-it-down` returns machine-readable snapshot JSON
- SSRF guard blocks internal/private targets
