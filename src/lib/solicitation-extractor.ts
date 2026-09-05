import "server-only";

import { ExtractionTimeoutError } from "@/lib/errors";
import { getOpenAIClient, withOpenAIRetry } from "@/lib/openai";

export type SolicitationCriterion = {
  factor: string;
  weight?: string;
};

export type SolicitationExtraction = {
  requirements: string[];
  criteria: SolicitationCriterion[];
  deadline: string | null;
};

const EXTRACTION_MODEL = "gpt-4o";
const EXTRACTION_TIMEOUT_MS = 180_000;
// Roughly 60k characters keeps the prompt well within GPT-4o's context window
// while covering typical 40-50 page solicitations.
const MAX_INPUT_CHARACTERS = 60_000;

const SYSTEM_PROMPT = `You are a government contracting (GovCon) proposal analyst. You read solicitation documents (RFPs, RFQs, Sources Sought notices) and extract structured information.

Respond ONLY with a JSON object of the shape:
{
  "requirements": string[],
  "criteria": { "factor": string, "weight"?: string }[],
  "deadline": string | null
}

Rules:
- "requirements" is a list of concrete, actionable requirements or deliverables stated in the solicitation.
- "criteria" lists the evaluation factors (and their relative weight or priority when explicitly stated).
- "deadline" is the response due date exactly as stated in the document (e.g. "March 3, 2026, 2:00 PM ET"). If no due date is stated or it is ambiguous, set "deadline" to null. Never invent or guess a date.
- Do not fabricate requirements or criteria that are not present in the text.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function toCriteria(value: unknown): SolicitationCriterion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .filter((item): item is Record<string, unknown> & { factor: string } => typeof item.factor === "string")
    .map((item) => ({
      factor: item.factor,
      weight: typeof item.weight === "string" ? item.weight : undefined,
    }));
}

function toDeadline(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Sends extracted solicitation text to GPT-4o with JSON-mode output requesting
 * requirements, evaluation criteria, and the response deadline. Never fabricates
 * a deadline — it is set to `null` when the model does not find one.
 */
export async function extractSolicitation(text: string): Promise<SolicitationExtraction> {
  const openai = getOpenAIClient();
  const truncatedText = text.slice(0, MAX_INPUT_CHARACTERS);

  let completion;
  try {
    completion = await withOpenAIRetry(() =>
      openai.chat.completions.create(
        {
          model: EXTRACTION_MODEL,
          response_format: { type: "json_object" },
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Solicitation text:\n\n${truncatedText}` },
          ],
        },
        { timeout: EXTRACTION_TIMEOUT_MS },
      ),
    );
  } catch (error) {
    if (error instanceof Error && error.name === "APIConnectionTimeoutError") {
      throw new ExtractionTimeoutError(
        "Solicitation extraction timed out after 180 seconds. Try again or use a shorter document.",
      );
    }
    throw error;
  }

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const parsedRecord = isRecord(parsed) ? parsed : {};

  return {
    requirements: toStringArray(parsedRecord.requirements),
    criteria: toCriteria(parsedRecord.criteria),
    deadline: toDeadline(parsedRecord.deadline),
  };
}
