import Link from "next/link";
import { all } from "@/lib/db";
import { RoomCard, listingSelect, type RoomListing } from "@/components/RoomCard";

const features = [
  ["Vacant rooms with photos", "List rooms with pictures, rent, deposit and amenities. Tenants browse and apply online."],
  ["SMS status updates", "Applicants and tenants get an SMS whenever an application, request or bill changes."],
  ["Separate bills per tenant", "Rent, electricity units, water and maintenance in one monthly bill. Pay by UPI."],
  ["Groups & notices", "One group per building. Post a notice and every member gets it in-app and by SMS."],
];

export default async function Home() {
  const latest = await all<RoomListing>(`${listingSelect} WHERE r.status = 'vacant' ORDER BY r.created_at DESC LIMIT 6`);
  const cities = await all<{ city: string }>(
    "SELECT DISTINCT p.city FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.status = 'vacant' AND p.city != '' ORDER BY p.city LIMIT 8",
  );

  return (
    <main>
      <section className="bg-gradient-to-b from-brand-50 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Rooms, tenants and bills — managed in one place.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Owners list vacant rooms, approve tenants and send bills. Tenants find a room, apply, pay and raise requests
            — with SMS updates at every step.
          </p>
          <form action="/rooms" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <input name="city" placeholder="Search by city or area" className="input py-3" />
            <button className="btn btn-primary px-6 py-3">Find rooms</button>
          </form>
          {cities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.map((c) => (
                <Link
                  key={c.city}
                  href={`/rooms?city=${encodeURIComponent(c.city)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:border-brand-500"
                >
                  {c.city}
                </Link>
              ))}
            </div>
          )}
          <p className="mt-6 text-sm text-slate-500">
            Own a flat or PG?{" "}
            <Link href="/register?role=owner" className="font-medium text-brand-600 hover:underline">
              List your rooms for free →
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-bold">Recently listed</h2>
          <Link href="/rooms" className="text-sm font-medium text-brand-600 hover:underline">
            See all rooms
          </Link>
        </div>
        {latest.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((r) => (
              <RoomCard key={r.id} room={r} />
            ))}
          </div>
        ) : (
          <p className="muted">No rooms are listed yet. Owners can sign up and add the first one.</p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text]) => (
            <div key={title} className="card p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="muted mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
