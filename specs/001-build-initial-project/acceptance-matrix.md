---
description: "Acceptance matrix mapping US1-US4 independent tests to FR-001..FR-013"
---

# Acceptance Matrix: Build Initial Project — GovCon Proposal Assistant

**Purpose**: Trace each user story's independent test to the functional requirements it exercises,
and record pass/fail evidence. This matrix is a template populated by manual/QA execution against a
running instance (Postgres + Pinecone + OpenAI + Clerk credentials configured) — it was not
executed automatically in the environment that authored this implementation because no live
database, vector store, or LLM credentials were provisioned there (see
`validation/final-readiness.md` for details).

## How to use this matrix

For each row: run the independent test against a deployed/staged instance, then fill in **Result**
(Pass / Fail / Blocked) and **Evidence** (screenshot path, request/response log, or a short note).

## User Story 1 — Upload Company Knowledge Base

**Independent Test**: Upload one PDF and one DOCX to a fresh workspace → both appear as processed
documents with no solicitation or draft required.

| FR | Requirement | Verified by | Result | Evidence |
|---|---|---|---|---|
| FR-001 | Per-company isolated knowledge bases | Two workspaces upload distinct documents; cross-check `GET /api/documents` from each | | |
| FR-002 | Accepts PDF and DOCX, extracts text | Upload one PDF + one DOCX; confirm `status: "indexed"` | | |
| FR-003 | Confirms success / surfaces actionable failure | Upload a valid file (success) and a corrupted file (failure message) | | |
| FR-004 | Rejects unsupported formats with clear message | Upload a `.txt` file → expect `415 UNSUPPORTED_MEDIA_TYPE` | | |
| FR-012 | Detects and rejects scanned/image-only PDFs | Upload an image-only PDF → expect `422 SCANNED_PDF` | | |
| FR-013 | Duplicate uploads skip re-indexing | Upload the same file twice → expect `409 DUPLICATE_DOCUMENT` on the second attempt | | |

## User Story 2 — Parse and Summarize a Solicitation

**Independent Test**: Upload a solicitation PDF to a workspace with no company documents → receive
a structured summary without drafting anything.

| FR | Requirement | Verified by | Result | Evidence |
|---|---|---|---|---|
| FR-005 | Extracts requirements, criteria, and deadline | `POST /api/solicitations` with a sample RFP PDF; inspect response body | | |
| FR-006 | Presents parsed content as a structured checklist | Visit `/dashboard/solicitations/[id]`; confirm requirements list + criteria table render | | |
| (edge case) | Missing/ambiguous deadline is not fabricated | Upload an RFP with no stated due date → `deadline: null`, UI shows "Not found" | | |
| (edge case) | Corrupted/password-protected PDF surfaces a clear error | Upload a password-protected PDF → expect `422 CORRUPTED_FILE` | | |

## User Story 3 — Draft Proposal Sections from Company Knowledge

**Independent Test**: With seeded knowledge base and solicitation, request a Technical Approach
draft → receive a cited draft with editable text.

| FR | Requirement | Verified by | Result | Evidence |
|---|---|---|---|---|
| FR-007 | Retrieves relevant content from the company's own knowledge base | `POST /api/proposals/draft`; confirm `citations` array is non-empty when KB is populated | | |
| FR-008 | Every claim/paragraph cites a source document | Inspect `content[].sourceDocumentId` for each paragraph in the response | | |
| FR-009 | No fabrication; flags limited coverage explicitly | Request a draft against an empty/near-empty KB → expect `limitedCoverage: true` and a visible warning banner | | |
| FR-010 | Edits are preserved as the working draft | `PATCH /api/proposals/drafts/[id]`; reload `GET` and confirm `editedContent` persists | | |

## User Story 4 — Export Draft to Word Document

**Independent Test**: With a saved (edited) draft, click Export → receive a `.docx` containing the
edited text, openable in Word/Google Docs without errors.

| FR | Requirement | Verified by | Result | Evidence |
|---|---|---|---|---|
| FR-011 | Exports drafted/edited sections to `.docx` | `POST /api/exports`; open the returned file in Word/Google Docs | | |
| (edge case) | Exported content reflects edits, not the original AI draft | Edit a paragraph, export, confirm the exported text matches the edit | | |

## Cross-cutting

| FR | Requirement | Verified by | Result | Evidence |
|---|---|---|---|---|
| FR-001 / SC-005 | Zero cross-company data leakage across documents, drafts, retrieval, and exports | See `validation/isolation-results.md` | | |
