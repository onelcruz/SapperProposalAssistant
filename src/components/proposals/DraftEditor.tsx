"use client";

import { useEffect, useRef, useState } from "react";
import type { DraftParagraph } from "@/lib/proposal-types";

type DraftEditorProps = {
  draftId: string;
  initialParagraphs: DraftParagraph[];
  limitedCoverage: boolean;
  documentNamesById: Record<string, string>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1200;

export function DraftEditor({
  draftId,
  initialParagraphs,
  limitedCoverage,
  documentNamesById,
}: DraftEditorProps) {
  const [paragraphs, setParagraphs] = useState(initialParagraphs);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function persist(nextParagraphs: DraftParagraph[]) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSaveState("saving");
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/proposals/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editedContent: nextParagraphs }),
        });

        if (!response.ok) {
          throw new Error("Save failed.");
        }

        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, AUTOSAVE_DELAY_MS);
  }

  function updateParagraphText(index: number, text: string) {
    const next = paragraphs.map((paragraph, paragraphIndex) =>
      paragraphIndex === index ? { ...paragraph, text } : paragraph,
    );
    setParagraphs(next);
    persist(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {limitedCoverage ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <p className="font-semibold">Limited source coverage</p>
          <p className="mt-1 text-amber-300/90">
            Fewer than three relevant company documents were found for this section. Review this
            draft carefully — some paragraphs may lack citations and should be revised before use.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-end text-xs text-slate-400" aria-live="polite">
        {saveState === "saving" && "Saving…"}
        {saveState === "saved" && "Saved"}
        {saveState === "error" && "Save failed — check your connection and try again."}
      </div>

      <div className="flex flex-col gap-4">
        {paragraphs.length === 0 ? (
          <p className="text-sm text-slate-400">This draft has no paragraphs yet.</p>
        ) : null}

        {paragraphs.map((paragraph, index) => (
          <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <textarea
              value={paragraph.text}
              onChange={(event) => updateParagraphText(index, event.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 focus:border-sky-400 focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {paragraph.sourceDocumentId ? (
                <span
                  title={paragraph.sourceExcerpt || "No excerpt captured for this citation."}
                  className="cursor-help rounded-full bg-sky-400/15 px-3 py-1 font-semibold text-sky-200"
                >
                  Source: {documentNamesById[paragraph.sourceDocumentId] ?? paragraph.sourceDocumentId}
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-3 py-1 font-semibold text-slate-400">
                  No citation — not supported by the knowledge base
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
