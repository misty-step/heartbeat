# API v1 Conventions

Canonical contract for Heartbeat API v1. All `/api/v1/*` routes follow this document.

## Content Types

- Success responses: `application/json`
- Error responses: `application/problem+json`

## Authentication

- API routes require `Authorization: Bearer <api_key>` unless marked public.
- Missing/invalid auth returns `401` Problem Details.
- Valid key with missing scope returns `403` Problem Details.

## Error Envelope (RFC 9457-compatible)

Every non-2xx response returns:

```json
{
  "type": "https://heartbeat.dev/problems/not-found",
  "title": "Monitor not found",
  "status": 404,
  "detail": "No monitor exists for this id",
  "instance": "/api/v1/monitors/mon_123",
  "requestId": "req_01hv..."
}
```

Required members:

- `type`
- `title`
- `status`
- `detail` (required unless intentionally omitted for security)
- `instance`

Extension members are allowed (for example `requestId`, `code`, `retryAfter`).

## Timestamps and IDs

- Timestamps: RFC 3339 / ISO 8601 UTC strings (`2026-03-03T18:22:10.123Z`)
- Resource IDs: stable string IDs (`mon_...`, `inc_...`, `chk_...`, `key_...`)
- Numeric durations are milliseconds unless field explicitly says seconds.

## Cursor Pagination

List endpoints return:

```json
{
  "data": [],
  "page": {
    "limit": 50,
    "nextCursor": "cur_abc123"
  }
}
```

Rules:

- Request query: `limit` (default `50`, max `200`), optional `cursor`
- `nextCursor = null` means terminal page
- Invalid cursor returns `400` Problem Details
- Cursor is opaque and must not be parsed by clients

## Filtering and Sorting

Common query conventions:

- `projectSlug=<slug>`
- `status=<up|degraded|down|investigating|resolved>`
- `from=<rfc3339>` / `to=<rfc3339>`
- `sort=<field>` and `order=<asc|desc>`

Rules:

- Unknown filter/sort field returns `400` Problem Details
- If `from > to`, return `400`
- If both `sort` and `order` omitted, route uses deterministic default sort

## Idempotency (POST/PATCH)

- Header: `Idempotency-Key`
- Replay window: 24 hours
- Key scope: method + route + authenticated principal

Behavior:

- First request with a key is processed and stored with response status/body hash.
- Exact replay (same payload) within window returns original response (`Idempotent-Replayed: true`).
- Same key with different payload returns `409` Problem Details (`type` = conflict/idempotency).
- Expired keys are ignored and treated as new requests.

Example conflict error:

```json
{
  "type": "https://heartbeat.dev/problems/idempotency-conflict",
  "title": "Idempotency key conflict",
  "status": 409,
  "detail": "The same idempotency key was already used with a different payload.",
  "instance": "/api/v1/monitors"
}
```
