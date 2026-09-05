import { NextResponse } from "next/server";
import { findSolicitationById } from "@/lib/db/solicitations";
import { errorResponse, NotFoundResourceError } from "@/lib/errors";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const { id } = await params;
    const solicitation = await findSolicitationById(id);

    if (!solicitation) {
      throw new NotFoundResourceError("Solicitation not found.");
    }

    assertCompanyAccess(companyId, solicitation.companyId);

    return NextResponse.json({ solicitation });
  } catch (error) {
    return errorResponse(error);
  }
}
