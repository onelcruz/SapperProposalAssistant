import { NextResponse } from "next/server";
import { findDraftById, updateDraftEditedContent } from "@/lib/db/proposals";
import { ApiRouteError, errorResponse, NotFoundResourceError } from "@/lib/errors";
import { toDraftParagraphs } from "@/lib/proposal-types";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

async function loadDraftForCompany(draftId: string, companyId: string) {
  const draft = await findDraftById(draftId);

  if (!draft) {
    throw new NotFoundResourceError("Draft not found.");
  }

  assertCompanyAccess(companyId, draft.section.solicitation.companyId);

  return draft;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const { id } = await params;
    const draft = await loadDraftForCompany(id, companyId);

    return NextResponse.json({ draft });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const { id } = await params;
    await loadDraftForCompany(id, companyId);

    const body = await request.json().catch(() => null);
    if (!Array.isArray(body?.editedContent)) {
      throw new ApiRouteError("editedContent must be an array of paragraphs.", "INVALID_EDIT", 400);
    }

    const editedContent = toDraftParagraphs(body.editedContent);
    const draft = await updateDraftEditedContent(id, editedContent);

    return NextResponse.json({ draft });
  } catch (error) {
    return errorResponse(error);
  }
}
