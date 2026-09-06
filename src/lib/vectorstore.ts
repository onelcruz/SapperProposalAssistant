import type { EmbeddedChunk } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";

export type RetrievedDocumentVector = {
  chunk: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  score: number;
};

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

export async function queryDocumentVectors({
  companyId,
  embedding,
  topK,
}: {
  companyId: string;
  embedding: number[];
  topK: number;
}): Promise<RetrievedDocumentVector[]> {
  if (embedding.length === 0) {
    return [];
  }

  const index = getPineconeIndex().namespace(`company:${companyId}`);
  const response = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return (response.matches ?? [])
    // Defense-in-depth: the namespace already isolates companies, but we
    // re-assert the companyId on every match before it can reach a caller.
    .filter((match) => match.metadata?.companyId === companyId)
    .map((match) => ({
      chunk: match.metadata?.text ?? "",
      documentId: match.metadata?.documentId ?? "",
      documentName: match.metadata?.documentName ?? "",
      chunkIndex: match.metadata?.chunkIndex ?? 0,
      score: match.score ?? 0,
    }));
}
