import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Bell,
  Building2,
  CircleCheck,
  KeyRound,
  MapPin,
  Megaphone,
  MessageCircle,
  QrCode,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { all, get } from "@/lib/db";
import { RoomCard, listingSelect, type RoomListing } from "@/components/RoomCard";
import { Reveal } from "@/components/Reveal";
import { BRAND } from "@/components/Logo";

const tenantSteps = [
  [Search, "Search", "Browse vacant rooms, flats and PGs with real photos, rent and amenities."],
  [KeyRound, "Apply in a minute", "Send your move-in date and a note. Track the status like a parcel."],
  [Smartphone, "Live there, stress-free", "Bills, UPI payments, repair requests and notices in one place."],
] as const;

const ownerSteps = [
  [Building2, "List your rooms", "Add photos, rent, deposit and charges. Vacant rooms go live instantly."],
  [CircleCheck, "Approve tenants", "One tap approves, marks the room occupied and welcomes them by SMS."],
  [Receipt, "Bill every month", "Enter meter units — each tenant gets a separate bill with a UPI QR."],
] as const;

const features = [
  [Bell, "SMS at every step", "Applications, bills, payments and repairs — everyone is updated automatically."],
  [QrCode, "UPI payments, zero fees", "Tenants scan and pay straight to the owner. No middleman, no commission."],
  [Megaphone, "Building groups", "Chat with residents and send notices that reach every phone."],
  [Wrench, "Repair requests", "Tenants report issues; owners update status from open to resolved."],
  [Receipt, "Separate bills", "Rent, electricity units, water and maintenance itemised per tenant."],
  [ShieldCheck, "Private by design", "Phone numbers stay hidden until an owner and tenant connect."],
] as const;

