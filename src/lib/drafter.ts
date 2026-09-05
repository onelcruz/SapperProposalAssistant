import "server-only";

import { getOpenAIClient, withOpenAIRetry } from "@/lib/openai";
import { sectionTypeLabel, toDraftParagraphs, type DraftParagraph } from "@/lib/proposal-types";
import type { RetrievedChunk } from "@/lib/retrieval";

export type DraftResult = {
  paragraphs: DraftParagraph[];
  limitedCoverage: boolean;
};

const DRAFT_MODEL = "gpt-4o";
// Fewer than this many retrieved chunks is treated as limited source coverage
// and surfaced to the user rather than silently producing a thin draft.
const MIN_CHUNKS_FOR_FULL_COVERAGE = 3;

const SYSTEM_PROMPT = `You are a proposal writer for a small government contracting (GovCon) firm. You draft proposal sections using ONLY the company source material provided to you.

Respond ONLY with a JSON object of the shape:
{ "paragraphs": [{ "text": string, "sourceDocumentId": string, "sourceExcerpt": string }] }

Rules:
- Every paragraph that draws on the provided source material MUST set "sourceDocumentId" to the matching document id and "sourceExcerpt" to the exact excerpt it was drawn from.
- NEVER fabricate capabilities, past performance, or facts that are not supported by the provided source material or the solicitation requirements.
- If the provided source material does not cover a requirement, write a brief best-effort paragraph that explicitly acknowledges the gap (e.g. "Limited company source material was available for this area."), and set "sourceDocumentId" to an empty string for that paragraph.
- Address the solicitation requirements directly wherever the source material allows it.`;

function buildSourceMaterialBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "(No relevant source material was found in the company knowledge base.)";
  }

  return chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1} | documentId=${chunk.documentId} | document=${chunk.documentName}]\n${chunk.chunk}`,
    )
    .join("\n\n");
}

/**
 * Constructs a grounded drafting prompt from retrieved company source
 * chunks + solicitation requirements, and calls GPT-4o in JSON mode to
 * produce cited paragraphs. Sets `limitedCoverage: true` when fewer than
 * three chunks were retrieved (see FR-009 — no-fabrication policy).
 */
export async function generateDraft({
  sectionType,
  requirements,
  chunks,
}: {
  sectionType: string;
  requirements: string[];
  chunks: RetrievedChunk[];
}): Promise<DraftResult> {
  const openai = getOpenAIClient();

  const requirementsBlock =
    requirements.length > 0 ? requirements.map((requirement) => `- ${requirement}`).join("\n") : "(none provided)";

  const userPrompt = `Section type: ${sectionTypeLabel(sectionType)}

Solicitation requirements:
${requirementsBlock}

Available company source material:
${buildSourceMaterialBlock(chunks)}

Draft the ${sectionTypeLabel(sectionType)} section for this proposal, citing sourceDocumentId/sourceExcerpt for each paragraph drawn from the material above.`;

  const completion = await withOpenAIRetry(() =>
    openai.chat.completions.create({
      model: DRAFT_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  );

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const paragraphs = toDraftParagraphs(
    typeof parsed === "object" && parsed !== null ? (parsed as { paragraphs?: unknown }).paragraphs : undefined,
  );

  return {
    paragraphs,
    limitedCoverage: chunks.length < MIN_CHUNKS_FOR_FULL_COVERAGE,
  };
}
