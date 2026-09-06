import Link from "next/link";

const highlights = [
  "Upload PDF and DOCX company knowledge base files.",
  "Detect duplicates by SHA-256 hash before indexing.",
  "Isolate every request and vector namespace by company workspace.",
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 shadow-2xl shadow-slate-950/30">
        <span className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-200">
          Proposal operations workspace
        </span>
        <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white">
          Centralize company knowledge for faster, safer GovCon proposal drafting.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          This starter implementation focuses on workspace setup, secure company isolation, and the
          knowledge-base ingestion flow for proposal source material.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/dashboard/knowledge-base"
            className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Open knowledge base
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200"
          >
            View dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300"
          >
            {highlight}
          </article>
        ))}
      </section>
    </div>
  );
}
