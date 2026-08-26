"use client";

import { useState } from "react";
import type { HiddurLevel } from "@prisma/client";
import { SetCard } from "@/components/SetCard";
import { VARIETY_ORDER, DEFAULT_VARIETY, type Variety } from "@/lib/catalog";

export type RegularSetSummary = {
  slug: string;
  name: string;
  etrogType: string;
  hiddurLevel: HiddurLevel | null;
  price: number;
  imageUrl: string;
  stockTotal: number | null;
  stockSold: number;
};

// "רגיל" is our internal/default variety key — customers never see the word
// "רגיל" as an etrog type or a "recommended" label. תימני ומרוקאי are the
// exceptional options, each shown as its own separate tab.
const TAB_LABEL: Record<Variety, string> = {
  "רגיל": "הסטים שלנו",
  "תימני": "סט עם אתרוג תימני",
  "מרוקאי": "סט עם אתרוג מרוקאי",
};

export function RegularSetsBrowser({ sets }: { sets: RegularSetSummary[] }) {
  const varieties = VARIETY_ORDER.filter((v) => sets.some((s) => s.etrogType === v));
  const [active, setActive] = useState<Variety>(varieties[0] ?? DEFAULT_VARIETY);

  const shown = sets.filter((s) => s.etrogType === active);

  return (
    <div>
      <div
        role="tablist"
        aria-label="בחירת סוג סט"
        className="mb-6 flex justify-center gap-2 overflow-x-auto px-1"
      >
        {varieties.map((variety) => (
          <button
            key={variety}
            role="tab"
            type="button"
            aria-selected={active === variety}
            onClick={() => setActive(variety)}
            className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              active === variety
                ? "bg-emerald-600 text-white shadow"
                : "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
            }`}
          >
            {TAB_LABEL[variety]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((set) => {
          const remaining = set.stockTotal != null ? Math.max(set.stockTotal - set.stockSold, 0) : null;
          const soldOut = remaining !== null && remaining <= 0;
          return (
            <SetCard
              key={set.slug}
              slug={set.slug}
              name={set.name}
              etrogType={set.etrogType}
              price={set.price}
              imageUrl={set.imageUrl}
              remaining={remaining}
              soldOut={soldOut}
            />
          );
        })}
      </div>
    </div>
  );
}
