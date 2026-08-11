import { Pinecone, type RecordMetadata } from "@pinecone-database/pinecone";

export const DEFAULT_PINECONE_INDEX = "govcon-proposal-assistant";

export type DocumentVectorMetadata = RecordMetadata & {
  companyId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  documentName: string;
};

const globalForPinecone = globalThis as typeof globalThis & {
  pinecone?: Pinecone;
};

export function getPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not configured.");
  }

  if (!globalForPinecone.pinecone) {
    globalForPinecone.pinecone = new Pinecone({ apiKey });
  }

  return globalForPinecone.pinecone;
}

export function getPineconeIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME ?? DEFAULT_PINECONE_INDEX;

  return client.index<DocumentVectorMetadata>(indexName);
}
