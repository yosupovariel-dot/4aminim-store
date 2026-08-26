"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatILS } from "@/lib/pricing";

type Props = {
  set: {
    id: string;
    slug: string;
    name: string;
    etrogType: string;
    price: number;
    kind: "REGULAR" | "SPECIAL" | "ADDON";
  };
  remaining: number | null;
};

export function AddToCartControl({ set, remaining }: Props) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const alreadyInCart = items.find((i) => i.setId === set.id)?.quantity || 0;
  const maxAddable =
    remaining != null ? Math.max(remaining - alreadyInCart, 0) : Infinity;
  const soldOut = remaining != null && remaining <= 0;

  function handleAdd() {
    addItem(
      {
        setId: set.id,
        slug: set.slug,
        name: set.name,
        etrogType: set.etrogType,
        price: set.price,
        kind: set.kind,
        stockRemaining: remaining,
      },
      quantity
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  if (soldOut) {
    return (
      <div className="rounded-2xl bg-neutral-100 p-6 text-center font-semibold text-neutral-500">
        לצערנו אזל המלאי עבור סט זה
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-emerald-900">כמות</span>
        <div className="flex items-center rounded-full border border-emerald-200 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-10 w-10 text-lg font-bold text-emerald-700 hover:bg-emerald-50 rounded-full"
            aria-label="הפחתת כמות"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold text-emerald-950">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(q + 1, maxAddable === Infinity ? q + 1 : maxAddable))}
            disabled={maxAddable !== Infinity && quantity >= maxAddable}
            className="h-10 w-10 text-lg font-bold text-emerald-700 hover:bg-emerald-50 rounded-full disabled:opacity-30"
            aria-label="הוספת כמות"
          >
            +
          </button>
        </div>
        {remaining != null && (
          <span className="text-xs text-amber-700">נותרו {remaining} יחידות</span>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={maxAddable === 0}
        className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {maxAddable === 0
          ? "כל המלאי הזמין כבר בסל שלך"
          : `הוספה לסל — ${formatILS((set.price * quantity) / 100)}`}
      </button>

      {justAdded && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>נוסף לסל בהצלחה ✓</span>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="font-semibold underline"
          >
            מעבר לסל הקניות
          </button>
        </div>
      )}
    </div>
  );
}
