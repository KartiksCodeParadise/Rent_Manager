import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { applyForRoom } from "@/lib/actions/tenant";
import { inr, today } from "@/lib/format";
import { Gallery } from "@/components/Gallery";
import { Field, Notice, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

type Room = {
  id: number; title: string; room_type: string; rent: number; deposit: number; area_sqft: number;
  furnishing: string; amenities: string; description: string; status: string;
  property_name: string; address: string; city: string; property_description: string;
  electricity_rate: number; water_charge: number; maintenance_charge: number;
  owner_id: number; owner_name: string;
};

export default async function RoomPage({ params, searchParams }: PageProps<"/rooms/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await currentUser();
  const room = await get<Room>(
    `SELECT r.*, p.name property_name, p.address, p.city, p.description property_description,
       p.electricity_rate, p.water_charge, p.maintenance_charge, p.owner_id, u.name owner_name
     FROM rooms r JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = p.owner_id WHERE r.id = ?`,
    [Number(id)],
  );
  const isOwner = user?.id === room?.owner_id;
  if (!room || (room.status === "unlisted" && !isOwner)) notFound();

  const images = await all<{ id: number }>("SELECT id FROM room_images WHERE room_id = ? ORDER BY position, id", [room.id]);
  const existing =
    user?.role === "tenant"
      ? await get<{ status: string }>(
          "SELECT status FROM applications WHERE room_id = ? AND tenant_id = ? ORDER BY id DESC LIMIT 1",
          [room.id, user.id],
        )
      : undefined;
  const amenities = room.amenities.split(",").map((a) => a.trim()).filter(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/rooms" className="text-sm text-brand-600 hover:underline">
        ← All rooms
      </Link>
      <Notice text={typeof sp.error === "string" ? sp.error : undefined} tone="error" />

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <Gallery imageIds={images.map((i) => i.id)} title={room.title} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="h1">{room.title}</h1>
            <StatusBadge status={room.status} />
          </div>
          <p className="muted mt-1">
            {room.property_name}
            {room.address && ` · ${room.address}`}
            {room.city && `, ${room.city}`}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Type", room.room_type],
              ["Furnishing", room.furnishing],
              ["Area", room.area_sqft ? `${room.area_sqft} sq ft` : "—"],
              ["Deposit", inr(room.deposit)],
            ].map(([k, v]) => (
              <div key={k} className="card p-3">
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          {room.description && <p className="mt-6 whitespace-pre-line text-slate-700">{room.description}</p>}

          {amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold">Amenities</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="badge bg-brand-50 text-brand-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card mt-6 p-4">
            <h2 className="font-semibold">Monthly charges</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>Rent: {inr(room.rent)}</li>
              <li>Electricity: ₹{room.electricity_rate} per unit (as per meter)</li>
              {room.water_charge > 0 && <li>Water: {inr(room.water_charge)}</li>}
              {room.maintenance_charge > 0 && <li>Maintenance: {inr(room.maintenance_charge)}</li>}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-3xl font-bold text-brand-700">
              {inr(room.rent)}
              <span className="text-base font-normal text-slate-500"> / month</span>
            </p>
            <p className="muted mt-1">Listed by {room.owner_name}</p>

            <div className="mt-5">
              {isOwner ? (
                <Link href={`/dashboard/rooms/${room.id}`} className="btn btn-primary w-full">
                  Edit this room
                </Link>
              ) : room.status !== "vacant" ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">This room is currently occupied.</p>
              ) : !user ? (
                <div className="space-y-2">
                  <Link href={`/register?next=/rooms/${room.id}`} className="btn btn-primary w-full">
                    Sign up to apply
                  </Link>
                  <Link href={`/login?next=/rooms/${room.id}`} className="btn btn-secondary w-full">
                    I already have an account
                  </Link>
                </div>
              ) : user.role === "owner" ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  You are logged in as an owner. Use a tenant account to apply.
                </p>
              ) : existing?.status === "pending" ? (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Your application is pending.{" "}
                  <Link href="/dashboard/applications" className="font-medium underline">
                    Track status
                  </Link>
                </div>
              ) : (
                <form action={applyForRoom} className="space-y-3">
                  <input type="hidden" name="room_id" value={room.id} />
                  <h2 className="font-semibold">Apply for this room</h2>
                  <Field label="Move-in date">
                    <input type="date" name="move_in_date" min={today()} required className="input" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="People">
                      <input type="number" name="occupants" min={1} defaultValue={1} className="input" />
                    </Field>
                    <Field label="Occupation">
                      <input name="occupation" placeholder="Student / job" className="input" />
                    </Field>
                  </div>
                  <Field label="Message to owner">
                    <textarea name="message" rows={3} className="input" placeholder="A little about you…" />
                  </Field>
                  <SubmitButton className="btn btn-primary w-full" pendingText="Sending…">
                    Send application
                  </SubmitButton>
                  <p className="text-xs text-slate-500">You will get SMS updates on {user.phone || "your phone"}.</p>
                </form>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
