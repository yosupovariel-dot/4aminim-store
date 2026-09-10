import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { NEIGHBORHOODS } from "@/lib/validation";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { DeleteOrderButton } from "@/components/DeleteOrderButton";
import {
  confirmDeposit,
  unconfirmDeposit,
  saveAdminNotes,
  markDelivered,
  unmarkDelivered,
  updateOrderDetails,
  deleteOrder,
} from "@/actions/orders";

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const otherOrders = await prisma.order.findMany({
    where: { phone: order.phone, id: { not: order.id } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const confirmDepositAction = confirmDeposit.bind(null, order.id);
  const unconfirmDepositAction = unconfirmDeposit.bind(null, order.id);
  const saveNotesAction = saveAdminNotes.bind(null, order.id);
  const markDeliveredAction = markDelivered.bind(null, order.id);
  const unmarkDeliveredAction = unmarkDelivered.bind(null, order.id);
  const updateDetailsAction = updateOrderDetails.bind(null, order.id);
  const deleteOrderAction = deleteOrder.bind(null, order.id);

  const itemsSummary = order.items
    .map((i) => `${i.setNameSnapshot} × ${i.quantity}`)
    .join(", ");
  const whatsappMessage = `שלום ${order.customerName}, ההזמנה שלך (מס' ${order.orderNumber}) — ${itemsSummary} — התקבלה במערכת.`;
  const customerWhatsappLink = `https://wa.me/972${order.phone.replace(/^0/, "")}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-emerald-600 hover:underline">
            ← חזרה לרשימת ההזמנות
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-emerald-950">
            הזמנה #{order.orderNumber}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold text-emerald-950">פרטי לקוח</h2>
          <form action={updateDetailsAction} className="space-y-2">
            <label className="block text-sm">
              <span className="mb-1 block text-emerald-700">שם</span>
              <input
                name="customerName"
                defaultValue={order.customerName}
                required
                className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-emerald-700">טלפון</span>
              <input
                name="phone"
                defaultValue={order.phone}
                required
                dir="ltr"
                className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-emerald-700">שכונה</span>
              <select
                name="neighborhood"
                defaultValue={order.neighborhood}
                required
                className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
              >
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-emerald-700">כתובת</span>
              <input
                name="address"
                defaultValue={order.address}
                required
                className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-emerald-700">הערות לקוח</span>
              <textarea
                name="notes"
                defaultValue={order.notes || ""}
                rows={2}
                className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
              />
            </label>
            <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              שמירת פרטי לקוח
            </button>
          </form>
          <a
            href={customerWhatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            שליחת הודעת אישור בוואטסאפ
          </a>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-2">
          <h2 className="mb-2 font-bold text-emerald-950">פרטי הזמנה ותשלום</h2>
          <div className="space-y-1 rounded-xl bg-emerald-50 p-3">
            {order.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <span className="text-emerald-900">
                  {i.setNameSnapshot} × {i.quantity}
                </span>
                <span className="font-medium text-emerald-950">
                  {formatILS((i.unitPrice * i.quantity) / 100)}
                </span>
              </div>
            ))}
          </div>
          <Row label="מחיר כולל" value={formatILS(order.totalPrice / 100)} />
          {order.payFullInCash ? (
            <Row label="אופן תשלום" value="הכל במזומן במסירה" />
          ) : (
            <>
              <Row label="מקדמה נדרשת" value={formatILS(order.depositAmount / 100)} />
              <Row
                label="הלקוח סימן שהעביר"
                value={order.depositMarkedPaid ? "כן" : "לא"}
              />
            </>
          )}
          <Row
            label="יתרה לתשלום במסירה"
            value={formatILS(
              (order.payFullInCash ? order.totalPrice : order.totalPrice - order.depositAmount) / 100
            )}
          />
          <Row
            label="תאריך אישור תקנון"
            value={new Date(order.createdAt).toLocaleString("he-IL")}
          />

          {!order.payFullInCash && (
            <div className="pt-3">
              {order.depositConfirmed ? (
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                    מקדמה אושרה כהתקבלה ✓
                  </span>
                  <form action={unconfirmDepositAction}>
                    <button className="text-xs text-emerald-600 underline">בטל אישור</button>
                  </form>
                </div>
              ) : (
                <form action={confirmDepositAction}>
                  <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    סמן שהמקדמה התקבלה בפועל
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-emerald-950">הפצה / מסירה</h2>
        {order.delivered ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              הופץ ללקוח ✓
              {order.deliveredAt && (
                <span className="mr-1 font-normal text-emerald-600">
                  ({new Date(order.deliveredAt).toLocaleDateString("he-IL")})
                </span>
              )}
            </span>
            <form action={unmarkDeliveredAction}>
              <button className="text-xs text-emerald-600 underline">בטל סימון</button>
            </form>
          </div>
        ) : (
          <form action={markDeliveredAction}>
            <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              סמן שהופץ ללקוח
            </button>
          </form>
        )}
      </section>

      {otherOrders.length > 0 && (
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-bold text-emerald-950">הזמנות נוספות מאותו לקוח</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {otherOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className={`rounded-xl border p-3 text-sm transition-colors hover:bg-emerald-50 ${
                  o.status === "CANCELLED" ? "border-neutral-200 bg-neutral-50" : "border-emerald-100"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-semibold text-emerald-800">#{o.orderNumber}</span>
                  <span className="text-xs text-emerald-500">
                    {new Date(o.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
                <ul className="space-y-0.5 text-emerald-950">
                  {o.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.setNameSnapshot}</span>
                      <span className="shrink-0 font-medium text-emerald-700">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-emerald-950">הערות מנהל (פנימי)</h2>
        <form action={saveNotesAction} className="space-y-3">
          <textarea
            name="notes"
            defaultValue={order.adminNotes || ""}
            className="w-full min-h-24 rounded-xl border border-emerald-200 p-3 text-sm"
            placeholder="הערות פנימיות שלא מוצגות ללקוח..."
          />
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            שמירת הערות
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
        <h2 className="mb-1 font-bold text-red-800">מחיקת הזמנה</h2>
        <p className="mb-3 text-sm text-red-700">
          מחיקה מסירה את ההזמנה לצמיתות ומחזירה את המלאי של הסטים שבה (כולל
          החזרת סט מיוחד לתצוגה באתר אם רלוונטי). לא ניתן לבטל פעולה זו.
        </p>
        <form action={deleteOrderAction}>
          <DeleteOrderButton orderNumber={order.orderNumber} />
        </form>
      </section>
    </div>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-emerald-600">{label}</span>
      <span className="text-right font-medium text-emerald-950" dir={dir}>
        {value}
      </span>
    </div>
  );
}
