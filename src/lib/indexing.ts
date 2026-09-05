import {
  createDocument,
  findDocumentByCompanyAndHash,
  replaceDocumentChunks,
  updateDocumentStatus,
} from "@/lib/db/documents";
import { chunkText } from "@/lib/chunker";
import { embedChunks } from "@/lib/embeddings";
import { DuplicateDocumentError, PayloadTooLargeError } from "@/lib/errors";
import { sha256FromBuffer } from "@/lib/hash";
import { parseDocx } from "@/lib/parsers/docx";
import { MAX_PDF_SIZE_BYTES, parsePdf } from "@/lib/parsers/pdf";
import { upsertDocumentVectors } from "@/lib/vectorstore";

const PDF_MIME_TYPE = "application/pdf";
const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Applies to all supported file types so DOCX uploads are bounded the same
// way as the PDF-specific guard in src/lib/parsers/pdf.ts.
export const MAX_DOCUMENT_SIZE_BYTES = MAX_PDF_SIZE_BYTES;

export async function indexDocument({
  companyId,
  fileName,
  fileType,
  buffer,
}: {
  companyId: string;
  fileName: string;
  fileType: string;
  buffer: Buffer;
}) {
  if (buffer.byteLength > MAX_DOCUMENT_SIZE_BYTES) {
    throw new PayloadTooLargeError(
      "This file exceeds the 25 MB processing limit. Split it into smaller files and re-upload.",
    );
  }

  const sha256Hash = sha256FromBuffer(buffer);
  const existingDocument = await findDocumentByCompanyAndHash(companyId, sha256Hash);

  if (existingDocument) {
    throw new DuplicateDocumentError();
  }

  const document = await createDocument({
    companyId,
    name: fileName,
    fileType,
    sha256Hash,
    status: "processing",
  });

  try {
    const extractedText =
      fileType === PDF_MIME_TYPE ? (await parsePdf(buffer)).text : await parseDocx(buffer);
    const chunks = chunkText(extractedText);
    const embeddings = await embedChunks(chunks);

    await upsertDocumentVectors({
      companyId,
      documentId: document.id,
      documentName: fileName,
      embeddings,
    });
    await replaceDocumentChunks(document.id, chunks);

    return updateDocumentStatus(document.id, "indexed");
  } catch (error) {
    await updateDocumentStatus(document.id, "failed");
    throw error;
  }
}

export function isSupportedDocumentType(fileType: string) {
  return fileType === PDF_MIME_TYPE || fileType === DOCX_MIME_TYPE;
}
