import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
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
    <Link href={`/rooms/${room.id}`} className="card card-hover group block overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <div className="h-full w-full transition duration-700 ease-out group-hover:scale-105">
          <RoomThumb imageId={room.cover_id} alt={room.title} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="badge absolute top-3 left-3 bg-white/90 text-brand-800 backdrop-blur">{room.room_type}</span>
        <span className="absolute right-3 bottom-3 rounded-xl bg-white/95 px-3 py-1.5 font-display text-lg font-semibold text-brand-900 shadow-sm backdrop-blur">
          {inr(room.rent)}
          <span className="font-sans text-xs font-normal text-slate-500">/mo</span>
        </span>
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 transition group-hover:text-brand-700">{room.title}</h3>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
            <MapPin size={13} className="shrink-0" />
            {room.property_name}
            {room.city && `, ${room.city}`}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-600">{room.furnishing}</p>
        </div>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition duration-300 group-hover:rotate-45 group-hover:bg-brand-700 group-hover:text-white">
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
