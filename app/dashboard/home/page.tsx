import Link from "next/link";
import { get } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { date, inr, whatsappLink } from "@/lib/format";
import { Empty, PageHeader, RoomThumb } from "@/components/ui";

export default async function MyHomePage() {
  const tenant = await requireUser("tenant");
  const t = await get<{
    id: number; rent: number; start_date: string; room_id: number; title: string; room_type: string;
    property_name: string; address: string; city: string; electricity_rate: number; water_charge: number;
    maintenance_charge: number; owner_name: string; owner_phone: string; cover_id: number | null;
  }>(
    `SELECT t.id, t.rent, t.start_date, r.id room_id, r.title, r.room_type, p.name property_name, p.address, p.city,
       p.electricity_rate, p.water_charge, p.maintenance_charge, u.name owner_name, u.phone owner_phone,
       (SELECT i.id FROM room_images i WHERE i.room_id = r.id ORDER BY i.position, i.id LIMIT 1) cover_id
     FROM tenancies t JOIN rooms r ON r.id = t.room_id JOIN properties p ON p.id = r.property_id JOIN users u ON u.id = p.owner_id
     WHERE t.tenant_id = ? AND t.active = 1 ORDER BY t.id DESC LIMIT 1`,
    [tenant.id],
  );

  if (!t) {
    return (
      <div>
        <PageHeader title="My home" />
        <Empty title="You are not renting a room yet" hint="Once an owner approves your application, your room details appear here." href="/rooms" cta="Find a room" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My home" subtitle={`Since ${date(t.start_date)}`} />
      <div className="card overflow-hidden sm:flex">
        <div className="aspect-[4/3] sm:w-72 sm:shrink-0">
          <RoomThumb imageId={t.cover_id} alt={t.title} />
        </div>
        <div className="p-5">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="muted">
            {t.room_type} · {t.property_name}
            {t.address && `, ${t.address}`}
            {t.city && `, ${t.city}`}
          </p>
          <ul className="mt-4 space-y-1 text-sm">
            <li>Rent: <b>{inr(t.rent)}</b> / month</li>
            <li>Electricity: ₹{t.electricity_rate} / unit</li>
            {t.water_charge > 0 && <li>Water: {inr(t.water_charge)}</li>}
            {t.maintenance_charge > 0 && <li>Maintenance: {inr(t.maintenance_charge)}</li>}
          </ul>
          <div className="mt-4 text-sm">
            Owner: <b>{t.owner_name}</b>
            {t.owner_phone && (
              <>
                {" · "}
                <a href={`tel:${t.owner_phone}`} className="text-brand-600 hover:underline">Call</a>
                {" · "}
                <a href={whatsappLink(t.owner_phone)} target="_blank" className="text-emerald-600 hover:underline">WhatsApp</a>
              </>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/bills" className="btn btn-primary btn-sm">My bills</Link>
            <Link href="/dashboard/requests" className="btn btn-secondary btn-sm">Raise a request</Link>
            <Link href="/dashboard/groups" className="btn btn-secondary btn-sm">Building group</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
