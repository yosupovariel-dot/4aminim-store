"use client";

import { useActionState, useState } from "react";
import type { HiddurLevel } from "@prisma/client";
import { createDonation, type DonationActionState } from "@/actions/donations";
import { formatILS } from "@/lib/pricing";
import { HIDDUR_ORDER, HIDDUR_LABEL, DEDICATION_LABEL } from "@/lib/catalog";
import { DEDICATION_TYPES } from "@/lib/validation";
import { CopyButton } from "@/components/CopyButton";

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
              קיבלנו את פרטי התרומה שלכם. אם ההעברה של{" "}
              <strong>{formatILS((state.amount ?? 0) / 100)}</strong> טרם בוצעה בפועל, נא לוודא
              שהיא מתבצעת — אחרת התרומה תבוטל.
            </p>
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
            <p className="mt-2 text-xs font-medium text-amber-700">
              התרומה כרוכה בהעברת מלוא הסכום (100%) מראש בביט/פייבוקס.
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

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              <p>
                יש להעביר <strong>כעת, מראש</strong> את מלוא הסכום (100% — לא מקדמה) —{" "}
                <strong>{formatILS((hiddurPricing[hiddurLevel] ?? 0) / 100)}</strong> — באפליקציית{" "}
                <strong>Bit</strong> או <strong>PayBox</strong> למספר{" "}
                <strong dir="ltr">054-953-3757</strong>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value="0549533757" label="העתקת מספר הטלפון" />
                <CopyButton
                  value={String(Math.round((hiddurPricing[hiddurLevel] ?? 0) / 100))}
                  label="העתקת הסכום"
                />
              </div>
              <p className="mt-2 font-semibold text-red-700">
                שימו לב: אם הסכום המלא לא יתקבל בפועל, התרומה תבוטל אוטומטית.
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="paidConfirmed"
                required
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span className="text-sm text-emerald-900">
                אני מאשר/ת שהעברתי את מלוא הסכום (100%) בביט/פייבוקס כאמור לעיל, ומבין/ה
                שאם ההעברה לא תתקבל בפועל התרומה תבוטל.
              </span>
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
              {pending ? "שולח..." : "שליחת התרומה"}
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
