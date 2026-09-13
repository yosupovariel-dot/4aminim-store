import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { HIDDUR_LABEL, DEDICATION_LABEL } from "@/lib/catalog";
import { markDonationPaid, unmarkDonationPaid } from "@/actions/donations";

export default async function AdminDonationsPage() {
  const donations = await prisma.donation.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">תרומות</h1>
        <p className="mt-1 text-sm text-emerald-600">
          התחייבויות לתרומת סט לבית כנסת או למשפחה נזקקת, שהתקבלו דרך הבאנר
          שמוצג אחרי השלמת הזמנה. עמוד זה נפרד לגמרי מרשימת ההזמנות הרגילות.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-emerald-50 text-emerald-800">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">תורם/ת</th>
              <th className="px-4 py-3 text-right font-semibold">הקדשה</th>
              <th className="px-4 py-3 text-right font-semibold">רמת הידור</th>
              <th className="px-4 py-3 text-right font-semibold">סכום</th>
              <th className="px-4 py-3 text-right font-semibold">תשלום</th>
              <th className="px-4 py-3 text-right font-semibold">תאריך</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {donations.map((d) => (
              <tr key={d.id} className="hover:bg-emerald-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-emerald-950">{d.donorName}</div>
                  <div className="text-xs text-emerald-500" dir="ltr">
                    {d.donorPhone}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {DEDICATION_LABEL[d.dedicationType]} {d.dedicationName}
                </td>
                <td className="px-4 py-3">{HIDDUR_LABEL[d.hiddurLevel]}</td>
                <td className="px-4 py-3">{formatILS(d.amount / 100)}</td>
                <td className="px-4 py-3">
                  <form
                    action={(d.paidConfirmed ? unmarkDonationPaid : markDonationPaid).bind(
                      null,
                      d.id
                    )}
                  >
                    <button
                      className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                        d.paidConfirmed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                      title="לחיצה לשינוי סטטוס תשלום"
                    >
                      {d.paidConfirmed ? "התקבל ✓" : "ממתין לתשלום"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-emerald-600">
                  {new Date(d.createdAt).toLocaleDateString("he-IL")}
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-emerald-500">
                  אין עדיין תרומות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
