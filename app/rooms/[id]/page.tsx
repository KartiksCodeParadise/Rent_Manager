import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, ChevronLeft, Droplets, IndianRupee, Lock, MapPin, Ruler, Sofa, Sparkles, Wrench, Zap } from "lucide-react";
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

export async function generateMetadata({ params }: PageProps<"/rooms/[id]">): Promise<Metadata> {
  const room = await get<{ title: string; rent: number; city: string; status: string }>(
    "SELECT r.title, r.rent, r.status, p.city FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.id = ?",
    [Number((await params).id)],
  );
  if (!room || room.status === "unlisted") return { title: "Room not found" };
  return {
    title: `${room.title}${room.city ? `, ${room.city}` : ""}`,
    description: `${room.title} for ${inr(room.rent)}/month${room.city ? ` in ${room.city}` : ""}. See photos and apply online.`,
  };
}

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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/rooms" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
        <ChevronLeft size={16} /> All rooms
      </Link>
      <Notice text={typeof sp.error === "string" ? sp.error : undefined} tone="error" />

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <Gallery imageIds={images.map((i) => i.id)} title={room.title} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">{room.title}</h1>
            <StatusBadge status={room.status} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={15} className="text-brand-600" />
            {room.property_name}
            {room.address && ` · ${room.address}`}
            {room.city && `, ${room.city}`}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["Type", room.room_type, BedDouble],
                ["Furnishing", room.furnishing, Sofa],
                ["Area", room.area_sqft ? `${room.area_sqft} sq ft` : "—", Ruler],
                ["Deposit", inr(room.deposit), Lock],
              ] as const
            ).map(([k, v, Icon]) => (
              <div key={k} className="card p-4">
                <Icon size={18} className="text-brand-600" />
                <dt className="mt-2 text-xs text-slate-500">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {room.description && <p className="mt-6 whitespace-pre-line text-slate-700">{room.description}</p>}

          {amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles size={18} className="text-marigold-500" /> Amenities</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span key={a} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm text-brand-800">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card mt-6 p-4">
            <h2 className="font-display text-lg font-semibold">Monthly charges</h2>
            <ul className="mt-3 divide-y divide-slate-100 text-sm text-slate-700">
              <li className="flex items-center justify-between py-2"><span className="flex items-center gap-2"><IndianRupee size={15} className="text-brand-600" /> Rent</span><b>{inr(room.rent)}</b></li>
              <li className="flex items-center justify-between py-2"><span className="flex items-center gap-2"><Zap size={15} className="text-marigold-500" /> Electricity</span><span>₹{room.electricity_rate} / unit (meter)</span></li>
              {room.water_charge > 0 && <li className="flex items-center justify-between py-2"><span className="flex items-center gap-2"><Droplets size={15} className="text-sky-500" /> Water</span><span>{inr(room.water_charge)}</span></li>}
              {room.maintenance_charge > 0 && <li className="flex items-center justify-between py-2"><span className="flex items-center gap-2"><Wrench size={15} className="text-slate-500" /> Maintenance</span><span>{inr(room.maintenance_charge)}</span></li>}
            </ul>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card overflow-hidden p-6 shadow-[0_30px_60px_-30px_rgba(14,82,76,0.45)]">
            <p className="font-display text-4xl font-semibold text-brand-800">
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
