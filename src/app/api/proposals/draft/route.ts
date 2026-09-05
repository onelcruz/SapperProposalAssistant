import { NextResponse } from "next/server";
import { findSolicitationById } from "@/lib/db/solicitations";
import { createDraft, createProposalSection } from "@/lib/db/proposals";
import { generateDraft } from "@/lib/drafter";
import { ApiRouteError, errorResponse, NotFoundResourceError } from "@/lib/errors";
import { isSectionType, SECTION_TYPES } from "@/lib/proposal-types";
import { retrieveRelevantChunks } from "@/lib/retrieval";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const body = await request.json().catch(() => null);

    const solicitationId = typeof body?.solicitationId === "string" ? body.solicitationId : null;
    const sectionType = typeof body?.sectionType === "string" ? body.sectionType : null;

    if (!solicitationId || !sectionType || !isSectionType(sectionType)) {
      throw new ApiRouteError(
        `A valid solicitationId and sectionType (${SECTION_TYPES.map((option) => option.value).join(", ")}) are required.`,
        "INVALID_DRAFT_REQUEST",
        400,
      );
    }

    const solicitation = await findSolicitationById(solicitationId);
    if (!solicitation) {
      throw new NotFoundResourceError("Solicitation not found.");
    }
    assertCompanyAccess(companyId, solicitation.companyId);

    const queryText = [solicitation.name, ...solicitation.requirements].join("\n");
    const chunks = await retrieveRelevantChunks({ companyId, queryText });

    const draftResult = await generateDraft({
      sectionType,
      requirements: solicitation.requirements,
      chunks,
    });

    const section = await createProposalSection({
      solicitationId: solicitation.id,
      sectionType,
    });

    const draft = await createDraft({
      sectionId: section.id,
      content: draftResult.paragraphs,
      limitedCoverage: draftResult.limitedCoverage,
    });

    return NextResponse.json({
      draftId: draft.id,
      sectionId: section.id,
      sectionType,
      content: draft.content,
      limitedCoverage: draft.limitedCoverage,
      citations: chunks.map((chunk) => ({
        documentId: chunk.documentId,
        documentName: chunk.documentName,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
