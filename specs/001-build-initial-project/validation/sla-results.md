---
description: "SLA timing validation protocol and results for SC-001, SC-002, SC-003, SC-006"
---

# SLA Timing Validation

**Purpose**: Define and execute a repeatable timing protocol for the success criteria that carry an
explicit time bound, and record measured durations across at least 3 runs each.

**Status**: Protocol defined and instrumented; **not executed** in the authoring environment (no
provisioned Postgres, Pinecone, or OpenAI credentials — see `final-readiness.md`). A person or CI
job with a staged environment should follow the steps below and fill in the results tables.

## Instrumentation already in the codebase

- `src/lib/solicitation-extractor.ts` enforces a 180-second timeout on the GPT-4o extraction call
  and raises `ExtractionTimeoutError` (`504`) if exceeded — this bounds SC-002 by construction.
- `src/lib/parsers/pdf.ts` / `src/lib/indexing.ts` reject files over 25 MB (`PayloadTooLargeError`,
  `413`) before parsing begins, bounding worst-case processing time for SC-001.
- Every API route returns JSON error bodies with a `code` field, so failures during timing runs are
  unambiguous (grep server logs / responses for `code`).

## Protocol

For each success criterion below, use representative sample files (see suggestions) and record wall
clock time from request start to response received, using either:
- Browser DevTools Network tab timing, or
- `time curl -F "file=@sample.pdf" https://<host>/api/documents` (adjust per endpoint)

Run each scenario **3 times minimum** and record all runs plus the max.

### SC-001 — Document indexed within 2 minutes (files under 20 MB)

Endpoint: `POST /api/documents`

| Run | File | Size | Duration | Pass (< 120s)? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### SC-002 — Solicitation summary within 3 minutes (up to 50 pages)

Endpoint: `POST /api/solicitations`

| Run | File | Pages | Duration | Pass (< 180s)? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### SC-003 — Draft proposal section within 2 minutes

Endpoint: `POST /api/proposals/draft`

| Run | Solicitation | Section type | Duration | Pass (< 120s)? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### SC-006 — Word export within 1 minute

Endpoint: `POST /api/exports`

| Run | Solicitation | # sections | Duration | Pass (< 60s)? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## Summary

| Criterion | Runs passing | Overall result |
|---|---|---|
| SC-001 | /3 | |
| SC-002 | /3 | |
| SC-003 | /3 | |
| SC-006 | /3 | |
