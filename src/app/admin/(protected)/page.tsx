import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { StatCard } from "@/components/StatCard";
import { HIDDUR_LABEL, HIDDUR_ORDER, VARIETY_ORDER } from "@/lib/catalog";
import type { HiddurLevel } from "@prisma/client";

const VARIETY_RANK = new Map<string, number>(VARIETY_ORDER.map((v, i) => [v, i]));
const HIDDUR_RANK = new Map(HIDDUR_ORDER.map((h, i) => [h, i]));

export default async function AdminDashboardPage() {
  const [orders, donations] = await Promise.all([
    prisma.order.findMany({
      include: { items: { include: { set: { select: { hiddurLevel: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.donation.findMany(),
  ]);

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalOrders = orders.length;
  const totalSetsSold =
    activeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0) +
    donations.length;
  const totalSales =
    activeOrders.reduce((sum, o) => sum + o.totalPrice, 0) +
    donations.reduce((sum, d) => sum + d.amount, 0);
  const depositsPending = activeOrders.filter(
    (o) => o.depositMarkedPaid && !o.depositConfirmed
  ).length;

  const bySet = new Map<
    string,
    { name: string; etrogType: string; hiddurLevel: HiddurLevel | null; count: number }
  >();
  for (const o of activeOrders) {
    for (const item of o.items) {
      const existing = bySet.get(item.setId);
      if (existing) {
        existing.count += item.quantity;
      } else {
        bySet.set(item.setId, {
          name: item.setNameSnapshot,
          etrogType: item.etrogTypeSnapshot,
          hiddurLevel: item.set?.hiddurLevel ?? null,
          count: item.quantity,
        });
      }
    }
  }
  for (const d of donations) {
    const key = `donation-${d.hiddurLevel}`;
    const existing = bySet.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      bySet.set(key, {
        name: `🎁 תרומה — ${HIDDUR_LABEL[d.hiddurLevel]}`,
        etrogType: "רגיל",
        hiddurLevel: d.hiddurLevel,
        count: 1,
      });
    }
  }

  const sortedBySet = Array.from(bySet.values()).sort((a, b) => {
    const varietyDiff = (VARIETY_RANK.get(a.etrogType) ?? 99) - (VARIETY_RANK.get(b.etrogType) ?? 99);
    if (varietyDiff !== 0) return varietyDiff;
    const hiddurDiff =
      (a.hiddurLevel ? HIDDUR_RANK.get(a.hiddurLevel)! : 99) -
      (b.hiddurLevel ? HIDDUR_RANK.get(b.hiddurLevel)! : 99);
    if (hiddurDiff !== 0) return hiddurDiff;
    return b.count - a.count;
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-emerald-950">לוח בקרה</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="סך הזמנות" value={String(totalOrders)} />
        <StatCard label="סטים שנמכרו" value={String(totalSetsSold)} hint="לא כולל הזמנות שבוטלו" />
        <StatCard label="סך מכירות" value={formatILS(totalSales / 100)} />
        <StatCard
          label="מקדמות ממתינות לאישור"
          value={String(depositsPending)}
          hint="לקוחות שסימנו תשלום, טרם אושר"
        />
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-emerald-950">מכירות לפי סוג סט</h2>
        {bySet.size === 0 ? (
          <p className="text-emerald-600 text-sm">עדיין אין הזמנות.</p>
        ) : (
          <ul className="divide-y divide-emerald-50">
            {sortedBySet.map((row) => (
              <li key={row.name + row.etrogType} className="flex items-center justify-between py-2">
                <span className="text-emerald-900">
                  {row.name} <span className="text-emerald-600">({row.etrogType})</span>
                </span>
                <span className="font-bold text-emerald-950">{row.count} יח&apos;</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
