import "server-only";

import { prisma } from "@/lib/prisma";

export async function createExportRecord(draftId: string, fileUrl: string | null = null) {
  return prisma.export.create({
    data: { draftId, fileUrl },
  });
}

export async function listExportsByDraftId(draftId: string) {
  return prisma.export.findMany({
    where: { draftId },
    orderBy: { createdAt: "desc" },
  });
}
