import { PDFParse } from "pdf-parse";
import { CorruptedFileError, ScannedPdfError } from "@/lib/errors";

const MIN_TEXT_LENGTH = 200;

export type ParsedSolicitation = {
  text: string;
  pageCount: number;
};

/**
 * Extracts text from a solicitation PDF. Re-uses `ScannedPdfError` for image-only
 * files (no extractable text) and raises `CorruptedFileError` for corrupted or
 * password-protected files that `pdf-parse` cannot open at all.
 */
export async function parseSolicitationPdf(buffer: Buffer): Promise<ParsedSolicitation> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, " ").trim();

    if (text.length < MIN_TEXT_LENGTH) {
      throw new ScannedPdfError(
        "This solicitation appears to be a scanned or image-only PDF and cannot be parsed. Please upload a text-based PDF.",
      );
    }

    return {
      text,
      pageCount: result.total,
    };
  } catch (error) {
    if (error instanceof ScannedPdfError) {
      throw error;
    }

    throw new CorruptedFileError(
      "The solicitation PDF could not be parsed. It may be corrupted or password-protected.",
    );
  } finally {
    await parser.destroy();
  }
}
