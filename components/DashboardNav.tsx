"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  House,
  LayoutDashboard,
  MessagesSquare,
  Receipt,
  Search,
  Send,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

const ownerNav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/properties", "Properties & rooms", Building2],
  ["/dashboard/applications", "Applications", FileText],
  ["/dashboard/tenants", "Tenants", Users],
  ["/dashboard/bills", "Bills", Receipt],
  ["/dashboard/requests", "Service requests", Wrench],
  ["/dashboard/groups", "Groups & notices", MessagesSquare],
  ["/dashboard/sms", "SMS outbox", Send],
  ["/dashboard/notifications", "Notifications", Bell],
  ["/dashboard/settings", "Settings", Settings],
] as const;

const tenantNav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/home", "My home", House],
  ["/dashboard/applications", "My applications", ClipboardList],
  ["/dashboard/bills", "Bills & payments", Receipt],
  ["/dashboard/requests", "Service requests", Wrench],
  ["/dashboard/groups", "Groups & notices", MessagesSquare],
  ["/dashboard/notifications", "Notifications", Bell],
  ["/rooms", "Find rooms", Search],
  ["/dashboard/settings", "Settings", Settings],
] as const;

export function DashboardNav({ role, name }: { role: "owner" | "tenant"; name: string }) {
  const path = usePathname();
  const nav = role === "owner" ? ownerNav : tenantNav;
  // Rooms are edited under Properties, so highlight that entry there too.
  const isActive = (href: string) =>
    href === "/dashboard" ? path === href : path.startsWith(href) || (href === "/dashboard/properties" && path.startsWith("/dashboard/rooms"));

  return (
    <nav className="card p-2 md:sticky md:top-20">
      <div className="mb-2 hidden items-center gap-3 rounded-xl bg-gradient-to-br from-brand-50 to-marigold-50 p-3 md:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 font-display text-lg font-semibold text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-slate-500 capitalize">{role} account</p>
        </div>
      </div>
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {nav.map(([href, label, Icon]) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition duration-200 ${
                  active ? "bg-brand-700 font-semibold text-white shadow-[0_8px_20px_-10px_rgba(14,82,76,0.8)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={17} className={active ? "text-marigold-300" : "text-slate-400"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
