"use client";

import { useState } from "react";
import { DocumentList } from "@/components/knowledge-base/DocumentList";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FileUpload } from "@/components/ui/FileUpload";

export default function KnowledgeBasePage() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
          User story 1
        </span>
        <h2 className="text-3xl font-semibold text-white">Company Knowledge Base</h2>
        <p className="max-w-3xl text-slate-300">
          Upload PDF and DOCX files for this workspace. Each file is hashed, parsed, chunked,
          embedded, and indexed in a company-scoped Pinecone namespace.
        </p>
      </div>

      <FileUpload
        endpoint="/api/documents"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onComplete={() => setReloadKey((value) => value + 1)}
      />

      <ErrorBoundary>
        <DocumentList reloadKey={reloadKey} />
      </ErrorBoundary>
    </div>
  );
}
