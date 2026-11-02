import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createRoom, deleteProperty, updateProperty } from "@/lib/actions/owner";
import { inr } from "@/lib/format";
import { Notice, PageHeader, RoomThumb, StatusBadge } from "@/components/ui";
import { PropertyFields, RoomFields } from "@/components/forms";
import { SubmitButton } from "@/components/SubmitButton";

export default async function PropertyPage({ params, searchParams }: PageProps<"/dashboard/properties/[id]">) {
  const owner = await requireUser("owner");
  const { id } = await params;
  const sp = await searchParams;
  const p = await get<{
    id: number; name: string; address: string; city: string; description: string;
    electricity_rate: number; water_charge: number; maintenance_charge: number;
  }>("SELECT * FROM properties WHERE id = ? AND owner_id = ?", [Number(id), owner.id]);
  if (!p) notFound();

  const rooms = await all<{ id: number; title: string; room_type: string; rent: number; status: string; cover_id: number | null; tenant: string | null }>(
    `SELECT r.id, r.title, r.room_type, r.rent, r.status,
       (SELECT i.id FROM room_images i WHERE i.room_id = r.id ORDER BY i.position, i.id LIMIT 1) cover_id,
       (SELECT u.name FROM tenancies t JOIN users u ON u.id = t.tenant_id WHERE t.room_id = r.id AND t.active = 1 LIMIT 1) tenant
     FROM rooms r WHERE r.property_id = ? ORDER BY r.title`,
    [p.id],
  );

  return (
    <div>
      <Link href="/dashboard/properties" className="text-sm text-brand-600 hover:underline">
        ← Properties
      </Link>
      <PageHeader title={p.name} subtitle={[p.address, p.city].filter(Boolean).join(", ")} />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      <h2 className="mb-3 font-semibold">Rooms ({rooms.length})</h2>
      {rooms.length > 0 ? (
        <div className="card mb-6 divide-y divide-slate-100">
          {rooms.map((r) => (
            <Link key={r.id} href={`/dashboard/rooms/${r.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                <RoomThumb imageId={r.cover_id} alt={r.title} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="muted">
                  {r.room_type} · {inr(r.rent)}/mo{r.tenant && ` · ${r.tenant}`}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted mb-6">No rooms yet — add the first one below.</p>
      )}

      <details className="card mb-6 p-5" open={rooms.length === 0}>
        <summary className="cursor-pointer font-semibold">+ Add a room</summary>
        <form action={createRoom} className="mt-4 space-y-4">
          <input type="hidden" name="property_id" value={p.id} />
          <RoomFields />
          <SubmitButton>Add room</SubmitButton>
        </form>
      </details>

      <details className="card p-5">
        <summary className="cursor-pointer font-semibold">Edit property & default charges</summary>
        <form action={updateProperty} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={p.id} />
          <PropertyFields p={p} />
          <SubmitButton>Save property</SubmitButton>
        </form>
        <form action={deleteProperty} className="mt-6 border-t border-slate-100 pt-4">
          <input type="hidden" name="id" value={p.id} />
          <SubmitButton className="btn btn-danger btn-sm" confirm="Delete this property? This cannot be undone.">
            Delete property
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}
