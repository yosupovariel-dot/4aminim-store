"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatILS } from "@/lib/pricing";
import { createOrder } from "@/actions/orders";
import { CheckoutWizard, initialOrderState } from "@/components/CheckoutWizard";
import { customerEtrogLabel } from "@/lib/catalog";

type Addon = {
  id: string;
  slug: string;
  name: string;
  etrogType: string;
  description: string;
  price: number;
};

export function CartPageClient({ addon }: { addon: Addon | null }) {
  const { items, totalPrice, updateQuantity, removeItem, addItem } = useCart();
  const [state, formAction, pending] = useActionState(createOrder, initialOrderState);

  const addonInCart = addon ? items.some((i) => i.setId === addon.id) : true;

  if (items.length === 0 && !state.success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-5xl mb-4" aria-hidden>
          🛒
        </div>
        <h1 className="text-2xl font-extrabold text-emerald-950 mb-2">הסל שלך ריק</h1>
        <p className="text-emerald-700 mb-6">
          עדיין לא הוספת סטים לסל. אפשר לחזור לדף הבית ולבחור סט.
        </p>
        <Link
          href="/#sets"
          className="inline-block rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
        >
          לצפייה בסטים
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {!state.success && (
        <>
          <h1 className="text-3xl font-extrabold text-emerald-950 mb-6">סל הקניות שלך</h1>

          <div className="space-y-3 mb-8">
            {items.map((item) => (
              <div
                key={item.setId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="font-bold text-emerald-950">{item.name}</div>
                  <div className="text-xs text-emerald-600">
                    {item.kind === "ADDON"
                      ? "תוספת"
                      : item.kind === "SPECIAL"
                      ? item.etrogType
                      : customerEtrogLabel(item.etrogType)}
                    {item.kind === "SPECIAL" && (
                      <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                        סט מיוחד
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-emerald-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.setId, item.quantity - 1)}
                      className="h-9 w-9 text-lg font-bold text-emerald-700 hover:bg-emerald-50 rounded-full"
                      aria-label="הפחתת כמות"
                    >
                      −
                    </button>
                    <span className="w-7 text-center font-semibold text-emerald-950">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.setId, item.quantity + 1)}
                      disabled={item.stockRemaining != null && item.quantity >= item.stockRemaining}
                      className="h-9 w-9 text-lg font-bold text-emerald-700 hover:bg-emerald-50 rounded-full disabled:opacity-30"
                      aria-label="הוספת כמות"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-24 text-left font-bold text-emerald-900">
                    {formatILS((item.price * item.quantity) / 100)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.setId)}
                    aria-label={`הסרת ${item.name} מהסל`}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {addon && !addonInCart && (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="min-w-0">
                <div className="font-bold text-amber-900">{addon.name}</div>
                <p className="mt-0.5 text-sm text-amber-800">{addon.description}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem(
                    {
                      setId: addon.id,
                      slug: addon.slug,
                      name: addon.name,
                      etrogType: addon.etrogType,
                      price: addon.price,
                      kind: "ADDON",
                      stockRemaining: null,
                    },
                    1
                  )
                }
                className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                הוספה — {formatILS(addon.price / 100)}
              </button>
            </div>
          )}

          <div className="mb-8 flex items-center justify-between rounded-2xl bg-emerald-50 px-5 py-4">
            <span className="font-semibold text-emerald-900">סה&quot;כ לתשלום</span>
            <span className="text-2xl font-extrabold text-emerald-900">
              {formatILS(totalPrice / 100)}
            </span>
          </div>
        </>
      )}

      <CheckoutWizard state={state} formAction={formAction} pending={pending} />
    </div>
  );
}
