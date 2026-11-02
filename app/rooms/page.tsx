import { all } from "@/lib/db";
import { RoomCard, listingSelect, type RoomListing } from "@/components/RoomCard";
import { FURNISHING, ROOM_TYPES } from "@/lib/constants";

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="h1">Vacant rooms</h1>
      <form className="card mt-5 grid gap-3 p-4 sm:grid-cols-5">
        <input name="city" defaultValue={city} placeholder="City, area or building" className="input sm:col-span-2" />
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
          <button className="btn btn-primary">Go</button>
        </div>
      </form>

      <p className="muted mt-6">{rooms.length} room(s) found</p>
      <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} />
        ))}
      </div>
    </main>
  );
}
