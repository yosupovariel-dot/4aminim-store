import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { HIDDUR_LABEL, HIDDUR_ORDER } from "@/lib/catalog";
import { markDelivered, unmarkDelivered } from "@/actions/orders";
import type { HiddurLevel } from "@prisma/client";

export default async function AdminDistributionPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { set: { select: { hiddurLevel: true } } } } },
  });

  const sold = orders.filter((o) => o.delivered);
  const notSold = orders.filter((o) => !o.delivered);

  const remainingByLevel = new Map<HiddurLevel, number>();
  let remainingOther = 0;
  for (const o of notSold) {
    for (const item of o.items) {
      if (item.set?.hiddurLevel) {
        remainingByLevel.set(
          item.set.hiddurLevel,
          (remainingByLevel.get(item.set.hiddurLevel) ?? 0) + item.quantity
        );
      } else {
        remainingOther += item.quantity;
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">הפצה</h1>
        <p className="mt-1 text-sm text-emerald-600">
          כל ההזמנות המאושרות (שאינן מבוטלות), מחולקות לנמכרו (הופצו) ולא
          נמכרו (טרם הופצו) — ולמטה, כמה סטים נשארו להפצה לפי רמת הידור.
        </p>
      </div>

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-emerald-950">
          נשאר להפיץ — לפי רמת הידור
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HIDDUR_ORDER.map((level) => (
            <StatBox key={level} label={HIDDUR_LABEL[level]} value={remainingByLevel.get(level) ?? 0} />
          ))}
          <StatBox label="ללא רמת הידור (מיוחדים/ילדים/תוספות)" value={remainingOther} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrdersColumn
          title={`נמכרו (הופצו) — ${sold.length}`}
          orders={sold}
          action={unmarkDelivered}
          actionLabel="בטל סימון הפצה"
        />
        <OrdersColumn
          title={`לא נמכרו (טרם הופצו) — ${notSold.length}`}
          orders={notSold}
          action={markDelivered}
          actionLabel="סמן כהופץ"
        />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-emerald-50 p-4">
      <div className="text-xs text-emerald-600">{label}</div>
      <div className="text-2xl font-extrabold text-emerald-950">{value}</div>
    </div>
  );
}

type OrderWithItems = Awaited<ReturnType<typeof prisma.order.findMany<{
  include: { items: { include: { set: { select: { hiddurLevel: true } } } } };
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
