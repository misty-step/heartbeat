# Delivery Retro Log

## 2026-03-03 - Issue #108

- predicted: effort/s
- actual: effort/m
- scope: added tier-aware retention in cleanup action + shared `historyDays` constant + retention tests
- blocker: pre-push failed initially due to pulse interval mismatch in new test; fixed by using tier-valid interval
- pattern: retention rules tied to billing need shared server-side constants to avoid drift

## 2026-03-03 - Issue #128 (Phase 0 via #129/#130)

- predicted: effort/m
- actual: effort/m
- scope: added API conventions doc, OpenAPI v1 scaffold for planned endpoints, reusable contract helpers/tests, CI OpenAPI lint gate
- blocker: OpenAPI 3.1 nullable semantics (`nullable`) failed lint; fixed via JSON Schema union/null patterns
- pattern: contract-first slices de-risk large epics by landing CI-enforced schemas before runtime endpoints