export default async function Home() {
  const latest = await all<RoomListing>(`${listingSelect} WHERE r.status = 'vacant' ORDER BY r.created_at DESC LIMIT 6`);
  const cities = await all<{ city: string }>(
    "SELECT DISTINCT p.city FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.status = 'vacant' AND p.city != '' ORDER BY p.city LIMIT 6",
  );
  const stats = (await get<{ rooms: number; owners: number; cities: number }>(
    `SELECT (SELECT COUNT(*) FROM rooms WHERE status = 'vacant') rooms,
            (SELECT COUNT(*) FROM users WHERE role = 'owner') owners,
            (SELECT COUNT(DISTINCT city) FROM properties WHERE city != '') cities`,
  ))!;

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="relative -mt-[65px] overflow-hidden pt-[65px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_10%,var(--color-brand-100)_0%,transparent_60%),radial-gradient(45%_45%_at_5%_90%,var(--color-marigold-100)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-slate-300)_1px,transparent_1px)] [background-size:22px_22px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-marigold-200 bg-white/70 px-3 py-1 text-xs font-semibold text-marigold-600 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-marigold-500" />
              Now live · free for owners & tenants
            </p>
            <h1 className="mt-5 animate-fade-up font-display text-4xl leading-[1.08] font-semibold tracking-tight text-brand-950 [animation-delay:80ms] sm:text-5xl xl:text-6xl">
              Find your next <span className="relative whitespace-nowrap text-brand-600">
                basera
                <svg className="absolute -bottom-1 left-0 h-2.5 w-full" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 9 C 50 2, 150 2, 198 8" fill="none" stroke="var(--color-marigold-400)" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              without the running around.
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-slate-600 [animation-delay:160ms]">
              Rooms, flats and PGs with real photos. Apply online, get SMS updates, pay rent by UPI — and owners run
              everything from one calm dashboard.
            </p>

            <form action="/rooms" className="mt-8 flex max-w-xl animate-fade-up flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_-24px_rgba(14,82,76,0.45)] [animation-delay:240ms] sm:flex-row">
              <label className="flex flex-1 items-center gap-2 px-3">
                <MapPin size={18} className="shrink-0 text-brand-600" />
                <input name="city" placeholder="City, area or building name" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400" />
              </label>
              <button className="btn btn-primary px-6 py-3">
                <Search size={16} /> Search rooms
              </button>
            </form>

            {cities.length > 0 && (
              <div className="mt-4 flex animate-fade-up flex-wrap items-center gap-2 text-sm [animation-delay:320ms]">
                <span className="text-slate-500">Popular:</span>
                {cities.map((c) => (
                  <Link
                    key={c.city}
                    href={`/rooms?city=${encodeURIComponent(c.city)}`}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                  >
                    {c.city}
                  </Link>
                ))}
              </div>
            )}

            <dl className="mt-10 grid max-w-md animate-fade-up grid-cols-3 gap-4 [animation-delay:400ms]">
              {[
                [stats.rooms, "rooms available"],
                [stats.cities, "cities"],
                ["₹0", "fees, ever"],
              ].map(([v, l]) => (
                <div key={String(l)}>
                  <dt className="font-display text-3xl font-semibold text-brand-800">{v}</dt>
                  <dd className="text-xs text-slate-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product preview collage */}
          <div className="relative hidden h-[460px] animate-fade-in [animation-delay:200ms] lg:block" aria-hidden="true">
            <div className="absolute top-6 right-6 w-[300px] rotate-2 animate-float overflow-hidden rounded-3xl border border-white bg-white shadow-[0_40px_80px_-30px_rgba(14,82,76,0.5)]">
              <div className="relative h-44 bg-gradient-to-br from-brand-400 to-brand-800">
                <div className="absolute bottom-6 left-6 h-16 w-28 rounded-xl bg-white/85" />
                <div className="absolute top-6 right-6 grid h-20 w-20 grid-cols-2 gap-1 rounded-lg bg-white/30 p-1">
                  <span className="rounded bg-white/50" />
                  <span className="rounded bg-white/50" />
                  <span className="rounded bg-white/50" />
                  <span className="rounded bg-white/50" />
                </div>
                <span className="badge absolute top-4 left-4 bg-white/90 text-emerald-700">● Vacant</span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900">Sunny corner room</p>
                <p className="text-xs text-slate-500">Kothrud, Pune · Furnished</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-display text-xl font-semibold text-brand-800">₹8,500<span className="text-xs font-normal text-slate-500">/mo</span></p>
                  <span className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white">Apply</span>
                </div>
              </div>
            </div>

            <div className="absolute top-[300px] left-0 w-60 -rotate-3 animate-float rounded-2xl border border-white bg-white p-4 shadow-[0_30px_60px_-30px_rgba(29,25,21,0.45)] [animation-delay:-2s]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CircleCheck size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Rent paid via UPI</p>
                  <p className="text-xs text-slate-500">November · ₹10,258</p>
                </div>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 w-72 rotate-1 animate-float rounded-2xl border border-white bg-white p-4 shadow-[0_30px_60px_-30px_rgba(29,25,21,0.45)] [animation-delay:-4s]">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marigold-50 text-marigold-600">
                  <MessageCircle size={20} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">SMS · {BRAND.name}</p>
                  <p className="text-sm text-slate-800">Your application for Room 101 is approved. Welcome home!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Simple for both sides of the door</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            ["For tenants", tenantSteps, "/rooms", "Find a room"],
            ["For owners", ownerSteps, "/register?role=owner", "List your property"],
          ].map(([title, steps, href, cta], col) => (
            <Reveal key={String(title)} delay={col * 120} className={`card p-7 ${col ? "bg-brand-950 text-white" : ""}`}>
              <h3 className={`font-display text-2xl font-semibold ${col ? "text-white" : "text-brand-900"}`}>{String(title)}</h3>
              <ol className="mt-6 space-y-5">
                {(steps as typeof tenantSteps).map(([Icon, name, text], i) => (
                  <li key={name} className="flex gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        col ? "bg-white/10 text-marigold-300" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="font-semibold">
                        <span className={col ? "text-marigold-300" : "text-marigold-600"}>0{i + 1}.</span> {name}
                      </p>
                      <p className={`mt-0.5 text-sm ${col ? "text-brand-100/75" : "text-slate-600"}`}>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href={String(href)} className={`btn mt-7 ${col ? "btn-accent" : "btn-primary"}`}>
                {String(cta)} <ArrowRight size={16} />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Latest rooms ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Fresh listings</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Recently listed rooms</h2>
          </div>
          <Link href="/rooms" className="btn btn-secondary">
            See all rooms <ArrowRight size={16} />
          </Link>
        </Reveal>
        {latest.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((r, i) => (
              <Reveal key={r.id} delay={(i % 3) * 90}>
                <RoomCard room={r} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <BedDouble className="text-brand-400" size={36} />
            <p className="font-medium">Be the first owner to list a room here.</p>
            <Link href="/register?role=owner" className="btn btn-primary">
              List your property
            </Link>
          </div>
        )}
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Everything included</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            The whole rental, from first visit to monthly rent
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, text], i) => (
            <Reveal key={title} delay={(i % 3) * 90} className="card card-hover group p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 transition duration-300 group-hover:scale-110 group-hover:from-marigold-50 group-hover:to-marigold-100 group-hover:text-marigold-600">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -top-20 -left-16 h-64 w-64 rounded-full bg-marigold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -bottom-24 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight sm:text-4xl">Have rooms to rent?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-100/85">
            List them on {BRAND.name} in five minutes. Approve tenants, send bills and notices — all with SMS, all free.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register?role=owner" className="btn btn-accent px-6 py-3">
              Start listing free <ArrowRight size={16} />
            </Link>
            <Link href="/rooms" className="btn border border-white/25 px-6 py-3 text-white hover:bg-white/10">
              Browse rooms
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
