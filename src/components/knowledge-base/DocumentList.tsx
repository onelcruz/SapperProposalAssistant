"use client";

import { useEffect, useState } from "react";
import { SkeletonList } from "@/components/ui/Skeleton";

type DocumentListProps = {
  reloadKey?: number;
};

type DocumentRecord = {
  id: string;
  companyId: string;
  name: string;
  fileType: string;
  status: string;
  createdAt: string;
};

type DocumentsResponse = {
  documents?: DocumentRecord[];
  error?: string;
};

const formatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DocumentList({ reloadKey = 0 }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/documents", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as DocumentsResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load documents.");
        }

        setDocuments(data.documents ?? []);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          fetchError instanceof Error ? fetchError.message : "Unable to load documents.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => controller.abort();
  }, [reloadKey]);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Uploaded documents</h3>
          <p className="mt-1 text-sm text-slate-400">
            Indexed documents are ready for company-scoped retrieval.
          </p>
        </div>
      </div>

      {isLoading ? <div className="mt-6"><SkeletonList rows={3} /></div> : null}
      {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}
      {!isLoading && !error && documents.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">No documents uploaded for this workspace yet.</p>
      ) : null}

      {!isLoading && !error && documents.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/40 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="px-4 py-3 text-white">{document.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
                      {document.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {formatter.format(new Date(document.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
