import Link from "next/link";
import { all, run } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { Empty, PageHeader } from "@/components/ui";

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await all<{ id: number; title: string; body: string; link: string; is_read: number; created_at: string }>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100",
    [user.id],
  );
  // Opening this page counts as reading everything on it.
  await run("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [user.id]);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Everything that also went to you by SMS." />
      {items.length === 0 ? (
        <Empty title="All caught up" />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className={n.is_read ? "" : "bg-brand-50/50"}>
              <Link href={n.link || "#"} className="flex gap-3 p-4 hover:bg-slate-50">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-transparent" : "bg-brand-600"}`} />
                <span>
                  <span className="block font-medium">{n.title}</span>
                  {n.body && <span className="muted block">{n.body}</span>}
                  <span className="mt-1 block text-xs text-slate-400">{dateTime(n.created_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
