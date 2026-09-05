import { createExportRecord } from "@/lib/db/exports";
import { listDraftsBySolicitation } from "@/lib/db/proposals";
import { findSolicitationById } from "@/lib/db/solicitations";
import { ApiRouteError, errorResponse, NotFoundResourceError } from "@/lib/errors";
import { buildProposalDocx } from "@/lib/exporter";
import { toDraftParagraphs } from "@/lib/proposal-types";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function toFileName(name: string) {
  const sanitized = name.replace(/[^a-z0-9-_ ]/gi, "").trim();
  return `${sanitized.length > 0 ? sanitized : "proposal"}.docx`;
}

export async function POST(request: Request) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const body = await request.json().catch(() => null);
    const solicitationId = typeof body?.solicitationId === "string" ? body.solicitationId : null;

    if (!solicitationId) {
      throw new ApiRouteError("solicitationId is required.", "INVALID_EXPORT_REQUEST", 400);
    }

    const solicitation = await findSolicitationById(solicitationId);
    if (!solicitation) {
      throw new NotFoundResourceError("Solicitation not found.");
    }
    assertCompanyAccess(companyId, solicitation.companyId);

    const drafts = await listDraftsBySolicitation(solicitationId);

    if (drafts.length === 0) {
      throw new ApiRouteError(
        "No drafted sections exist for this solicitation yet.",
        "NO_DRAFTS_TO_EXPORT",
        409,
      );
    }

    // Cross-company isolation guard: every draft's parent solicitation must
    // belong to the resolved company before any content is exported.
    for (const draft of drafts) {
      assertCompanyAccess(companyId, draft.section.solicitation.companyId);
    }

    const buffer = await buildProposalDocx({
      title: solicitation.name,
      sections: drafts.map((draft) => ({
        sectionType: draft.section.sectionType,
        // Edited content always wins over the original AI draft (FR-010, FR-011).
        paragraphs: toDraftParagraphs(draft.editedContent ?? draft.content),
      })),
    });

    await Promise.all(drafts.map((draft) => createExportRecord(draft.id)));

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": DOCX_MIME_TYPE,
        "Content-Disposition": `attachment; filename="${toFileName(solicitation.name)}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
