---
description: "Cross-company isolation validation: negative tests for API, retrieval, and export paths (SC-005)"
---

# Cross-Company Isolation Validation

**Purpose**: Confirm SC-005 — "Zero cross-company data leakage — documents from Company A are never
surfaced in Company B's drafts, searches, or exports under any conditions" — with explicit negative
tests across API access, retrieval, and export paths.

**Status**: Code-level guards are implemented and reviewed (see below); **live negative-test
execution was not performed** in the authoring environment because no Postgres/Pinecone/Clerk
credentials were provisioned there to create two real company workspaces (see
`final-readiness.md`). The protocol below is ready to run against a staged environment with two
Clerk organizations.

## Isolation guards implemented in code (reviewed as part of this task)

| Layer | Mechanism | Location |
|---|---|---|
| Workspace resolution | `companyId` is always derived server-side from the authenticated Clerk `orgId`, never accepted from client input | `src/lib/workspace.ts` (`resolveCompanyIdFromOrg`) |
| Prisma reads | Every route re-checks `assertCompanyAccess(companyId, resource.companyId)` (or the nested solicitation's `companyId` for drafts/exports) before returning data | `src/app/api/documents/route.ts`, `src/app/api/solicitations/route.ts`, `src/app/api/solicitations/[id]/route.ts`, `src/app/api/proposals/draft/route.ts`, `src/app/api/proposals/drafts/[id]/route.ts`, `src/app/api/exports/route.ts` |
| Vector store | Pinecone queries and upserts are scoped to a per-company namespace `company:{companyId}`; query results are additionally filtered by `metadata.companyId === companyId` as defense-in-depth against namespace misconfiguration | `src/lib/vectorstore.ts` |
| Draft/export bulk export | Every draft fetched for a solicitation is individually re-checked against the resolved `companyId` before its content is included in a `.docx` export | `src/app/api/exports/route.ts` |
| UI pages (SSR) | `notFound()` is returned (rather than leaking a 403 that would reveal existence) when a `ForbiddenError` is thrown while loading a solicitation/draft by ID | `src/app/dashboard/solicitations/[id]/page.tsx`, `src/app/dashboard/proposals/[id]/page.tsx` |

## Negative test protocol (run against a staged environment)

Requires two Clerk organizations, Org A and Org B, each mapped to its own `Company` row on first
use.

| # | Test | Steps | Expected result | Result |
|---|---|---|---|---|
| 1 | Document list isolation | Org A uploads Doc-A; sign in as Org B; call `GET /api/documents` | Doc-A does not appear in Org B's list | |
| 2 | Document direct access | (If a direct-by-id document route is added) request Org A's document id while authenticated as Org B | `403 FORBIDDEN` | |
| 3 | Retrieval isolation | Org A uploads a distinctive capability statement; Org B (empty KB) requests a draft | Org B's draft has `citations: []` and `limitedCoverage: true`; no Org A content appears in `content` | |
| 4 | Solicitation direct access | Org A parses Solicitation-A; Org B requests `GET /api/solicitations/{solicitationAId}` | `403 FORBIDDEN` | |
| 5 | Draft direct access | Org A generates Draft-A; Org B requests `GET /api/proposals/drafts/{draftAId}` | `403 FORBIDDEN` | |
| 6 | Draft edit isolation | Org B attempts `PATCH /api/proposals/drafts/{draftAId}` | `403 FORBIDDEN`; Draft-A content unchanged | |
| 7 | Export isolation | Org B attempts `POST /api/exports` with `solicitationId` belonging to Org A | `403 FORBIDDEN`; no file returned | |
| 8 | UI page isolation | Org B navigates directly to `/dashboard/solicitations/{solicitationAId}` and `/dashboard/proposals/{draftAId}` | Next.js 404 page (no data leaked) | |

## Summary

- All 8 negative tests: _pending execution against a staged two-organization environment_.
- Code review conclusion: every read/write path that touches `Document`, `Solicitation`,
  `ProposalSection`, `Draft`, or `Export` records re-validates `companyId` against the
  server-resolved workspace before returning or mutating data; Pinecone access is additionally
  namespace-scoped and metadata-filtered.
