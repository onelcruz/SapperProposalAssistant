import { PDFParse } from "pdf-parse";
import { CorruptedFileError, ScannedPdfError } from "@/lib/errors";

export async function parsePdf(buffer: Buffer) {
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
