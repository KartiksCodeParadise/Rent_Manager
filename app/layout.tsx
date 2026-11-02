import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Bell, LayoutDashboard, LogOut, Search } from "lucide-react";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { logout } from "@/lib/actions/auth";
import { BRAND, Logo } from "@/components/Logo";
import { HeaderShell } from "@/components/HeaderShell";
import { SiteFooter } from "@/components/SiteFooter";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display-face", display: "swap", axes: ["SOFT", "opsz"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: `${BRAND.name} — find rooms & manage rentals`, template: `%s · ${BRAND.name}` },
  description:
    "Find vacant rooms, flats and PGs with photos and apply online. Owners manage tenants, monthly bills, UPI payments, repair requests and building notices — with SMS updates.",
  applicationName: BRAND.name,
  openGraph: {
    title: `${BRAND.name} — find rooms & manage rentals`,
    description: BRAND.tagline,
    siteName: BRAND.name,
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = { themeColor: "#0e524c" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user
    ? (await get<{ n: number }>("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND is_read = 0", [user.id]))!.n
    : 0;

  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <HeaderShell>
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Logo />
            <nav className="ml-2 flex min-w-0 flex-1 items-center gap-1 text-sm font-medium sm:ml-6">
              <Link href="/rooms" className="btn btn-ghost btn-sm whitespace-nowrap">
                <Search size={15} /> <span className="hidden sm:inline">Find rooms</span>
              </Link>
              {user ? (
                <Link href="/dashboard" className="btn btn-ghost btn-sm whitespace-nowrap">
                  <LayoutDashboard size={15} /> <span className="hidden sm:inline">Dashboard</span>
                </Link>
              ) : (
                <Link href="/register?role=owner" className="btn btn-ghost btn-sm hidden whitespace-nowrap md:inline-flex">
                  List your property
                </Link>
              )}
            </nav>
            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/dashboard/notifications"
                  className="relative rounded-xl p-2 text-slate-600 transition hover:bg-white hover:text-brand-700"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 animate-fade-in items-center justify-center rounded-full bg-marigold-500 px-1 text-[10px] font-bold text-white ring-2 ring-cream">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="hidden items-center gap-2 rounded-xl py-1 pr-3 pl-1 text-sm transition hover:bg-white md:flex"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="leading-tight">
                    <span className="block font-medium text-slate-800">{user.name.split(" ")[0]}</span>
                    <span className="block text-[11px] text-slate-500 capitalize">{user.role}</span>
                  </span>
                </Link>
                <form action={logout}>
                  <button className="btn btn-ghost btn-sm" aria-label="Log out">
                    <LogOut size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Log in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </HeaderShell>
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
