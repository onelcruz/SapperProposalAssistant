import { NextResponse } from "next/server";
import { errorResponse, UnsupportedMediaTypeError } from "@/lib/errors";
import { indexDocument } from "@/lib/indexing";
import { listDocumentsByCompany } from "@/lib/db/documents";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

const SUPPORTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function inferFileType(file: File) {
  if (SUPPORTED_TYPES.has(file.type)) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lowerName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  throw new UnsupportedMediaTypeError("Only PDF and DOCX files are supported.");
}

export async function GET() {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const documents = await listDocumentsByCompany(companyId);

    return NextResponse.json({
      documents: documents.map((document) => {
        assertCompanyAccess(companyId, document.companyId);
        return {
          id: document.id,
          companyId: document.companyId,
          name: document.name,
          fileType: document.fileType,
          status: document.status,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        };
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

    const fileType = inferFileType(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const document = await indexDocument({
      companyId,
      fileName: file.name,
      fileType,
      buffer,
    });

    assertCompanyAccess(companyId, document.companyId);

    return NextResponse.json({
      documentId: document.id,
      status: document.status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
