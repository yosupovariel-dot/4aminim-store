"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OrderActionState } from "@/actions/orders";
import { formatILS } from "@/lib/pricing";
import { NEIGHBORHOODS } from "@/lib/validation";
import { useCart } from "@/lib/cart-context";

export const initialOrderState: OrderActionState = {};

type Props = {
  state: OrderActionState;
  formAction: (formData: FormData) => void;
  pending: boolean;
};

export function CheckoutWizard({ state, formAction, pending }: Props) {
  const router = useRouter();
  const { items, totalPrice, clear } = useCart();
  const [step, setStep] = useState<1 | 2>(1);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState<string>("");
  const [address, setAddress] = useState("");

  const depositAmount = Math.round((totalPrice * 20) / 100);
  const itemsJson = JSON.stringify(
    items.map((i) => ({ setId: i.setId, quantity: i.quantity }))
  );

  const step1Valid =
    customerName.trim().length >= 2 &&
    /^0\d{8,9}$/.test(phone.trim()) &&
    !!neighborhood &&
    address.trim().length >= 3;

  useEffect(() => {
    if (state.success) {
      clear();
    }
  }, [state.success, clear]);

  if (state.success) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-4xl mb-3" aria-hidden>
          ✅
        </div>
        <h2 className="text-2xl font-bold text-emerald-900 mb-2">
          ההזמנה התקבלה בהצלחה!
        </h2>
        <p className="text-emerald-800">
          מספר הזמנה: <span className="font-mono font-bold">#{state.orderNumber}</span>
        </p>
        <p className="mt-3 text-emerald-700">
          תישלח אליך הודעת אישור בוואטסאפ בהקדם. ניתן גם לפנות אלינו בכל שאלה.
        </p>
        <p className="mt-2 font-medium text-emerald-800">
          לגבי מועד המשלוח — ניצור איתך קשר בהמשך לתיאום מדויק, לקראת החג.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-full bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700"
        >
          חזרה לדף הבית
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={itemsJson} />

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <StepDot active={step === 1} done={step === 2} label="1" />
        <span className={step === 1 ? "text-emerald-900" : ""}>פרטים אישיים</span>
        <span className="flex-1 h-px bg-emerald-200" />
        <StepDot active={step === 2} done={false} label="2" />
        <span className={step === 2 ? "text-emerald-900" : ""}>תשלום ואישור</span>
      </div>

      {/* Step 1: personal details */}
      <fieldset className={step === 1 ? "space-y-4" : "hidden"}>
        <Field label="שם מלא">
          <input
            name="customerName"
            required
            minLength={2}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input"
            placeholder="ישראל ישראלי"
          />
        </Field>
        <Field label="טלפון נייד">
          <input
            name="phone"
            required
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="0501234567"
          />
        </Field>
        <Field label="שכונה">
          <select
            name="neighborhood"
            required
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="input"
          >
            <option value="" disabled>
              בחרו שכונה
            </option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-emerald-600">
            שימו לב: משלוחים ניתנים רק לשכונות נחלת יהודה ואברמוביץ.
          </p>
        </Field>
        <Field label="כתובת מלאה (רחוב ומספר)">
          <input
            name="address"
            required
            minLength={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input"
            placeholder="רחוב הדוגמה 12"
          />
        </Field>
        <Field label="הערות להזמנה (לא חובה)">
          <textarea name="notes" className="input min-h-20" />
        </Field>

        <button
          type="button"
          disabled={!step1Valid}
          onClick={() => setStep(2)}
          className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          המשך לתשלום
        </button>
      </fieldset>

      {/* Step 2: payment + confirmation */}
      <fieldset className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="rounded-2xl bg-emerald-50 p-5 space-y-2">
          {items.map((i) => (
            <Row
              key={i.setId}
              label={`${i.name} × ${i.quantity}`}
              value={formatILS((i.price * i.quantity) / 100)}
            />
          ))}
          <div className="my-1 h-px bg-emerald-200" />
          <Row label="מחיר כולל" value={formatILS(totalPrice / 100)} />
          <Row
            label="מקדמה לתשלום (20%)"
            value={formatILS(depositAmount / 100)}
            emphasize
          />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 text-sm leading-relaxed">
          יש להעביר את סכום המקדמה — <strong>{formatILS(depositAmount / 100)}</strong> —
          באפליקציית <strong>Bit</strong> למספר הטלפון שיימסר בהודעת האישור בוואטסאפ /
          שמופיע בעמוד יצירת הקשר. לאחר ביצוע ההעברה, יש לסמן זאת למטה.
          <br />
          <strong>מומלץ להעביר את המקדמה בהקדם על מנת לשריין את הסט עבורכם.</strong>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" name="depositMarkedPaid" required className="mt-1 h-4 w-4 accent-emerald-600" />
          <span className="text-sm text-emerald-900">
            אני מאשר/ת שהעברתי את סכום המקדמה בביט כאמור לעיל.
          </span>
        </label>

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" name="termsAccepted" required className="mt-1 h-4 w-4 accent-emerald-600" />
          <span className="text-sm text-emerald-900">
            קראתי ואני מאשר/ת את{" "}
            <Link href="/terms" target="_blank" className="underline">
              תקנון האתר
            </Link>{" "}
            ואת{" "}
            <Link href="/privacy" target="_blank" className="underline">
              מדיניות הפרטיות
            </Link>
            .
          </span>
        </label>

        {state.message && (
          <p className="text-sm font-medium text-red-600">{state.message}</p>
        )}
        {state.errors && (
          <ul className="text-sm text-red-600 space-y-1">
            {Object.values(state.errors).flat().map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-full border border-emerald-300 px-5 py-3 font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            חזרה
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "שולח הזמנה..." : "שליחת ההזמנה"}
          </button>
        </div>
      </fieldset>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #bfe3c4;
          padding: 0.6rem 0.9rem;
          background: white;
        }
        .input:focus {
          outline: none;
          border-color: #2f7a3d;
          box-shadow: 0 0 0 3px rgba(47, 122, 61, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-emerald-900">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-emerald-700">{label}</span>
      <span className={emphasize ? "text-lg font-extrabold text-emerald-900" : "font-semibold text-emerald-900"}>
        {value}
      </span>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
        active
          ? "bg-emerald-600 text-white"
          : done
          ? "bg-emerald-200 text-emerald-800"
          : "bg-emerald-100 text-emerald-500"
      }`}
    >
      {label}
    </span>
  );
}
