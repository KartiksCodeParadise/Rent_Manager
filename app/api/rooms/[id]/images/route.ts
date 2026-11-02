import { currentUser } from "@/lib/auth";
import { get, run } from "@/lib/db";

const MAX_BYTES = 1_500_000;
const MAX_PHOTOS = 12;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request, ctx: RouteContext<"/api/rooms/[id]/images">) {
  const user = await currentUser();
  if (!user || user.role !== "owner") return Response.json({ error: "Please log in as an owner." }, { status: 401 });

  const roomId = Number((await ctx.params).id);
  const room = await get(
    "SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE r.id = ? AND p.owner_id = ?",
    [roomId, user.id],
  );
  if (!room) return Response.json({ error: "Room not found." }, { status: 404 });

  const count = await get<{ n: number }>("SELECT COUNT(*) n FROM room_images WHERE room_id = ?", [roomId]);
  if (count!.n >= MAX_PHOTOS) return Response.json({ error: `A room can have up to ${MAX_PHOTOS} photos.` }, { status: 400 });

  const file = (await req.formData()).get("file");
  if (!(file instanceof File) || !ALLOWED.includes(file.type)) {
    return Response.json({ error: "Please choose a JPG, PNG or WebP photo." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return Response.json({ error: "Image is too large." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { id } = await run(
    "INSERT INTO room_images (room_id, mime, data, position) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM room_images WHERE room_id = ?))",
    [roomId, file.type, bytes, roomId],
  );
  return Response.json({ id });
}
