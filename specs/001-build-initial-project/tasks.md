---

description: "Task list for Build Initial Project — GovCon Proposal Assistant"
---

# Tasks: Build Initial Project — GovCon Proposal Assistant

**Input**: Design documents from `/specs/001-build-initial-project/`

**Prerequisites**: plan.md ✅, spec.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js + TypeScript project with all required dependencies and tooling.

- [x] T001 Initialize Next.js project with TypeScript in repository root (`npx create-next-app@latest . --typescript --tailwind --app --src-dir`)
- [x] T002 Install core dependencies: `openai`, `@prisma/client`, `prisma`, `pdf-parse`, `mammoth`, `docx`, `@pinecone-database/pinecone` (`npm install`)
- [x] T003 [P] Install dev dependencies: `eslint`, `prettier`, `@types/pdf-parse`, `@types/node` (`npm install -D`)
- [x] T004 [P] Configure ESLint and Prettier in `.eslintrc.json` and `.prettierrc`
- [x] T005 [P] Create `.env.example` listing all required environment variables: `DATABASE_URL`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [x] T006 Create `src/` directory structure: `app/`, `components/`, `lib/`, `api/` (Next.js App Router layout)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure — database schema, auth, vector store client, and shared utilities — that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Initialize Prisma and configure `DATABASE_URL` in `prisma/schema.prisma`; define all models: `Company`, `Document`, `DocumentChunk`, `Solicitation`, `ProposalSection`, `Draft`, `Export`
- [x] T008 Write and run initial Prisma migration (`npx prisma migrate dev --name init`); commit `prisma/migrations/`
- [x] T009 [P] Set up Clerk authentication: install `@clerk/nextjs`, wrap app in `<ClerkProvider>` in `src/app/layout.tsx`, protect all API routes via middleware in `src/middleware.ts`
- [x] T010 [P] Implement company-workspace resolver in `src/lib/workspace.ts` — resolves `companyId` from the authenticated Clerk `orgId` on every request
- [x] T011 [P] Create Pinecone client singleton in `src/lib/pinecone.ts` — initialized with `PINECONE_API_KEY` and `PINECONE_ENVIRONMENT`
- [x] T012 [P] Create OpenAI client singleton in `src/lib/openai.ts` — initialized with `OPENAI_API_KEY`
- [x] T013 [P] Create Prisma client singleton in `src/lib/prisma.ts`
- [x] T014 Implement shared error-handling utility in `src/lib/errors.ts` — standard API error shape `{ error: string, code: string }`
- [x] T015 [P] Build basic app shell: sidebar nav, workspace context header in `src/app/layout.tsx` and `src/components/layout/Sidebar.tsx`
- [x] T016 [P] Create shared file-upload UI component in `src/components/ui/FileUpload.tsx` — handles drag-and-drop, shows progress, surfaces errors

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Upload Company Knowledge Base (Priority: P1) 🎯 MVP

**Goal**: A GovCon firm owner can upload PDF/DOCX documents; the system extracts text, detects scanned PDFs and duplicates, embeds chunks, stores them in a company-namespaced Pinecone index, and confirms success — all isolated per company.

**Independent Test**: Upload one PDF and one DOCX to a fresh workspace → both appear as processed documents with no solicitation or draft required.

### Implementation for User Story 1

