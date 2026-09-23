import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { HIDDUR_LABEL, HIDDUR_ORDER, VARIETY_ORDER } from "@/lib/catalog";
import { markDelivered, unmarkDelivered } from "@/actions/orders";
import type { HiddurLevel } from "@prisma/client";

const VARIETY_RANK = new Map<string, number>(VARIETY_ORDER.map((v, i) => [v, i]));
const HIDDUR_RANK = new Map(HIDDUR_ORDER.map((h, i) => [h, i]));

export default async function AdminDistributionPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { set: { select: { hiddurLevel: true, etrogType: true } } } } },
  });

  const sold = orders.filter((o) => o.delivered);
  const notSold = orders.filter((o) => !o.delivered);

  // Group each undelivered order's items by (etrogType, hiddurLevel) combo,
  // so the admin can drill from "20 left to distribute" straight down to
  // who exactly is still waiting for that specific set.
  type Combo = {
    key: string;
    label: string;
    quantity: number;
    orders: { id: string; orderNumber: number; customerName: string; phone: string; qty: number }[];
  };
  const combos = new Map<string, Combo>();

  for (const o of notSold) {
    for (const item of o.items) {
      const etrogType = item.set?.etrogType ?? null;
      const hiddurLevel = item.set?.hiddurLevel ?? null;
      const key = hiddurLevel ? `${etrogType}::${hiddurLevel}` : "other";
      const label = hiddurLevel
        ? `${HIDDUR_LABEL[hiddurLevel]} (${etrogType})`
        : "ללא רמת הידור (מיוחדים/ילדים/תוספות)";

      let combo = combos.get(key);
      if (!combo) {
        combo = { key, label, quantity: 0, orders: [] };
        combos.set(key, combo);
      }
      combo.quantity += item.quantity;
      combo.orders.push({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        phone: o.phone,
        qty: item.quantity,
      });
    }
  }

  const sortedCombos = Array.from(combos.values()).sort((a, b) => {
    if (a.key === "other") return 1;
    if (b.key === "other") return -1;
    const [aVariety, aLevel] = a.key.split("::");
    const [bVariety, bLevel] = b.key.split("::");
    const varietyDiff = (VARIETY_RANK.get(aVariety) ?? 99) - (VARIETY_RANK.get(bVariety) ?? 99);
    if (varietyDiff !== 0) return varietyDiff;
    return (
      (HIDDUR_RANK.get(aLevel as HiddurLevel) ?? 99) - (HIDDUR_RANK.get(bLevel as HiddurLevel) ?? 99)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">הפצה</h1>
        <p className="mt-1 text-sm text-emerald-600">
          כל ההזמנות המאושרות (שאינן מבוטלות), מחולקות לנמכרו (הופצו) ולא
          נמכרו (טרם הופצו).
        </p>
      </div>

      <OrdersColumn
        title={`כל מי שנשאר להפיץ לו — ${notSold.length}`}
        orders={notSold}
        action={markDelivered}
        actionLabel="סמן כהופץ"
      />

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-bold text-emerald-950">
          נשאר להפיץ — לפי סוג אתרוג ורמת הידור
        </h2>
        <p className="mb-4 text-xs text-emerald-500">לחיצה על כל תיבה מציגה את הלקוחות המתאימים.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCombos.map((combo) => (
            <details key={combo.key} className="group rounded-xl bg-emerald-50 open:bg-emerald-100/70">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4">
                <span className="text-sm text-emerald-700">{combo.label}</span>
                <span className="text-2xl font-extrabold text-emerald-950">{combo.quantity}</span>
              </summary>
              <div className="space-y-1.5 px-4 pb-4">
                {combo.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs hover:bg-emerald-50"
                  >
                    <span className="font-medium text-emerald-900">
                      #{o.orderNumber} {o.customerName}
                    </span>
                    <span className="text-emerald-600" dir="ltr">
                      {o.phone} {o.qty > 1 ? `× ${o.qty}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
          {sortedCombos.length === 0 && (
            <p className="text-sm text-emerald-500">אין כרגע סטים שממתינים להפצה.</p>
          )}
        </div>
      </section>

      <OrdersColumn
        title={`נמכרו (הופצו) — ${sold.length}`}
        orders={sold}
        action={unmarkDelivered}
        actionLabel="בטל סימון הפצה"
      />
    </div>
  );
}

type OrderWithItems = Awaited<ReturnType<typeof prisma.order.findMany<{
  include: { items: { include: { set: { select: { hiddurLevel: true; etrogType: true } } } } };
}>>>[number];

function OrdersColumn({
  title,
  orders,
  action,
  actionLabel,
}: {
  title: string;
  orders: OrderWithItems[];
  action: (orderId: string) => Promise<void>;
  actionLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-emerald-950">{title}</h2>
      <div className="space-y-2">
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-sm"
          >
            <div className="min-w-0">
              <Link href={`/admin/orders/${o.id}`} className="font-semibold text-emerald-700 hover:underline">
                #{o.orderNumber}
              </Link>{" "}
              <span className="text-emerald-900">{o.customerName}</span>
              <div className="text-xs text-emerald-600">
                {o.items.map((i) => `${i.setNameSnapshot} × ${i.quantity}`).join(", ")}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-semibold text-emerald-950">{formatILS(o.totalPrice / 100)}</span>
              <form action={action.bind(null, o.id)}>
                <button className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100">
                  {actionLabel}
                </button>
              </form>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-emerald-500">אין הזמנות כאן.</p>}
      </div>
    </section>
  );
}
