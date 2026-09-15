import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { HIDDUR_LABEL, HIDDUR_ORDER, DEDICATION_LABEL } from "@/lib/catalog";
import { DEDICATION_TYPES } from "@/lib/validation";
import {
  markDonationPaid,
  unmarkDonationPaid,
  updateDonation,
  deleteDonation,
} from "@/actions/donations";

export default async function AdminDonationsPage() {
  const donations = await prisma.donation.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">תרומות</h1>
        <p className="mt-1 text-sm text-emerald-600">
          התחייבויות לתרומת סט לבית כנסת או למשפחה נזקקת, שהתקבלו דרך הבאנר
          שמוצג אחרי השלמת הזמנה. עמוד זה נפרד לגמרי מרשימת ההזמנות הרגילות,
          אך נכלל בחישובי הדוחות והמכירות. ניתן לערוך כל תרומה כמו סט רגיל.
        </p>
      </div>

      <div className="grid gap-4">
        {donations.map((d) => (
          <DonationCard key={d.id} donation={d} />
        ))}
        {donations.length === 0 && (
          <p className="text-sm text-emerald-500">אין עדיין תרומות</p>
        )}
      </div>
    </div>
  );
}

type DonationRow = Awaited<ReturnType<typeof prisma.donation.findMany>>[number];

function DonationCard({ donation: d }: { donation: DonationRow }) {
  const updateAction = updateDonation.bind(null, d.id);
  const deleteAction = deleteDonation.bind(null, d.id);
  const paidAction = (d.paidConfirmed ? unmarkDonationPaid : markDonationPaid).bind(null, d.id);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-emerald-500">
          נתרם ב-{new Date(d.createdAt).toLocaleDateString("he-IL")} · סכום: {formatILS(d.amount / 100)}
        </div>
        <div className="flex gap-2">
          <form action={paidAction}>
            <button
              className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                d.paidConfirmed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
              title="לחיצה לשינוי סטטוס תשלום"
            >
              {d.paidConfirmed ? "התקבל ✓" : "ממתין לתשלום"}
            </button>
          </form>
          <form action={deleteAction}>
            <button
              className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
              title="מחיקת תרומה"
            >
              מחיקה
            </button>
          </form>
        </div>
      </div>

      <form action={updateAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">רמת הידור</span>
          <select
            name="hiddurLevel"
            defaultValue={d.hiddurLevel}
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          >
            {HIDDUR_ORDER.map((level) => (
              <option key={level} value={level}>
                {HIDDUR_LABEL[level]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">סוג הקדשה</span>
          <select
            name="dedicationType"
            defaultValue={d.dedicationType}
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          >
            {DEDICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {DEDICATION_LABEL[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">שם ההקדשה</span>
          <input
            name="dedicationName"
            defaultValue={d.dedicationName}
            required
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">שם התורם/ת</span>
          <input
            name="donorName"
            defaultValue={d.donorName}
            required
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">טלפון</span>
          <input
            name="donorPhone"
            defaultValue={d.donorPhone}
            required
            dir="ltr"
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        <div className="flex items-end">
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            שמירה
          </button>
        </div>
      </form>
    </div>
  );
}
