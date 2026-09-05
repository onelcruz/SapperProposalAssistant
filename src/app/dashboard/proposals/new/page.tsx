"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { SECTION_TYPES } from "@/lib/proposal-types";

type SolicitationOption = {
  id: string;
  name: string;
  status: string;
};

type SolicitationsResponse = {
  solicitations?: SolicitationOption[];
  error?: string;
};

type DraftResponse = {
  draftId?: string;
  error?: string;
};

export default function NewProposalDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ solicitationId?: string }>;
}) {
  const router = useRouter();
  const initialSolicitationId = use(searchParams).solicitationId ?? "";

  const [solicitations, setSolicitations] = useState<SolicitationOption[]>([]);
  const [isLoadingSolicitations, setIsLoadingSolicitations] = useState(true);
  const [solicitationId, setSolicitationId] = useState(initialSolicitationId);
  const [sectionType, setSectionType] = useState<string>(SECTION_TYPES[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSolicitations() {
      setIsLoadingSolicitations(true);
      try {
        const response = await fetch("/api/solicitations", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as SolicitationsResponse;
        if (!controller.signal.aborted && response.ok) {
          setSolicitations(data.solicitations ?? []);
        }
      } catch {
        // Non-fatal — the selector simply stays empty and the user can retry.
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSolicitations(false);
        }
      }
    }

    void loadSolicitations();
    return () => controller.abort();
  }, []);

  async function handleGenerate() {
    if (!solicitationId) {
      setError("Select a solicitation first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/proposals/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitationId, sectionType }),
      });
      const data = (await response.json()) as DraftResponse;

      if (!response.ok || !data.draftId) {
        throw new Error(data.error ?? "Unable to generate draft.");
      }

      router.push(`/dashboard/proposals/${data.draftId}`);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate draft.");
      setIsGenerating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
          User story 3
        </span>
        <h2 className="mt-1 text-3xl font-semibold text-white">Draft a Proposal Section</h2>
        <p className="mt-2 text-slate-300">
          Select a parsed solicitation and a section type. The draft is grounded in your company
          knowledge base with inline citations back to source documents.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Solicitation</span>
          <select
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            value={solicitationId}
            onChange={(event) => setSolicitationId(event.target.value)}
            disabled={isLoadingSolicitations}
          >
            <option value="">
              {isLoadingSolicitations ? "Loading solicitations…" : "Select a solicitation…"}
            </option>
            {solicitations.map((solicitation) => (
              <option key={solicitation.id} value={solicitation.id}>
                {solicitation.name} ({solicitation.status})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Section type</span>
          <select
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            value={sectionType}
            onChange={(event) => setSectionType(event.target.value)}
          >
            {SECTION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !solicitationId}
          className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {isGenerating ? "Generating draft…" : "Generate Draft"}
        </button>
      </div>
    </div>
  );
}
