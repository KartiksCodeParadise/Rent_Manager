import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteImage, deleteRoom, makeCover, updateRoom } from "@/lib/actions/owner";
import { Notice, PageHeader, StatusBadge } from "@/components/ui";
import { RoomFields } from "@/components/forms";
import { ImageUploader } from "@/components/ImageUploader";
import { SubmitButton } from "@/components/SubmitButton";

export default async function EditRoomPage({ params, searchParams }: PageProps<"/dashboard/rooms/[id]">) {
  const owner = await requireUser("owner");
  const { id } = await params;
  const sp = await searchParams;
  const room = await get<{
    id: number; property_id: number; property_name: string; title: string; room_type: string; rent: number;
    deposit: number; area_sqft: number; furnishing: string; amenities: string; description: string; status: string;
  }>(
    `SELECT r.*, p.name property_name FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.id = ? AND p.owner_id = ?`,
    [Number(id), owner.id],
  );
  if (!room) notFound();
  const images = await all<{ id: number }>("SELECT id FROM room_images WHERE room_id = ? ORDER BY position, id", [room.id]);

  return (
    <div>
      <Link href={`/dashboard/properties/${room.property_id}`} className="text-sm text-brand-600 hover:underline">
        ← {room.property_name}
      </Link>
      <PageHeader
        title={room.title}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={room.status} />
            <Link href={`/rooms/${room.id}`} className="btn btn-secondary btn-sm">
              View public page
            </Link>
          </div>
        }
      />
      <Notice text={sp.msg as string} />
      <Notice text={sp.error as string} tone="error" />

      <section className="card mb-6 p-5">
        <h2 className="mb-3 font-semibold">Photos ({images.length})</h2>
        {images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/images/${img.id}`} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="badge absolute left-2 top-2 bg-white/90 text-slate-700">Cover</span>}
                <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  {i > 0 && (
                    <form action={makeCover}>
                      <input type="hidden" name="room_id" value={room.id} />
                      <input type="hidden" name="image_id" value={img.id} />
                      <button className="btn btn-secondary btn-sm">Make cover</button>
                    </form>
                  )}
                  <form action={deleteImage}>
                    <input type="hidden" name="room_id" value={room.id} />
                    <input type="hidden" name="image_id" value={img.id} />
                    <SubmitButton className="btn btn-danger btn-sm" confirm="Delete this photo?" pendingText="…">
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
        <ImageUploader roomId={room.id} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Details & pricing</h2>
        <form action={updateRoom} className="space-y-4">
          <input type="hidden" name="id" value={room.id} />
          <RoomFields r={room} />
          <SubmitButton>Save room</SubmitButton>
        </form>
        <form action={deleteRoom} className="mt-6 border-t border-slate-100 pt-4">
          <input type="hidden" name="id" value={room.id} />
          <SubmitButton className="btn btn-danger btn-sm" confirm="Delete this room and its photos?">
            Delete room
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
