"use client";

import { useState } from "react";

type ExportButtonProps = {
  solicitationId: string;
};

type ErrorPayload = {
  error?: string;
};

export function ExportButton({ solicitationId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitationId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
        throw new Error(payload.error ?? "Export failed.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const fileName = match?.[1] ?? "proposal.docx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="rounded-full border border-sky-400/60 px-5 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-400"
      >
        {isExporting ? "Exporting…" : "Export to Word"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
