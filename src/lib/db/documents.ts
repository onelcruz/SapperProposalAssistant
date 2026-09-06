import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TextChunk } from "@/lib/chunker";

const documentSummarySelect = {
  id: true,
  companyId: true,
  name: true,
  fileType: true,
  sha256Hash: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DocumentSelect;

export type DocumentSummary = Prisma.DocumentGetPayload<{
  select: typeof documentSummarySelect;
}>;

export async function createDocument(data: {
  companyId: string;
  name: string;
  fileType: string;
  sha256Hash: string;
  status?: string;
}) {
  return prisma.document.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      fileType: data.fileType,
      sha256Hash: data.sha256Hash,
      status: data.status ?? "processing",
    },
    select: documentSummarySelect,
  });
}

export async function findDocumentByCompanyAndHash(companyId: string, sha256Hash: string) {
  return prisma.document.findUnique({
    where: {
      companyId_sha256Hash: {
        companyId,
        sha256Hash,
      },
    },
    select: documentSummarySelect,
  });
}

export async function updateDocumentStatus(documentId: string, status: string) {
  return prisma.document.update({
    where: { id: documentId },
    data: { status },
    select: documentSummarySelect,
  });
}

export async function replaceDocumentChunks(documentId: string, chunks: TextChunk[]) {
  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { documentId } }),
    prisma.documentChunk.createMany({
      data: chunks.map((chunk) => ({
        documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
      })),
    }),
  ]);
}

export async function listDocumentsByCompany(companyId: string) {
  return prisma.document.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: documentSummarySelect,
  });
}

export async function findDocumentNamesByIds(documentIds: string[]) {
  if (documentIds.length === 0) {
    return {} as Record<string, string>;
  }

  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    select: { id: true, name: true },
  });

  return Object.fromEntries(documents.map((document) => [document.id, document.name])) as Record<
    string,
    string
  >;
}
