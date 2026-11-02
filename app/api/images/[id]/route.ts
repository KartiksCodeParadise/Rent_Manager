import { get } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  const img = await get<{ mime: string; data: ArrayBuffer }>("SELECT mime, data FROM room_images WHERE id = ?", [Number(id)]);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(img.data, {
    headers: {
      "content-type": img.mime,
      // Image rows never change (edits create a new id), so browsers/CDN can cache forever.
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
