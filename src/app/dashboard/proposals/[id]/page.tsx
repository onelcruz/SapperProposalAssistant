import { notFound } from "next/navigation";
import { ExportButton } from "@/components/proposals/ExportButton";
import { DraftEditor } from "@/components/proposals/DraftEditor";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { findDocumentNamesByIds } from "@/lib/db/documents";
import { findDraftById } from "@/lib/db/proposals";
import { ForbiddenError } from "@/lib/errors";
import { sectionTypeLabel, toDraftParagraphs } from "@/lib/proposal-types";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export default async function ProposalDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = await resolveCompanyIdFromOrg();

  let draft;
  try {
    draft = await findDraftById(id);
    if (!draft) {
      notFound();
    }
    assertCompanyAccess(companyId, draft.section.solicitation.companyId);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      notFound();
    }
    throw error;
  }

  const paragraphs = toDraftParagraphs(draft.editedContent ?? draft.content);
  const documentIds = Array.from(
    new Set(paragraphs.map((paragraph) => paragraph.sourceDocumentId).filter(Boolean)),
  );
  const documentNamesById = await findDocumentNamesByIds(documentIds);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
            User story 3
          </span>
          <h2 className="mt-1 text-3xl font-semibold text-white">
            {sectionTypeLabel(draft.section.sectionType)}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Solicitation: {draft.section.solicitation.name}
          </p>
        </div>
        <ExportButton solicitationId={draft.section.solicitationId} />
      </div>

      <ErrorBoundary>
        <DraftEditor
          draftId={draft.id}
          initialParagraphs={paragraphs}
          limitedCoverage={draft.limitedCoverage}
          documentNamesById={documentNamesById}
        />
      </ErrorBoundary>

      {documentIds.length > 0 ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-white">Cited source documents</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {documentIds.map((documentId) => (
              <li key={documentId} className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2">
                {documentNamesById[documentId] ?? documentId}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
