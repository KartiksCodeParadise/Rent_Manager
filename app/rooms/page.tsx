import type { Metadata } from "next";
import { MapPin, SearchX, SlidersHorizontal } from "lucide-react";
import { all } from "@/lib/db";
import { Empty } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { RoomCard, listingSelect, type RoomListing } from "@/components/RoomCard";
import { FURNISHING, ROOM_TYPES } from "@/lib/constants";

export const metadata: Metadata = { title: "Find rooms, flats & PGs" };

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  const sp = await searchParams;
  const city = String(sp.city ?? "").trim();
  const type = String(sp.type ?? "");
  const maxRent = Number(sp.max ?? 0);
  const furnishing = String(sp.furnishing ?? "");

  const where = ["r.status = 'vacant'"];
  const args: (string | number)[] = [];
  if (city) {
    where.push("(p.city LIKE ? OR p.address LIKE ? OR p.name LIKE ?)");
    args.push(`%${city}%`, `%${city}%`, `%${city}%`);
  }
  if (type) {
    where.push("r.room_type = ?");
    args.push(type);
  }
  if (maxRent > 0) {
    where.push("r.rent <= ?");
    args.push(maxRent);
  }
  if (furnishing) {
    where.push("r.furnishing = ?");
    args.push(furnishing);
  }
  const rooms = await all<RoomListing>(`${listingSelect} WHERE ${where.join(" AND ")} ORDER BY r.created_at DESC LIMIT 60`, args);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Explore</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-brand-950">
        {city ? <>Rooms in <span className="text-brand-600">{city}</span></> : "Find your next room"}
      </h1>
      <form className="card mt-6 grid gap-3 p-3 sm:grid-cols-5">
        <label className="relative sm:col-span-2">
          <MapPin size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-600" />
          <input name="city" defaultValue={city} placeholder="City, area or building" className="input pl-10" />
        </label>
        <select name="type" defaultValue={type} className="input">
          <option value="">Any type</option>
          {ROOM_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select name="furnishing" defaultValue={furnishing} className="input">
          <option value="">Any furnishing</option>
          {FURNISHING.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input name="max" type="number" min={0} step={500} defaultValue={maxRent || ""} placeholder="Max rent ₹" className="input" />
          <button className="btn btn-primary" aria-label="Apply filters">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </form>

      <p className="mt-8 text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{rooms.length}</span> {rooms.length === 1 ? "room" : "rooms"} available
      </p>
      {rooms.length === 0 ? (
        <div className="mt-4">
          <Empty title="No rooms match yet" hint="Try another area, a higher budget or fewer filters. New rooms are added every day." href="/rooms" cta="Clear filters" icon={SearchX} />
        </div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r, i) => (
            <Reveal key={r.id} delay={(i % 3) * 80}>
              <RoomCard room={r} />
            </Reveal>
          ))}
        </div>
      )}
    </main>
  );
}
