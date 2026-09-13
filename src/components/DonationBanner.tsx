"use client";

import { useActionState, useState } from "react";
import type { HiddurLevel } from "@prisma/client";
import { createDonation, type DonationActionState } from "@/actions/donations";
import { formatILS } from "@/lib/pricing";
import { HIDDUR_ORDER, HIDDUR_LABEL, DEDICATION_LABEL } from "@/lib/catalog";
import { DEDICATION_TYPES } from "@/lib/validation";

const initialState: DonationActionState = {};

type HiddurPricing = Partial<Record<HiddurLevel, number>>;

export function DonationBanner({ hiddurPricing }: { hiddurPricing: HiddurPricing }) {
  const [dismissed, setDismissed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hiddurLevel, setHiddurLevel] = useState<HiddurLevel>(HIDDUR_ORDER[0]);
  const [state, formAction, pending] = useActionState(createDonation, initialState);

  const availableLevels = HIDDUR_ORDER.filter((l) => hiddurPricing[l] != null);

  if (dismissed || availableLevels.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        {state.success ? (
          <div className="text-center">
            <div className="mb-3 text-4xl" aria-hidden>
              🙏
            </div>
            <h2 className="text-xl font-bold text-emerald-950">תודה רבה על התרומה!</h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-800">
              יש להעביר את הסכום המלא — <strong>{formatILS((state.amount ?? 0) / 100)}</strong> —
              באפליקציית <strong>Bit</strong> או <strong>PayBox</strong> למספר{" "}
              <strong dir="ltr">054-953-3757</strong>.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a
                href={`bit://pay?phone=0549533757&sum=${Math.round((state.amount ?? 0) / 100)}`}
                className="rounded-full bg-[#0FB5B0] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                פתיחה באפליקציית Bit
              </a>
              <a
                href={`paybox://pay?phone=0549533757&sum=${Math.round((state.amount ?? 0) / 100)}`}
                className="rounded-full bg-[#5B3EE8] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                פתיחה באפליקציית PayBox
              </a>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="mt-6 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              סגירה
            </button>
          </div>
        ) : !showForm ? (
          <div className="text-center">
            <div className="mb-3 text-4xl" aria-hidden>
              🎁
            </div>
            <h2 className="text-xl font-bold text-emerald-950">רוצים לתרום סט נוסף?</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-700">
              אנחנו מעבירים תרומות של סטים לבתי כנסת ולמשפחות נזקקות לקראת החג.
              אפשר לתרום סט על שמכם או לעילוי נשמה / לרפואה / להצלחה.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                כן, אשמח לתרום
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="flex-1 rounded-full border border-emerald-200 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                לא תודה
              </button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-950">תרומת סט</h2>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="סגירה"
                className="text-emerald-400 hover:text-emerald-700"
              >
                ✕
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-emerald-900">רמת הידור</span>
              <select
                name="hiddurLevel"
                required
                value={hiddurLevel}
                onChange={(e) => setHiddurLevel(e.target.value as HiddurLevel)}
                className="donation-input"
              >
                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {HIDDUR_LABEL[level]} — {formatILS((hiddurPricing[level] ?? 0) / 100)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-emerald-900">סוג הקדשה</span>
              <select name="dedicationType" required className="donation-input">
                {DEDICATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DEDICATION_LABEL[type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-emerald-900">שם ההקדשה</span>
              <input
                name="dedicationName"
                required
                minLength={2}
                className="donation-input"
                placeholder="לדוגמה: ישראל בן שרה"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-emerald-900">שם מלא (התורם/ת)</span>
              <input name="donorName" required minLength={2} className="donation-input" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-emerald-900">טלפון נייד</span>
              <input
                name="donorPhone"
                required
                inputMode="tel"
                className="donation-input"
                placeholder="0501234567"
              />
            </label>

            {state.message && <p className="text-sm font-medium text-red-600">{state.message}</p>}
            {state.errors && (
              <ul className="space-y-1 text-sm text-red-600">
                {Object.values(state.errors).flat().map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "שולח..." : "המשך לתשלום"}
            </button>

            <style jsx global>{`
              .donation-input {
                width: 100%;
                border-radius: 0.75rem;
                border: 1px solid #bfe3c4;
                padding: 0.6rem 0.9rem;
                background: white;
              }
              .donation-input:focus {
                outline: none;
                border-color: #2f7a3d;
                box-shadow: 0 0 0 3px rgba(47, 122, 61, 0.15);
              }
            `}</style>
          </form>
        )}
      </div>
    </div>
  );
}
