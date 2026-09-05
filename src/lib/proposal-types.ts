// Plain type/constant definitions shared between server-only modules (drafter,
// exporter, API routes) and client components (DraftEditor, page selectors).
// This file intentionally has no "server-only" import so it can be safely
// imported from both.

export type DraftParagraph = {
  text: string;
  sourceDocumentId: string;
  sourceExcerpt: string;
};

export const SECTION_TYPES = [
  { value: "technical_approach", label: "Technical Approach" },
  { value: "past_performance", label: "Past Performance" },
  { value: "management_approach", label: "Management Approach" },
] as const;

export type SectionType = (typeof SECTION_TYPES)[number]["value"];

export function isSectionType(value: string): value is SectionType {
  return SECTION_TYPES.some((option) => option.value === value);
}

export function sectionTypeLabel(sectionType: string): string {
  return SECTION_TYPES.find((option) => option.value === sectionType)?.label ?? sectionType;
}

export function toDraftParagraphs(value: unknown): DraftParagraph[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      text: typeof item.text === "string" ? item.text : "",
      sourceDocumentId: typeof item.sourceDocumentId === "string" ? item.sourceDocumentId : "",
      sourceExcerpt: typeof item.sourceExcerpt === "string" ? item.sourceExcerpt : "",
    }))
    .filter((paragraph) => paragraph.text.length > 0);
}
