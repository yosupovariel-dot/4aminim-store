"use client";

import { useState } from "react";
import Image from "next/image";

type MediaItem = { id: string; type: "IMAGE" | "VIDEO"; url: string };

export function ProductGallery({ media, alt }: { media: MediaItem[]; alt: string }) {
  const [active, setActive] = useState(0);
  const current = media[active];

  function prev() {
    setActive((i) => (i - 1 + media.length) % media.length);
  }
  function next() {
    setActive((i) => (i + 1) % media.length);
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50">
        {current.type === "VIDEO" ? (
          <video src={current.url} controls className="h-full w-full bg-black object-contain" />
        ) : (
          <Image
            key={current.id}
            src={current.url}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={active === 0}
          />
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="התמונה הקודמת"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-emerald-800 shadow hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="התמונה הבאה"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-emerald-800 shadow hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`מעבר לתמונה ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === active ? "w-5 bg-emerald-600" : "bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`תצוגה מקדימה ${i + 1}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                i === active ? "border-emerald-600" : "border-transparent"
              }`}
            >
              {m.type === "VIDEO" ? (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-white">▶</div>
              ) : (
                <Image src={m.url} alt="" fill className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
