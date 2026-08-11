"use client";

import { useMemo, useRef, useState } from "react";

type UploadStatus = "queued" | "uploading" | "indexed" | "error";

type UploadEntry = {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  message?: string;
};

type FileUploadProps = {
  accept?: string;
  endpoint: string;
  multiple?: boolean;
  onComplete?: () => void;
};

type ApiError = {
  error?: string;
  code?: string;
};

function createEntry(file: File): UploadEntry {
  return {
    id: `${file.name}-${file.lastModified}`,
    name: file.name,
    progress: 0,
    status: "queued",
  };
}

export function FileUpload({ accept, endpoint, multiple = true, onComplete }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const hasEntries = useMemo(() => entries.length > 0, [entries.length]);

  const updateEntry = (id: string, patch: Partial<UploadEntry>) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const uploadSingleFile = (file: File) => {
    const id = `${file.name}-${file.lastModified}`;

    return new Promise<void>((resolve) => {
      const formData = new FormData();
      formData.append("file", file);

      const request = new XMLHttpRequest();
      request.open("POST", endpoint);
      request.responseType = "json";

      request.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) {
          return;
        }

        updateEntry(id, {
          status: "uploading",
          progress: Math.round((event.loaded / event.total) * 100),
        });
      });

      request.addEventListener("load", () => {
        const body = (request.response as ApiError | null) ?? undefined;

        if (request.status >= 200 && request.status < 300) {
          updateEntry(id, {
            progress: 100,
            status: "indexed",
            message: "Indexed",
          });
          onComplete?.();
        } else {
          updateEntry(id, {
            status: "error",
            message: body?.error ?? "Upload failed.",
          });
        }

        resolve();
      });

      request.addEventListener("error", () => {
        updateEntry(id, {
          status: "error",
          message: "Network error while uploading file.",
        });
        resolve();
      });

      request.send(formData);
    });
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setEntries(files.map(createEntry));
    setIsUploading(true);

    for (const file of files) {
      await uploadSingleFile(file);
    }

    setIsUploading(false);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/20">
      <div
        role="presentation"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
          }
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center transition ${
          isDragging
            ? "border-sky-300 bg-sky-400/10"
            : "border-slate-700 bg-slate-950/30 hover:border-sky-400/60"
        }`}
      >
        <div className="max-w-xl">
          <p className="text-lg font-semibold text-white">Drop PDF or DOCX files here</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Files are uploaded to the current workspace, hashed for duplicate detection, then indexed
            for retrieval.
          </p>
          <button
            type="button"
            disabled={isUploading}
            className="mt-6 rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isUploading ? "Uploading…" : "Choose files"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
      </div>

      {hasEntries ? (
        <div className="mt-6 space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{entry.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {entry.message ?? (entry.status === "uploading" ? "Uploading…" : "Queued")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    entry.status === "indexed"
                      ? "bg-emerald-400/15 text-emerald-300"
                      : entry.status === "error"
                        ? "bg-rose-400/15 text-rose-300"
                        : "bg-sky-400/15 text-sky-200"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className={`h-2 rounded-full transition-all ${
                    entry.status === "error" ? "bg-rose-400" : "bg-sky-400"
                  }`}
                  style={{ width: `${entry.status === "error" ? 100 : entry.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
