export type TextChunk = {
  chunkIndex: number;
  text: string;
};

const CHUNK_SIZE = 512;
const OVERLAP_SIZE = 50;

export function chunkText(text: string) {
  const tokens = text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (tokens.length === 0) {
    return [] satisfies TextChunk[];
  }

  const chunks: TextChunk[] = [];
  const step = Math.max(CHUNK_SIZE - OVERLAP_SIZE, 1);

  for (let start = 0; start < tokens.length; start += step) {
    const slice = tokens.slice(start, start + CHUNK_SIZE);
    if (slice.length === 0) {
      continue;
    }

    chunks.push({
      chunkIndex: chunks.length,
      text: slice.join(" "),
    });

    if (start + CHUNK_SIZE >= tokens.length) {
      break;
    }
  }

  return chunks;
}
