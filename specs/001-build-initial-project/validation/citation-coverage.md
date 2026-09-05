---
description: "Citation-coverage validation protocol and results for SC-004"
---

# Citation Coverage Validation

**Purpose**: Confirm SC-004 — "100% of claims in any generated draft section include a citation
traceable to a specific source document in the company knowledge base" — across representative
generated drafts.

**Status**: Protocol defined and enforced at the code level; **not executed against live-generated
drafts** in the authoring environment (no provisioned OpenAI/Pinecone/Postgres credentials — see
`final-readiness.md`).

## How citations are structured

`src/lib/drafter.ts` requests GPT-4o output of the shape:

```json
{ "paragraphs": [{ "text": "...", "sourceDocumentId": "...", "sourceExcerpt": "..." }] }
```

The system prompt instructs the model that:
- Every paragraph drawing on the provided source material **must** set `sourceDocumentId` /
  `sourceExcerpt` to the matching source.
- When no source material supports a paragraph, `sourceDocumentId` is set to an empty string **and**
  the paragraph text must explicitly acknowledge the gap, rather than presenting an uncited claim as
  fact.

`limitedCoverage: true` is also set automatically (`src/lib/drafter.ts`, `MIN_CHUNKS_FOR_FULL_COVERAGE
= 3`) whenever fewer than 3 chunks were retrieved, and is surfaced as a warning banner in
`src/components/proposals/DraftEditor.tsx`.

## Protocol

1. Seed a company workspace with at least 3-5 varied documents (capability statement, past
   performance write-up, resume, certification).
2. Parse a representative solicitation.
3. Generate one draft per section type (Technical Approach, Past Performance, Management Approach).
4. For each generated draft, record:
   - Total paragraph count
   - Paragraphs with a non-empty `sourceDocumentId`
   - Paragraphs with an empty `sourceDocumentId` — confirm each such paragraph's text explicitly
     acknowledges limited coverage (manual read) rather than presenting an unsupported factual claim
5. Repeat with a near-empty knowledge base (1 short document) to exercise the `limitedCoverage`
   path and confirm no fabricated claims appear.

## Results

| Draft (section type) | Total paragraphs | Cited paragraphs | Uncited paragraphs (must self-disclose) | Fabrication observed? | Pass? |
|---|---|---|---|---|---|
| Technical Approach | | | | | |
| Past Performance | | | | | |
| Management Approach | | | | | |
| (limited-coverage run) | | | | | |

## Summary

- SC-004 pass criterion: **cited paragraphs + self-disclosed uncited paragraphs = total paragraphs**
  for every row, with zero instances of fabrication observed.
- Overall result: _pending execution against a live environment_.
