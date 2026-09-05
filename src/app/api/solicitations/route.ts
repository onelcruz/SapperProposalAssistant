import { NextResponse } from "next/server";
import { createSolicitation, listSolicitationsByCompany } from "@/lib/db/solicitations";
import { errorResponse, UnsupportedMediaTypeError } from "@/lib/errors";
import { parseSolicitationPdf } from "@/lib/parsers/solicitation";
import { extractSolicitation } from "@/lib/solicitation-extractor";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

const PDF_MIME_TYPE = "application/pdf";

function assertPdf(file: File) {
  if (file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith(".pdf")) {
    return;
  }

  throw new UnsupportedMediaTypeError("Only PDF solicitations are supported.");
}

export async function GET() {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const solicitations = await listSolicitationsByCompany(companyId);

    return NextResponse.json({
      solicitations: solicitations.map((solicitation) => {
        assertCompanyAccess(companyId, solicitation.companyId);
        return solicitation;
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new UnsupportedMediaTypeError("A file upload is required.", "FILE_REQUIRED", 400);
    }

    assertPdf(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await parseSolicitationPdf(buffer);
    const extraction = await extractSolicitation(text);

    const solicitation = await createSolicitation({
      companyId,
      name: file.name,
      requirements: extraction.requirements,
      criteria: extraction.criteria,
      deadline: extraction.deadline,
      status: "indexed",
    });

    assertCompanyAccess(companyId, solicitation.companyId);

    return NextResponse.json({
      solicitationId: solicitation.id,
      requirements: solicitation.requirements,
      criteria: solicitation.criteria,
      deadline: solicitation.deadline,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
