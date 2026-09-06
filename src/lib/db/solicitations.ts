import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const solicitationSelect = {
  id: true,
  companyId: true,
  name: true,
  requirements: true,
  criteria: true,
  deadline: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SolicitationSelect;

export type SolicitationRecord = Prisma.SolicitationGetPayload<{
  select: typeof solicitationSelect;
}>;

export async function createSolicitation(data: {
  companyId: string;
  name: string;
  requirements: string[];
  criteria: Prisma.InputJsonValue;
  deadline: string | null;
  status?: string;
}) {
  return prisma.solicitation.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      requirements: data.requirements,
      criteria: data.criteria,
      deadline: data.deadline,
      status: data.status ?? "processing",
    },
    select: solicitationSelect,
  });
}

export async function findSolicitationById(solicitationId: string) {
  return prisma.solicitation.findUnique({
    where: { id: solicitationId },
    select: solicitationSelect,
  });
}

export async function updateSolicitationStatus(solicitationId: string, status: string) {
  return prisma.solicitation.update({
    where: { id: solicitationId },
    data: { status },
    select: solicitationSelect,
  });
}

export async function listSolicitationsByCompany(companyId: string) {
  return prisma.solicitation.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: solicitationSelect,
  });
}
