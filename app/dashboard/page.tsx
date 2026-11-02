import Link from "next/link";
import { all, get } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateTime, inr } from "@/lib/format";
import { smsProvider } from "@/lib/sms";
import { PageHeader, Stat } from "@/components/ui";

export default async function Overview() {
  const user = await requireUser();
  const recent = await all<{ id: number; title: string; body: string; link: string; created_at: string }>(
    "SELECT id, title, body, link, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 6",
    [user.id],
  );

  if (user.role === "owner") {
    const s = (await get<Record<string, number>>(
      `SELECT
        (SELECT COUNT(*) FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1) rooms,
        (SELECT COUNT(*) FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1 AND r.status = 'vacant') vacant,
        (SELECT COUNT(*) FROM applications a JOIN rooms r ON r.id = a.room_id JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1 AND a.status = 'pending') apps,
        (SELECT COUNT(*) FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1 AND t.active = 1) tenants,
        (SELECT COUNT(*) FROM service_requests s JOIN tenancies t ON t.id = s.tenancy_id JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1 AND s.status != 'resolved') requests,
        (SELECT COALESCE(SUM(b.total), 0) FROM bills b JOIN tenancies t ON t.id = b.tenancy_id JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1 AND b.status != 'paid') due,
        (SELECT COUNT(*) FROM bills b JOIN tenancies t ON t.id = b.tenancy_id JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id WHERE p.owner_id = ?1 AND b.status = 'claimed') claimed`,
      [user.id],
    ))!;

    return (
      <div>
        <PageHeader
          title={`Hello, ${user.name.split(" ")[0]}`}
          subtitle="Here is what needs your attention."
          action={
            <Link href="/dashboard/properties" className="btn btn-primary">
              + Add room
            </Link>
          }
        />
        {s.rooms === 0 && (
          <div className="card mb-6 border-brand-100 bg-brand-50 p-5">
            <h2 className="font-semibold">Get started in 3 steps</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Add your building or flat as a property (set electricity rate, water & maintenance).</li>
              <li>Add rooms with photos and rent — vacant rooms appear on the public listing.</li>
              <li>Approve applications; tenants join your group and get bills by SMS.</li>
            </ol>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Rooms (vacant)" value={`${s.rooms} (${s.vacant})`} href="/dashboard/properties" />
          <Stat label="Pending applications" value={s.apps} href="/dashboard/applications" />
          <Stat label="Active tenants" value={s.tenants} href="/dashboard/tenants" />
          <Stat label="Open requests" value={s.requests} href="/dashboard/requests" />
          <Stat label="Outstanding dues" value={inr(s.due)} href="/dashboard/bills" />
          <Stat label="Payments to confirm" value={s.claimed} href="/dashboard/bills?status=claimed" />
          <Stat label="SMS mode" value={<span className="text-base">{smsProvider === "log" ? "Outbox only" : smsProvider}</span>} href="/dashboard/sms" />
        </div>
        <RecentActivity items={recent} />
      </div>
    );
  }

  const tenancy = await get<{ title: string; property_name: string; rent: number }>(
    `SELECT r.title, p.name property_name, t.rent FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id
     WHERE t.tenant_id = ? AND t.active = 1 ORDER BY t.id DESC LIMIT 1`,
    [user.id],
  );
  const s = (await get<Record<string, number>>(
    `SELECT
      (SELECT COUNT(*) FROM applications WHERE tenant_id = ?1 AND status = 'pending') apps,
      (SELECT COALESCE(SUM(b.total), 0) FROM bills b JOIN tenancies t ON t.id = b.tenancy_id WHERE t.tenant_id = ?1 AND b.status = 'unpaid') due,
      (SELECT COUNT(*) FROM service_requests s JOIN tenancies t ON t.id = s.tenancy_id WHERE t.tenant_id = ?1 AND s.status != 'resolved') requests`,
    [user.id],
  ))!;

  return (
    <div>
      <PageHeader title={`Hello, ${user.name.split(" ")[0]}`} subtitle={tenancy ? `${tenancy.title} · ${tenancy.property_name}` : "You have not moved in anywhere yet."} />
      {!tenancy && (
        <div className="card mb-6 p-5">
          <p className="text-slate-700">Browse vacant rooms with photos and apply in one click.</p>
          <Link href="/rooms" className="btn btn-primary mt-3">
            Find a room
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Amount due" value={inr(s.due)} href="/dashboard/bills" />
        <Stat label="Pending applications" value={s.apps} href="/dashboard/applications" />
        <Stat label="Open requests" value={s.requests} href="/dashboard/requests" />
      </div>
      <RecentActivity items={recent} />
    </div>
  );
}

function RecentActivity({ items }: { items: { id: number; title: string; body: string; link: string; created_at: string }[] }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 font-semibold">Recent updates</h2>
      {items.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className="p-4">
              <Link href={n.link || "/dashboard/notifications"} className="block hover:text-brand-600">
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="muted">{n.body}</p>}
                <p className="mt-1 text-xs text-slate-400">{dateTime(n.created_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
