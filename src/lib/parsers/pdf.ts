import { PDFParse } from "pdf-parse";
import { CorruptedFileError, PayloadTooLargeError, ScannedPdfError } from "@/lib/errors";

// Hard cap to bound memory usage and processing time for very large uploads
// (see spec.md Edge Cases: "extremely large documents"). Typical documents are
// expected to stay under 20 MB per SC-001.
export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

export async function parsePdf(buffer: Buffer) {
  if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
    throw new PayloadTooLargeError(
      "This PDF exceeds the 25 MB processing limit. Split it into smaller files and re-upload.",
    );
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, " ").trim();

    if (result.total > 1 && text.length < 100) {
      throw new ScannedPdfError();
    }

    return {
      text,
      pageCount: result.total,
    };
  } catch (error) {
    if (error instanceof ScannedPdfError) {
      throw error;
    }

    throw new CorruptedFileError();
  } finally {
    await parser.destroy();
  }
}
