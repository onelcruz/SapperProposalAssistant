import "server-only";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, WorkspaceResolutionError } from "@/lib/errors";

export type WorkspaceCompany = {
  id: string;
  clerkOrgId: string;
  name: string;
};

export async function resolveWorkspaceCompany(): Promise<WorkspaceCompany> {
  const { orgId } = await auth();

  if (!orgId) {
    throw new WorkspaceResolutionError();
  }

  return prisma.company.upsert({
    where: { clerkOrgId: orgId },
    update: {},
    create: {
      clerkOrgId: orgId,
      name: `Organization ${orgId}`,
    },
    select: {
      id: true,
      clerkOrgId: true,
      name: true,
    },
  });
}

export async function resolveCompanyIdFromOrg() {
  const company = await resolveWorkspaceCompany();
  return company.id;
}

export function assertCompanyAccess(resolvedCompanyId: string, resourceCompanyId: string) {
  if (resolvedCompanyId !== resourceCompanyId) {
    throw new ForbiddenError();
  }
}
