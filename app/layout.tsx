import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { logout } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Rents Manager — rooms, tenants & bills in one place",
  description: "Find vacant rooms, apply online, and manage rent, bills, requests and notices for your flats.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user
    ? (await get<{ n: number }>("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND is_read = 0", [user.id]))!.n
    : 0;

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10.5 12 3l9 7.5V21H3z" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              </span>
              <span className="hidden sm:inline">Rents Manager</span>
            </Link>
            <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
              <Link href="/rooms" className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-100 sm:px-3">
                Find rooms
              </Link>
              {user && (
                <Link href="/dashboard" className="whitespace-nowrap rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-100 sm:px-3">
                  Dashboard
                </Link>
              )}
            </nav>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/notifications"
                  className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Notifications"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
                <span className="hidden text-sm text-slate-600 md:inline">
                  {user.name} <span className="text-slate-400">· {user.role}</span>
                </span>
                <form action={logout}>
                  <button className="btn btn-secondary btn-sm">Log out</button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn btn-secondary btn-sm">
                  Log in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t border-slate-200 py-8 text-center text-xs text-slate-400">
          Rents Manager · built on free tiers
        </footer>
      </body>
    </html>
  );
}
