import Link from "next/link";
import { requireUser } from "@/lib/auth";

const ownerNav = [
  ["/dashboard", "Overview"],
  ["/dashboard/properties", "Properties & rooms"],
  ["/dashboard/applications", "Applications"],
  ["/dashboard/tenants", "Tenants"],
  ["/dashboard/bills", "Bills"],
  ["/dashboard/requests", "Service requests"],
  ["/dashboard/groups", "Groups & notices"],
  ["/dashboard/sms", "SMS outbox"],
  ["/dashboard/settings", "Settings"],
];

const tenantNav = [
  ["/dashboard", "Overview"],
  ["/dashboard/home", "My home"],
  ["/dashboard/applications", "My applications"],
  ["/dashboard/bills", "Bills & payments"],
  ["/dashboard/requests", "Service requests"],
  ["/dashboard/groups", "Groups & notices"],
  ["/rooms", "Find rooms"],
  ["/dashboard/settings", "Settings"],
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const nav = user.role === "owner" ? ownerNav : tenantNav;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <nav className="card flex gap-1 overflow-x-auto p-2 md:sticky md:top-20 md:flex-col">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
