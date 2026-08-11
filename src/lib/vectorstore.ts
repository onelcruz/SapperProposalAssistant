import type { EmbeddedChunk } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";

export async function upsertDocumentVectors({
  companyId,
  documentId,
  documentName,
  embeddings,
}: {
  companyId: string;
  documentId: string;
  documentName: string;
  embeddings: EmbeddedChunk[];
}) {
  if (embeddings.length === 0) {
    return;
  }

  const index = getPineconeIndex().namespace(`company:${companyId}`);

  await index.upsert({
    records: embeddings.map(({ chunk, embedding }) => ({
      id: `${documentId}:${chunk.chunkIndex}`,
      values: embedding,
      metadata: {
        companyId,
        documentId,
        documentName,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
      },
    })),
  });
}
