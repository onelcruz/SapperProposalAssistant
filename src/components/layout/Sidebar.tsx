"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base" },
  { href: "/dashboard/solicitations/new", label: "Solicitations" },
  { href: "/dashboard/proposals/new", label: "Proposal Drafts" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-800/80 bg-slate-950/95 p-6 lg:flex lg:flex-col">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Sapper</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Proposal Assistant</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Capture organizational knowledge, then prepare compliant proposal content from a secure
          workspace.
        </p>
      </div>

      <nav className="mt-8 space-y-2">
        {navigationItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-sky-400/15 text-sky-200"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Current phase</p>
        <p className="mt-2 leading-6 text-slate-400">
          Knowledge base ingestion, solicitation parsing, cited proposal drafting, and Word export
          are all implemented end-to-end.
        </p>
      </div>
    </aside>
  );
}
