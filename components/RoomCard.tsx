import Link from "next/link";
import { inr } from "@/lib/format";
import { RoomThumb } from "./ui";

export type RoomListing = {
  id: number;
  title: string;
  room_type: string;
  rent: number;
  furnishing: string;
  city: string;
  property_name: string;
  cover_id: number | null;
};

/** Shared SELECT for public room cards (cover = lowest position photo). */
export const listingSelect = `
  SELECT r.id, r.title, r.room_type, r.rent, r.furnishing, p.city, p.name property_name,
    (SELECT i.id FROM room_images i WHERE i.room_id = r.id ORDER BY i.position, i.id LIMIT 1) cover_id
  FROM rooms r JOIN properties p ON p.id = r.property_id`;

export function RoomCard({ room }: { room: RoomListing }) {
  return (
    <Link href={`/rooms/${room.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <RoomThumb imageId={room.cover_id} alt={room.title} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-600">{room.title}</h3>
          <span className="shrink-0 font-bold text-brand-700">
            {inr(room.rent)}
            <span className="text-xs font-normal text-slate-500">/mo</span>
          </span>
        </div>
        <p className="muted mt-1">
          {room.room_type} · {room.furnishing}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {room.property_name}
          {room.city && `, ${room.city}`}
        </p>
      </div>
    </Link>
  );
}
