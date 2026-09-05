import Link from "next/link";
import { notFound } from "next/navigation";
import { ExportButton } from "@/components/proposals/ExportButton";
import { findSolicitationById } from "@/lib/db/solicitations";
import { ForbiddenError } from "@/lib/errors";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

type SolicitationCriterion = {
  factor: string;
  weight?: string;
};

function toCriteria(value: unknown): SolicitationCriterion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .filter((item): item is Record<string, unknown> & { factor: string } => typeof item.factor === "string")
    .map((item) => ({
      factor: item.factor,
      weight: typeof item.weight === "string" ? item.weight : undefined,
    }));
}

export default async function SolicitationSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = await resolveCompanyIdFromOrg();

  let solicitation;
  try {
    solicitation = await findSolicitationById(id);
    if (!solicitation) {
      notFound();
    }
    assertCompanyAccess(companyId, solicitation.companyId);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      notFound();
    }
    throw error;
  }

  const criteria = toCriteria(solicitation.criteria);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
            User story 2
          </span>
          <h2 className="mt-1 text-3xl font-semibold text-white">{solicitation.name}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Status: <span className="font-semibold text-slate-200">{solicitation.status}</span>
          </p>
        </div>
        <ExportButton solicitationId={solicitation.id} />
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white">Response deadline</h3>
        {solicitation.deadline ? (
          <span className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-300">
            {solicitation.deadline}
          </span>
        ) : (
          <span className="mt-3 inline-flex rounded-full bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-300">
            Not found
          </span>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white">Requirements checklist</h3>
        {solicitation.requirements.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No requirements were extracted.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {solicitation.requirements.map((requirement, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-200"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-sky-400/60 text-xs text-sky-300">
                  {index + 1}
                </span>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white">Evaluation criteria</h3>
        {criteria.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No evaluation criteria were extracted.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/40 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Factor</th>
                  <th className="px-4 py-3 font-medium">Weight / priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                {criteria.map((criterion, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-white">{criterion.factor}</td>
                    <td className="px-4 py-3 text-slate-300">{criterion.weight ?? "Not stated"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Link
          href={`/dashboard/proposals/new?solicitationId=${solicitation.id}`}
          className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
        >
          Draft a proposal section
        </Link>
      </div>
    </div>
  );
}
