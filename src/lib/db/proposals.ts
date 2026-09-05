import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const draftSelect = {
  id: true,
  sectionId: true,
  content: true,
  editedContent: true,
  limitedCoverage: true,
  createdAt: true,
  updatedAt: true,
  section: {
    select: {
      id: true,
      sectionType: true,
      solicitationId: true,
      solicitation: {
        select: {
          id: true,
          companyId: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.DraftSelect;

export type DraftRecord = Prisma.DraftGetPayload<{ select: typeof draftSelect }>;

export async function createProposalSection(data: { solicitationId: string; sectionType: string }) {
  return prisma.proposalSection.create({
    data: {
      solicitationId: data.solicitationId,
      sectionType: data.sectionType,
    },
  });
}

export async function createDraft(data: {
  sectionId: string;
  content: Prisma.InputJsonValue;
  limitedCoverage: boolean;
}) {
  return prisma.draft.create({
    data: {
      sectionId: data.sectionId,
      content: data.content,
      limitedCoverage: data.limitedCoverage,
    },
    select: draftSelect,
  });
}

export async function findDraftById(draftId: string) {
  return prisma.draft.findUnique({
    where: { id: draftId },
    select: draftSelect,
  });
}

export async function updateDraftEditedContent(draftId: string, editedContent: Prisma.InputJsonValue) {
  return prisma.draft.update({
    where: { id: draftId },
    data: { editedContent },
    select: draftSelect,
  });
}

export async function listDraftsBySolicitation(solicitationId: string) {
  return prisma.draft.findMany({
    where: { section: { solicitationId } },
    orderBy: { createdAt: "asc" },
    select: draftSelect,
  });
}
