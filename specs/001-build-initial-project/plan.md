# Implementation Plan: Build Initial Project — GovCon Proposal Assistant

**Feature Branch**: `001-build-initial-project`  
**Spec**: `specs/001-build-initial-project/spec.md`  
**Status**: Approved, pending implementation

---

## Overview

Build a private AI workspace for small GovCon firms that ingests their own capability statements and past performance documents, then drafts proposal sections against a new solicitation — with citations grounded in the company's own materials.

---

## Architecture

### Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js (React) | Server-side rendering, file upload handling, rich text editing |
| Backend API | Next.js API routes (Node.js) | Co-located with frontend, reduces infrastructure complexity |
| LLM | OpenAI GPT-4o | Strong instruction-following, citation-capable, JSON-mode support |
| Vector store | Pinecone (or pgvector on Postgres) | Per-namespace isolation maps cleanly to per-company isolation requirement |
| Document parsing | pdf-parse + mammoth | PDF and DOCX text extraction |
| Word export | docx (npm) | Programmatic .docx generation |
| Auth / multi-tenancy | Clerk or NextAuth | Workspace-level isolation keyed by company ID |
| Storage | Vercel Blob or S3 | Raw file storage before parsing |
| Database | Postgres (via Prisma) | Metadata for documents, solicitations, drafts, edits |

---

## Milestones

### M1 — Project Scaffold & Auth
- Initialize Next.js project with TypeScript
- Set up Postgres + Prisma schema (Company, Document, Solicitation, ProposalSection, Draft)
- Integrate authentication (Clerk or NextAuth) with company workspace isolation
- Basic layout shell (sidebar, nav, workspace context)

### M2 — Knowledge Base Upload & Indexing (FR-001 – FR-004, FR-012 – FR-013)
- File upload UI (PDF, DOCX; reject unsupported formats with message)
- Server-side text extraction: pdf-parse for PDFs, mammoth for DOCX
- Detect scanned/image-only PDFs (no extracted text → reject with message)
- Detect duplicate uploads (hash-based deduplication)
- Chunk extracted text and embed with OpenAI embeddings
- Store embeddings in vector store under company-namespaced index
- Store document metadata in Postgres
- Confirm success / surface errors to user

### M3 — Solicitation Parsing (FR-005 – FR-006)
- Solicitation upload UI (PDF)
- Extract text; handle corrupted/password-protected files with clear error
- LLM prompt to extract: requirements list, evaluation criteria + weights, response due date
- Handle missing deadline gracefully (flag as "not found" rather than fabricate)
- Persist parsed solicitation data to Postgres
- Display structured summary (requirements checklist, criteria list, deadline)
- Enforce 3-minute processing SLA with progress feedback to user

### M4 — Proposal Section Drafting (FR-007 – FR-010)
- Draft request UI: user selects solicitation + section type (Technical Approach, Past Performance, Management Approach)
- Retrieve top-k relevant chunks from company vector namespace
- Construct prompt with retrieved chunks, solicitation requirements, and citation instructions
- LLM generates draft with inline citations (source document + excerpt)
- If no relevant source material found: produce best-effort draft, flag limited coverage (no fabrication)
- Persist draft to Postgres
- Rich-text editor for user edits; save edited version as working draft

### M5 — Word Export (FR-011)
- Export button per proposal or per section
- Assemble all drafted/edited sections into a structured .docx via `docx` npm package
- Preserve user edits (not original AI draft) in export
- Offer file download; document must open without encoding errors

### M6 — Hardening & Edge Cases
- Scanned PDF detection (M2 already handles; add regression tests)
- Corrupted / password-protected solicitation handling
- Large document support: stream processing, progress indicators, bound processing time
- Cross-company isolation audit (no data leakage between namespaces)
- Duplicate document detection (M2 already handles; add regression tests)

### M7 — Acceptance Validation & Readiness
- Execute independent-test validation for US1–US4 and document pass/fail evidence
- Run SLA timing validation for SC-001, SC-002, SC-003, and SC-006 with repeatable measurement protocol
- Verify citation coverage for SC-004 across generated draft samples
- Execute explicit cross-company isolation negative tests (API, retrieval, and export paths) for SC-005
- Produce final acceptance checklist tied to FR-001 through FR-013 and SC-001 through SC-007

---

## Data Model (Prisma sketch)

```
Company          { id, name, clerkOrgId, createdAt }
Document         { id, companyId, filename, mimeType, hash, status, createdAt }
DocumentChunk    { id, documentId, content, embedding (via pgvector) }
Solicitation     { id, companyId, filename, requirements[], criteria[], deadline, createdAt }
ProposalSection  { id, solicitationId, companyId, sectionType, status }
Draft            { id, proposalSectionId, content (JSON w/ citations), editedContent, createdAt, updatedAt }
Export           { id, companyId, solicitationId, fileUrl, createdAt }
```

---

## Key Design Decisions

1. **Per-company vector namespace** — each company gets its own namespace in Pinecone (or its own schema/partition in pgvector). This is the primary isolation mechanism for FR-001 / SC-005.

2. **Citations via structured LLM output** — the draft prompt will request JSON output with `{ paragraph, sourceDocumentId, sourceExcerpt }` per claim, so citations are machine-readable and can be rendered with links back to source documents.

3. **No fabrication policy** — the system prompt will explicitly instruct the LLM to respond with a "limited coverage" flag rather than generate claims when no supporting chunks are retrieved. This is enforced at the prompt level.

4. **Hash-based deduplication** — SHA-256 of file contents checked against the Document table before indexing. Duplicate → skip re-indexing and inform user.

5. **Scanned PDF detection** — after text extraction, if extracted text length is below a minimum threshold (e.g., < 100 characters for a multi-page PDF), treat as image-only and reject.

---

## Success Criteria Mapping

| Criterion | Milestone |
|---|---|
| SC-001: Document indexed within 2 min | M2 |
| SC-002: Solicitation summary within 3 min | M3 |
| SC-003: Draft section within 2 min | M4 |
| SC-004: 100% of claims have citations | M4 |
| SC-005: Zero cross-company data leakage | M2, M4, M6 |
| SC-006: Word export within 1 min | M5 |
| SC-007: 60% perceived time reduction | M4 (UX validation post-launch) |

---

## Out of Scope (Initial Build)

- Multi-user collaboration within a workspace
- Mobile device support
- Classified / CUI document handling
- Proposal sections beyond Technical Approach, Past Performance, Management Approach
- Offline functionality
- Autonomous submission to government portals
