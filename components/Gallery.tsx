"use client";
import { useState } from "react";
import { RoomThumb } from "./ui";

export function Gallery({ imageIds, title }: { imageIds: number[]; title: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
        <RoomThumb imageId={imageIds[active]} alt={title} />
      </div>
      {imageIds.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {imageIds.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-brand-600" : "border-transparent opacity-70"
              }`}
            >
              <RoomThumb imageId={id} alt={`${title} photo ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
