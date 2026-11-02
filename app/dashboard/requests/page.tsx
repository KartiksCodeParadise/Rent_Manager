import { all } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { updateRequest } from "@/lib/actions/owner";
import { createRequest } from "@/lib/actions/tenant";
import { REQUEST_CATEGORIES } from "@/lib/constants";
import { dateTime } from "@/lib/format";
import { Empty, Field, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Req = {
  id: number; category: string; title: string; description: string; status: string; owner_note: string;
  created_at: string; updated_at: string; room_title: string; property_name: string; tenant_name: string; tenant_phone: string;
};

export default async function RequestsPage({ searchParams }: PageProps<"/dashboard/requests">) {
  const user = await requireUser();
  const sp = await searchParams;
  const isOwner = user.role === "owner";

  const reqs = await all<Req>(
    `SELECT s.*, r.title room_title, p.name property_name, u.name tenant_name, u.phone tenant_phone
     FROM service_requests s JOIN tenancies t ON t.id = s.tenancy_id JOIN rooms r ON r.id = t.room_id
     JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = t.tenant_id
     WHERE ${isOwner ? "p.owner_id" : "t.tenant_id"} = ?
     ORDER BY CASE s.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, s.id DESC`,
    [user.id],
  );
  const tenancies = isOwner
    ? []
    : await all<{ id: number; title: string }>(
        "SELECT t.id, r.title FROM tenancies t JOIN rooms r ON r.id = t.room_id WHERE t.tenant_id = ? AND t.active = 1",
        [user.id],
      );

  return (
    <div>
      <PageHeader
        title="Service requests"
        subtitle={isOwner ? "Repairs and complaints from your tenants. Every status change is sent by SMS." : "Report a problem — your owner is notified by SMS."}
      />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      {!isOwner && tenancies.length > 0 && (
        <form action={createRequest} className="card mb-6 space-y-4 p-5">
          <h2 className="font-semibold">New request</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {tenancies.length > 1 ? (
              <Field label="Room">
                <select name="tenancy_id" className="input">
                  {tenancies.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <input type="hidden" name="tenancy_id" value={tenancies[0].id} />
            )}
            <Field label="Category">
              <select name="category" className="input">
                {REQUEST_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <div className={tenancies.length > 1 ? "" : "sm:col-span-2"}>
              <Field label="What's wrong?">
                <input name="title" required placeholder="Bathroom tap is leaking" className="input" />
              </Field>
            </div>
          </div>
          <Field label="Details (optional)">
            <textarea name="description" rows={2} className="input" placeholder="When did it start, best time to visit…" />
          </Field>
          <SubmitButton pendingText="Sending…">Send request</SubmitButton>
        </form>
      )}

      {reqs.length === 0 ? (
        <Empty
          title="No requests"
          hint={isOwner ? "Tenants can raise repair and service requests from their dashboard." : tenancies.length ? "Nothing reported yet." : "You can raise requests once you are renting a room."}
        />
      ) : (
        <div className="space-y-3">
          {reqs.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="muted">
                    {r.category} · {r.room_title}, {r.property_name}
                    {isOwner && ` · ${r.tenant_name} (${r.tenant_phone})`}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.description && <p className="mt-2 text-sm text-slate-700">{r.description}</p>}
              {r.owner_note && !isOwner && (
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"><span className="text-slate-500">Owner:</span> {r.owner_note}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Raised {dateTime(r.created_at)}
                {r.updated_at !== r.created_at && ` · updated ${dateTime(r.updated_at)}`}
              </p>
              {isOwner && (
                <form action={updateRequest} className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="status" defaultValue={r.status} className="input sm:w-40">
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input name="note" defaultValue={r.owner_note} placeholder="Note for tenant (e.g. plumber coming at 5pm)" className="input flex-1" />
                  <SubmitButton pendingText="…">Update</SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
