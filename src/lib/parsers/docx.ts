import mammoth from "mammoth";
import { CorruptedFileError } from "@/lib/errors";

export async function parseDocx(buffer: Buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.replace(/\s+/g, " ").trim();
  } catch {
    throw new CorruptedFileError("The DOCX file could not be parsed.");
  }
}