- [x] T017 [P] [US1] Create `Document` data-access layer in `src/lib/db/documents.ts` — CRUD helpers wrapping Prisma `Document` model
- [x] T018 [P] [US1] Implement SHA-256 hash utility in `src/lib/hash.ts` using Node.js `crypto`; used for duplicate detection
- [x] T019 [P] [US1] Implement PDF text extractor in `src/lib/parsers/pdf.ts` using `pdf-parse`; throw `ScannedPdfError` when extracted text length < 100 chars for multi-page documents
- [x] T020 [P] [US1] Implement DOCX text extractor in `src/lib/parsers/docx.ts` using `mammoth`
- [x] T021 [US1] Implement text chunker in `src/lib/chunker.ts` — splits extracted text into overlapping chunks (512 tokens, 50-token overlap) suitable for embedding
- [x] T022 [US1] Implement embedding service in `src/lib/embeddings.ts` — calls `openai.embeddings.create` with `text-embedding-ada-002`; returns `{ chunk, embedding }[]`
- [x] T023 [US1] Implement Pinecone upsert helper in `src/lib/vectorstore.ts` — upserts vectors under namespace `company:{companyId}`; includes `documentId` and `chunkIndex` metadata
- [x] T024 [US1] Create document indexing orchestrator in `src/lib/indexing.ts` — orchestrates: hash check → parse → chunk → embed → upsert → persist `Document` + `DocumentChunk` records; updates `Document.status` (`processing` → `indexed` or `failed`)
- [x] T025 [US1] Implement upload API route in `src/app/api/documents/route.ts` (`POST /api/documents`): validate file type (PDF/DOCX only → 415 if unsupported), stream to buffer, call indexing orchestrator, return `{ documentId, status }`
- [x] T026 [US1] Implement documents list API route in `src/app/api/documents/route.ts` (`GET /api/documents`): return all documents for the authenticated company workspace
- [x] T027 [US1] Build Knowledge Base upload page in `src/app/dashboard/knowledge-base/page.tsx` — uses `FileUpload` component, calls `POST /api/documents`, shows per-file status (processing / indexed / error with message)
- [x] T028 [US1] Build documents list component in `src/components/knowledge-base/DocumentList.tsx` — lists uploaded documents with name, status, and upload date; fetches from `GET /api/documents`
- [x] T029 [US1] Add cross-company isolation guard to all document API handlers in `src/app/api/documents/route.ts` — assert `document.companyId === resolvedCompanyId` before returning any data

**Checkpoint**: User Story 1 is fully functional — document upload, dedup, scanned-PDF rejection, indexing, and isolation all work independently.

---

## Phase 4: User Story 2 — Parse and Summarize a Solicitation (Priority: P2)

**Goal**: A user uploads an RFP PDF; the system extracts requirements, evaluation criteria, and the response deadline using GPT-4o, persists the structured data, and displays a review checklist — within 3 minutes.

**Independent Test**: Upload a solicitation PDF to a workspace with no company documents → receive a structured summary without drafting anything.

### Implementation for User Story 2

- [x] T030 [P] [US2] Create `Solicitation` data-access layer in `src/lib/db/solicitations.ts` — CRUD helpers wrapping Prisma `Solicitation` model
- [x] T031 [P] [US2] Implement solicitation parser in `src/lib/parsers/solicitation.ts` — calls `pdf-parse` to extract text; throws `CorruptedFileError` on extraction failure; re-uses `ScannedPdfError` for image-only files
- [x] T032 [US2] Implement LLM extraction service in `src/lib/solicitation-extractor.ts` — sends extracted text to GPT-4o with JSON-mode prompt requesting `{ requirements: string[], criteria: { factor: string, weight?: string }[], deadline: string | null }`; sets `deadline: null` (not fabricated) when absent; enforces 180-second timeout
- [x] T033 [US2] Create solicitation upload API route in `src/app/api/solicitations/route.ts` (`POST /api/solicitations`): accept PDF, parse, call extractor, persist `Solicitation` record, return `{ solicitationId, requirements, criteria, deadline }`
- [x] T034 [US2] Create solicitation get API route in `src/app/api/solicitations/[id]/route.ts` (`GET /api/solicitations/:id`): return persisted solicitation with isolation guard
- [x] T035 [US2] Build solicitation upload page in `src/app/dashboard/solicitations/new/page.tsx` — uses `FileUpload` component, calls `POST /api/solicitations`, redirects to summary page on success
- [x] T036 [US2] Build solicitation summary page in `src/app/dashboard/solicitations/[id]/page.tsx` — displays requirements checklist, evaluation criteria table, deadline badge (or "Not found" if null)
- [x] T037 [US2] Add progress feedback for solicitation processing in `src/app/dashboard/solicitations/new/page.tsx` — polling or SSE to show "Parsing…" status while the LLM extraction runs

**Checkpoint**: User Story 2 works independently — solicitation upload, extraction, and display function without a knowledge base present.

---

## Phase 5: User Story 3 — Draft Proposal Sections (Priority: P3)

