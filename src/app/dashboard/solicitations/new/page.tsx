"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";

type SolicitationUploadResponse = {
  solicitationId?: string;
  error?: string;
};

export default function NewSolicitationPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
          User story 2
        </span>
        <h2 className="text-3xl font-semibold text-white">Upload a Solicitation</h2>
        <p className="max-w-3xl text-slate-300">
          Upload an RFP, RFQ, or Sources Sought PDF. The system extracts requirements, evaluation
          criteria, and the response deadline using GPT-4o. Larger solicitations (up to ~50 pages)
          may take up to a few minutes to process.
        </p>
      </div>

      <FileUpload
        endpoint="/api/solicitations"
        accept=".pdf,application/pdf"
        multiple={false}
        onComplete={(response) => {
          const data = (response ?? {}) as SolicitationUploadResponse;

          if (data.solicitationId) {
            setIsRedirecting(true);
            router.push(`/dashboard/solicitations/${data.solicitationId}`);
          } else {
            setError(data.error ?? "Unable to process this solicitation.");
          }
        }}
      />

      {isRedirecting ? (
        <p className="text-sm text-sky-300">Parsing complete — loading the summary…</p>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <p className="font-semibold text-slate-200">What happens during processing</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>The uploaded file is parsed for readable text (scanned/image-only PDFs are rejected).</li>
          <li>GPT-4o extracts requirements, evaluation criteria, and a response deadline.</li>
          <li>If no deadline is stated, it is shown as &quot;Not found&quot; rather than guessed.</li>
        </ul>
      </div>
    </div>
  );
}
