import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  confirmDeposit,
  unconfirmDeposit,
  setOrderStatus,
  saveAdminNotes,
  markDelivered,
  unmarkDelivered,
} from "@/actions/orders";

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const confirmDepositAction = confirmDeposit.bind(null, order.id);
  const unconfirmDepositAction = unconfirmDeposit.bind(null, order.id);
  const saveNotesAction = saveAdminNotes.bind(null, order.id);
  const markDeliveredAction = markDelivered.bind(null, order.id);
  const unmarkDeliveredAction = unmarkDelivered.bind(null, order.id);

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
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-2">
          <h2 className="mb-2 font-bold text-emerald-950">פרטי לקוח</h2>
          <Row label="שם" value={order.customerName} />
          <Row label="טלפון" value={order.phone} dir="ltr" />
          <Row label="שכונה" value={order.neighborhood} />
          <Row label="כתובת" value={order.address} />
          {order.notes && <Row label="הערות לקוח" value={order.notes} />}
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
          <Row label="מקדמה נדרשת" value={formatILS(order.depositAmount / 100)} />
          <Row
            label="הלקוח סימן שהעביר"
            value={order.depositMarkedPaid ? "כן" : "לא"}
          />
          <Row
            label="תאריך אישור תקנון"
            value={new Date(order.createdAt).toLocaleString("he-IL")}
          />

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

      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-emerald-950">עדכון סטטוס הזמנה</h2>
        <div className="flex flex-wrap gap-2">
          {(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((status) => (
            <form key={status} action={setOrderStatus.bind(null, order.id, status)}>
              <button
                disabled={order.status === status}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  order.status === status
                    ? "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                    : status === "CANCELLED"
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {STATUS_LABEL[status]}
              </button>
            </form>
          ))}
        </div>
      </section>

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
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתינה",
  CONFIRMED: "אושרה",
  CANCELLED: "ביטול הזמנה",
  COMPLETED: "הושלמה",
};

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
