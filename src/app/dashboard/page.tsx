import Link from "next/link";

const cards = [
  {
    href: "/dashboard/knowledge-base",
    title: "Knowledge Base",
    description: "Upload source documents, monitor indexing, and manage company knowledge.",
  },
  {
    href: "/",
    title: "Document Isolation",
    description: "All document access is scoped to the current Clerk organization workspace.",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Dashboard</h2>
        <p className="mt-2 text-slate-300">
          Start by uploading institutional knowledge for your workspace.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-sky-400/60 hover:bg-slate-900"
          >
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
