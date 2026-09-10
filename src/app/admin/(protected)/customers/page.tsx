import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";

type OrderItemSummary = { name: string; quantity: number };
type CustomerOrder = {
  id: string;
  orderNumber: number;
  delivered: boolean;
  status: string;
  items: OrderItemSummary[];
};
type CustomerRow = {
  phone: string;
  name: string;
  neighborhood: string;
  address: string;
  totalSpent: number;
  orders: CustomerOrder[];
};

export default async function AdminCustomersPage({
  searchParams,
}: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const setFilter = typeof sp.set === "string" ? sp.set : "";
  const deliveredFilter = typeof sp.delivered === "string" ? sp.delivered : "";

  const [orders, filterOptions] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { set: true } } },
    }),
    prisma.productSet.findMany({
      where: { active: true },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      select: { slug: true, name: true, etrogType: true, kind: true },
    }),
  ]);

  const customers = new Map<string, CustomerRow>();

  for (const order of orders) {
    if (setFilter && !order.items.some((i) => i.set?.slug === setFilter)) continue;

    const isCancelled = order.status === "CANCELLED";
    const orderSummary: CustomerOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      delivered: order.delivered,
      status: order.status,
      items: order.items.map((i) => ({ name: i.setNameSnapshot, quantity: i.quantity })),
    };

    const existing = customers.get(order.phone);
    if (!existing) {
      customers.set(order.phone, {
        phone: order.phone,
        name: order.customerName,
        neighborhood: order.neighborhood,
        address: order.address,
        totalSpent: isCancelled ? 0 : order.totalPrice,
        orders: [orderSummary],
      });
    } else {
      if (!isCancelled) existing.totalSpent += order.totalPrice;
      existing.orders.push(orderSummary);
      // orders are already sorted desc by createdAt, so the first one we see
      // per phone is the most recent — keep that as the display name/address.
    }
  }

  let rows = Array.from(customers.values());

  if (q) {
    rows = rows.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }

  const rowsWithDelivery = rows.map((c) => {
    const activeOrders = c.orders.filter((o) => o.status !== "CANCELLED");
    const deliveredCount = activeOrders.filter((o) => o.delivered).length;
    const fullyDelivered = activeOrders.length > 0 && deliveredCount === activeOrders.length;
    return { customer: c, activeOrders, deliveredCount, fullyDelivered };
  });

  const filteredByDelivery =
    deliveredFilter === "yes"
      ? rowsWithDelivery.filter((r) => r.fullyDelivered)
      : deliveredFilter === "no"
      ? rowsWithDelivery.filter((r) => !r.fullyDelivered)
      : rowsWithDelivery;

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (setFilter) baseParams.set("set", setFilter);
  const DELIVERY_TABS: { value: string; label: string }[] = [
    { value: "", label: "הכל" },
    { value: "yes", label: "קיבלו משלוח" },
    { value: "no", label: "טרם קיבלו משלוח" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">לקוחות</h1>
        <p className="mt-1 text-sm text-emerald-600">
          {filteredByDelivery.length} לקוחות · כל שורה מציגה בדיוק אילו סטים ובאיזו כמות הוזמנו בכל הזמנה
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="חיפוש לפי שם או טלפון"
          className="min-w-0 flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm"
        />
        <select
          name="set"
          defaultValue={setFilter}
          className="rounded-lg border border-emerald-200 px-3 py-2 text-sm"
        >
          <option value="">כל הסטים</option>
          {filterOptions.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.kind === "SPECIAL" ? "★ " : s.kind === "ADDON" ? "+ " : ""}
              {s.name} ({s.etrogType})
            </option>
          ))}
        </select>
        <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          סינון
        </button>
        {(q || setFilter) && (
          <Link
            href="/admin/customers"
            className="rounded-full px-4 py-2 text-sm font-medium text-emerald-600 underline"
          >
            איפוס
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {DELIVERY_TABS.map((tab) => {
          const params = new URLSearchParams(baseParams);
          if (tab.value) params.set("delivered", tab.value);
          const href = params.toString() ? `/admin/customers?${params.toString()}` : "/admin/customers";
          return (
            <Link
              key={tab.value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                deliveredFilter === tab.value
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4">
        {filteredByDelivery.map(({ customer: c, activeOrders, deliveredCount }) => {
          const deliveryLabel =
            activeOrders.length === 0
              ? "—"
              : deliveredCount === activeOrders.length
              ? "הופץ במלואו ✓"
              : deliveredCount === 0
              ? "טרם הופץ"
              : `הופץ חלקית (${deliveredCount}/${activeOrders.length})`;
          const deliveryStyle =
            activeOrders.length === 0
              ? "bg-neutral-100 text-neutral-500"
              : deliveredCount === activeOrders.length
              ? "bg-emerald-100 text-emerald-800"
              : deliveredCount === 0
              ? "bg-red-50 text-red-700"
              : "bg-amber-100 text-amber-800";

          return (
            <div key={c.phone} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-emerald-950">{c.name}</div>
                  <div className="text-sm text-emerald-700" dir="ltr">
                    {c.phone}
                  </div>
                  <div className="mt-0.5 text-sm text-emerald-600">
                    {c.neighborhood}, {c.address}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-lg font-extrabold text-emerald-900">
                    {formatILS(c.totalSpent / 100)}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${deliveryStyle}`}>
                    {deliveryLabel}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {c.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className={`rounded-xl border p-3 text-sm transition-colors hover:bg-emerald-50 ${
                      o.status === "CANCELLED" ? "border-neutral-200 bg-neutral-50" : "border-emerald-100"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-semibold text-emerald-800">#{o.orderNumber}</span>
                      <span
                        className={`text-xs ${
                          o.status === "CANCELLED"
                            ? "text-neutral-500"
                            : o.delivered
                            ? "text-emerald-600"
                            : "text-amber-700"
                        }`}
                      >
                        {o.status === "CANCELLED" ? "בוטלה" : o.delivered ? "הופץ" : "טרם הופץ"}
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-emerald-950">
                      {o.items.map((item, i) => (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span className="truncate">{item.name}</span>
                          <span className="shrink-0 font-medium text-emerald-700">× {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {filteredByDelivery.length === 0 && (
          <p className="rounded-2xl border border-emerald-100 bg-white px-4 py-8 text-center text-emerald-500 shadow-sm">
            לא נמצאו לקוחות
          </p>
        )}
      </div>
    </div>
  );
}