**Goal**: Given a populated knowledge base and a parsed solicitation, the user selects a section type and receives a cited draft grounded in company materials; the user can edit and save the draft.

**Independent Test**: With seeded knowledge base and solicitation, request a Technical Approach draft → receive a cited draft with editable text.

### Implementation for User Story 3

- [x] T038 [P] [US3] Create `ProposalSection` and `Draft` data-access layers in `src/lib/db/proposals.ts` — CRUD helpers wrapping Prisma models
- [x] T039 [P] [US3] Implement retrieval service in `src/lib/retrieval.ts` — embeds the solicitation requirements text, queries Pinecone namespace `company:{companyId}` for top-10 chunks, returns `{ chunk, documentId, score }[]`
- [x] T040 [US3] Implement draft generation service in `src/lib/drafter.ts` — constructs prompt with retrieved chunks (as cited source material) + solicitation requirements + section type; calls GPT-4o with JSON-mode output `{ paragraphs: { text: string, sourceDocumentId: string, sourceExcerpt: string }[] }`; sets `limitedCoverage: true` flag when fewer than 3 chunks retrieved
- [x] T041 [US3] Create draft API route (`POST /api/proposals/draft`) in `src/app/api/proposals/draft/route.ts`: accept `{ solicitationId, sectionType }`, call retrieval + drafter, persist `ProposalSection` + `Draft`, return draft content with citations
- [x] T042 [US3] Create draft save API route (`PATCH /api/proposals/drafts/[id]`) in `src/app/api/proposals/drafts/[id]/route.ts`: accept edited content, update `Draft.editedContent`, return updated draft
- [x] T043 [US3] Create draft get API route (`GET /api/proposals/drafts/[id]`) in `src/app/api/proposals/drafts/[id]/route.ts`: return draft with isolation guard
- [x] T044 [US3] Build draft request UI in `src/app/dashboard/proposals/new/page.tsx` — solicitation selector + section type selector (Technical Approach / Past Performance / Management Approach) + "Generate Draft" button
- [x] T045 [US3] Build rich-text draft editor in `src/components/proposals/DraftEditor.tsx` — renders paragraphs with inline citation tooltips; auto-saves edits to `PATCH /api/proposals/drafts/:id`; shows `limitedCoverage` warning banner when flagged
- [x] T046 [US3] Build draft view page in `src/app/dashboard/proposals/[id]/page.tsx` — loads draft, renders `DraftEditor`, shows citation panel linking back to source documents

**Checkpoint**: User Story 3 works — draft generation with citations, limited-coverage flagging, and edit persistence all function given US1 and US2 outputs.

---

## Phase 6: User Story 4 — Export Draft to Word Document (Priority: P4)

**Goal**: A user with at least one draft or edited proposal section can trigger a `.docx` export and download a readable Word file reflecting their latest edits.

**Independent Test**: With a saved (edited) draft, click Export → receive a `.docx` containing the edited text, openable in Word/Google Docs without errors.

### Implementation for User Story 4

- [x] T047 [P] [US4] Create `Export` data-access layer in `src/lib/db/exports.ts` — CRUD helpers wrapping Prisma `Export` model
- [x] T048 [US4] Implement Word document builder in `src/lib/exporter.ts` — uses `docx` npm package to assemble sections: heading per section type + paragraphs from `Draft.editedContent ?? Draft.content`; returns `Buffer`
- [x] T049 [US4] Create export API route (`POST /api/exports`) in `src/app/api/exports/route.ts`: accept `{ solicitationId }`, load all drafts for that solicitation (using `editedContent` over `content`), call builder, stream `.docx` as `application/vnd.openxmlformats-officedocument.wordprocessingml.document` response; persist `Export` record
- [x] T050 [US4] Add "Export to Word" button to draft view page in `src/app/dashboard/proposals/[id]/page.tsx` and to solicitation summary page in `src/app/dashboard/solicitations/[id]/page.tsx`

**Checkpoint**: User Story 4 works — export produces a valid `.docx` using edited content.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, edge-case handling, and usability improvements across all stories.

