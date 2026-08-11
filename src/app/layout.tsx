import type { Metadata } from "next";
import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovCon Proposal Assistant",
  description: "Workspace for indexing company knowledge and preparing proposals.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { orgId, userId } = await auth();
  const workspaceLabel = orgId ? `Organization ${orgId}` : userId ? "Personal workspace" : "Guest";

  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="min-h-screen bg-slate-950 text-slate-100">
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 backdrop-blur">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                    GovCon Proposal Assistant
                  </p>
                  <h1 className="mt-1 text-lg font-semibold text-slate-50">{workspaceLabel}</h1>
                </div>
                <div className="flex items-center gap-3">
                  {userId ? <UserButton /> : (
                    <SignInButton mode="modal">
                      <button className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200">
                        Sign in
                      </button>
                    </SignInButton>
                  )}
                </div>
              </header>
              <main className="flex-1 px-6 py-8">{children}</main>
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
