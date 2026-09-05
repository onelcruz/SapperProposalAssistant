# Sapper Proposal Assistant

A private, per-company AI workspace for small government-contracting (GovCon) firms. It ingests a
company's own capability statements and past performance documents, parses incoming solicitations
(RFPs), drafts cited proposal sections grounded in that company's own material, and exports the
result to a Word document.

Built with Next.js (App Router), Prisma + Postgres, Pinecone (vector store), OpenAI (embeddings +
GPT-4o), and Clerk (auth / multi-tenancy).

See `specs/001-build-initial-project/` for the full feature spec, implementation plan, task list,
and validation artifacts.

## Architecture overview

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router, React) | Server components for data-heavy pages, client components for interactive forms/editors |
| Backend API | Next.js Route Handlers (`src/app/api/**`) | Co-located with the frontend; all routes run on the Node.js runtime |
| Auth / multi-tenancy | Clerk | `src/middleware.ts` protects `/dashboard` and `/api` routes; `src/lib/workspace.ts` resolves the active `Company` from the Clerk `orgId` |
| Database | Postgres via Prisma (`src/lib/prisma.ts`) | Schema in `prisma/schema.prisma`: `Company`, `Document`, `DocumentChunk`, `Solicitation`, `ProposalSection`, `Draft`, `Export` |
| Vector store | Pinecone (`src/lib/pinecone.ts`, `src/lib/vectorstore.ts`) | Each company's chunks live in a dedicated namespace `company:{companyId}` — the primary cross-company isolation boundary |
| LLM | OpenAI GPT-4o (chat) + `text-embedding-ada-002` (embeddings) | `src/lib/openai.ts` wraps the client with exponential-backoff retries for transient errors |
| Document parsing | `pdf-parse` (PDF) + `mammoth` (DOCX) | `src/lib/parsers/*` |
| Word export | `docx` (npm package) | `src/lib/exporter.ts` assembles a `.docx` `Buffer` streamed back from `POST /api/exports` |

### Request flow per user story

1. **Knowledge base upload** (`/dashboard/knowledge-base`) — `POST /api/documents` hashes the file
   (dedup), extracts text, chunks it, embeds the chunks, upserts them into Pinecone, and persists
   `Document`/`DocumentChunk` rows. Status progresses `processing` → `indexed` | `failed`.
2. **Solicitation parsing** (`/dashboard/solicitations/new` → `/dashboard/solicitations/[id]`) —
   `POST /api/solicitations` extracts PDF text, sends it to GPT-4o in JSON mode to extract
   requirements/criteria/deadline, and persists a `Solicitation` row. A missing deadline is stored
   as `null` and shown as "Not found" rather than fabricated.
3. **Cited drafting** (`/dashboard/proposals/new` → `/dashboard/proposals/[id]`) —
   `POST /api/proposals/draft` embeds the solicitation requirements, retrieves the top-10 relevant
   chunks from the company's Pinecone namespace, and asks GPT-4o to draft the requested section
   with per-paragraph citations. Fewer than 3 retrieved chunks sets `limitedCoverage: true`, shown
   as a warning banner. Edits auto-save via `PATCH /api/proposals/drafts/[id]`.
4. **Word export** — `POST /api/exports` loads every draft for a solicitation (preferring
   `editedContent` over the original `content`), assembles a `.docx` via the `docx` package, logs
   an `Export` record per draft, and streams the file back for download.

## Local development setup

### Prerequisites

- Node.js 20+
- A Postgres database
- A Pinecone index and API key
- An OpenAI API key
- A Clerk application (publishable + secret keys)

### Install & configure

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # applies prisma/migrations/ to your database
```

Create a `.env.local` file with the following variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string used by Prisma |
| `OPENAI_API_KEY` | OpenAI API key (embeddings + GPT-4o) |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_ENVIRONMENT` | Pinecone environment/region for your project |
| `PINECONE_INDEX_NAME` | (optional) Pinecone index name; defaults to `govcon-proposal-assistant` |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key exposed to the browser |

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Clerk, and select/create an
organization — every workspace is scoped to a Clerk organization (`orgId`), which resolves to a
`Company` row on first use (`src/lib/workspace.ts`).

### Other scripts

```bash
npm run lint    # ESLint (next/core-web-vitals + next/typescript)
npm run build   # Production build
npm run start   # Serve the production build
```

## Repository layout

```
src/
  app/
    api/                 # Route handlers (documents, solicitations, proposals, exports)
    dashboard/            # Authenticated pages (knowledge base, solicitations, proposals)
  components/
    knowledge-base/       # Document list UI
    layout/                # Sidebar / app shell
    proposals/             # Draft editor, export button
    ui/                    # Shared FileUpload, Skeleton, ErrorBoundary
  lib/
    db/                    # Prisma data-access layers per model group
    parsers/                # PDF / DOCX / solicitation text extraction
    *.ts                    # Chunking, embeddings, retrieval, drafting, export, workspace, errors
prisma/                    # Prisma schema + migrations
specs/001-build-initial-project/
  tasks.md                 # Task list (this feature's implementation plan)
  validation/               # SLA, citation-coverage, isolation, and readiness evidence
```

## Known limitations

- There is no background job queue: document indexing and solicitation/draft LLM calls run
  synchronously within a single request. The `GET /api/documents/:id/status` SSE endpoint and the
  upload UI's "Processing…" state approximate progress feedback without true streaming.
- Automated integration tests for cross-company isolation are documented as a manual verification
  protocol in `specs/001-build-initial-project/validation/isolation-results.md` — this environment
  has no provisioned Postgres/Pinecone/OpenAI credentials to execute them end-to-end.
