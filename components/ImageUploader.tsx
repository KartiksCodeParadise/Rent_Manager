"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Shrinks photos in the browser (max 1600px, JPEG) so they stay small in the free database tier. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read image"))), "image/jpeg", 0.78),
  );
}

export function ImageUploader({ roomId }: { roomId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const body = new FormData();
        body.append("file", await compress(list[i]), "photo.jpg");
        const res = await fetch(`/api/rooms/${roomId}/images`, { method: "POST", body });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        break;
      }
    }
    setBusy("");
    router.refresh();
  }

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-brand-500">
        <span className="font-medium text-slate-700">{busy || "Add photos"}</span>
        <span className="muted">JPG / PNG, several at once. Photos are resized automatically.</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={!!busy}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