- [x] T051 [P] Add large-document guard in `src/lib/parsers/pdf.ts` and `src/lib/indexing.ts` — stream processing for files > 10 MB; surface progress via Server-Sent Events on `GET /api/documents/:id/status`
- [x] T052 [P] Add corrupted/password-protected PDF detection in `src/lib/parsers/solicitation.ts` — catch `pdf-parse` exceptions, return `CorruptedFileError` with user-friendly message
- [x] T053 [P] Add rate-limit and timeout wrappers in `src/lib/openai.ts` — retry with exponential backoff (max 3 attempts) for transient OpenAI errors
- [x] T054 Cross-company isolation audit in `src/app/api/`, `src/lib/retrieval.ts`, and `src/app/api/exports/route.ts` — confirm `companyId` guard is enforced before Prisma, Pinecone, draft retrieval, and export operations; add integration assertions for cross-company denial paths
- [x] T055 [P] Add loading skeletons and error boundary components in `src/components/ui/Skeleton.tsx` and `src/components/ui/ErrorBoundary.tsx`
- [x] T056 [P] Update `README.md` with local dev setup, environment variable guide, and architecture overview

---

## Phase 8: Validation & Acceptance

**Purpose**: Explicitly validate user-story independent tests, functional requirements, and measurable success criteria before release readiness.

- [x] T057 Create acceptance matrix in `specs/001-build-initial-project/acceptance-matrix.md` mapping US1–US4 independent tests to FR-001 through FR-013 with pass/fail evidence fields
- [x] T058 Define and execute SLA timing validation protocol in `specs/001-build-initial-project/validation/sla-results.md` for SC-001, SC-002, SC-003, and SC-006 (minimum 3 runs each with measured durations)
- [x] T059 Define and execute citation-coverage validation in `specs/001-build-initial-project/validation/citation-coverage.md` to confirm SC-004 across representative generated drafts
- [x] T060 Define and execute cross-company isolation validation in `specs/001-build-initial-project/validation/isolation-results.md` with explicit negative tests for API access, retrieval, and exports to verify SC-005
- [x] T061 Define and execute final readiness checklist in `specs/001-build-initial-project/validation/final-readiness.md` covering SC-007 evidence, unresolved risks, and go/no-go decision

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — no other story dependency
- **US2 (Phase 4)**: Depends on Foundational — no dependency on US1
- **US3 (Phase 5)**: Depends on US1 AND US2 (requires knowledge base + solicitation)
- **US4 (Phase 6)**: Depends on US3 (requires at least one draft)
- **Polish (Phase 7)**: Depends on all user stories
- **Validation (Phase 8)**: Depends on US1–US4 and Phase 7 stabilization tasks

### Parallel Opportunities Per Story

#### User Story 1 (parallel start after T016)
```
T017 (Document DAL)    T018 (hash util)    T019 (PDF parser)    T020 (DOCX parser)
         └────────────────────────┬──────────────────────────────────┘
                               T021 (chunker)
                               T022 (embeddings)
                               T023 (vectorstore)
                               T024 (orchestrator)
```

#### User Story 2 (parallel start after T016)
```
T030 (Solicitation DAL)    T031 (solicitation parser)
         └─────────────────────┬──────────────────────
                            T032 (LLM extractor)
                            T033, T034 (API routes)
```

#### User Story 3 (starts after US1 + US2 complete)
```
T038 (Proposal DAL)    T039 (retrieval service)
         └───────────────────┬──────────────────
                          T040 (drafter)
                          T041–T043 (API routes)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (knowledge base upload + indexing)
4. **STOP AND VALIDATE**: Confirm isolated document upload and retrieval work end-to-end
5. Deploy/demo: working knowledge base ingestion

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. **US1** → document ingestion MVP (demo-able)
3. **US2** (parallel with US1 after Foundational) → solicitation parsing added
4. **US3** (requires US1 + US2) → proposal drafting with citations
5. **US4** → Word export
6. **Polish** → hardening and edge cases

### Parallel Team Strategy

With two developers after Phase 2:
- **Dev A**: US1 (knowledge base)
- **Dev B**: US2 (solicitation parsing)
- Once both complete: both work on US3 together, then US4, then Polish

---

## Notes

- `[P]` tasks touch different files and have no incomplete-task dependencies — safe to parallelize
- `[Story]` label maps each task to a specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Validate each story checkpoint before moving to the next priority
