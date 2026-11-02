import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-8">
      <aside className="md:w-60 md:shrink-0">
        <DashboardNav role={user.role} name={user.name} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
