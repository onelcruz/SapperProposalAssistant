import "server-only";

import { embedChunks } from "@/lib/embeddings";
import { queryDocumentVectors, type RetrievedDocumentVector } from "@/lib/vectorstore";

const TOP_K = 10;

export type RetrievedChunk = RetrievedDocumentVector;

/**
 * Embeds the solicitation requirements text and queries Pinecone for the
 * top-K most relevant chunks in the company's own namespace. Returns an
 * empty array (rather than throwing) when there is no query text or no
 * indexed content — the drafter treats this as "limited coverage".
 */
export async function retrieveRelevantChunks({
  companyId,
  queryText,
  topK = TOP_K,
}: {
  companyId: string;
  queryText: string;
  topK?: number;
}): Promise<RetrievedChunk[]> {
  const trimmedQuery = queryText.trim();

  if (trimmedQuery.length === 0) {
    return [];
  }

  const [embedded] = await embedChunks([{ chunkIndex: 0, text: trimmedQuery }]);

  if (!embedded || embedded.embedding.length === 0) {
    return [];
  }

  return queryDocumentVectors({
    companyId,
    embedding: embedded.embedding,
    topK,
  });
}
