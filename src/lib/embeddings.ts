import { getOpenAIClient } from "@/lib/openai";
import type { TextChunk } from "@/lib/chunker";

export type EmbeddedChunk = {
  chunk: TextChunk;
  embedding: number[];
};

export async function embedChunks(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: chunks.map((chunk) => chunk.text),
  });

  return chunks.map((chunk, index) => ({
    chunk,
    embedding: response.data[index]?.embedding ?? [],
  }));
}
