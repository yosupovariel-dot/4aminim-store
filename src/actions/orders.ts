"use server";

import { prisma } from "@/lib/prisma";
import { OrderFormSchema } from "@/lib/validation";
import { calcDeposit } from "@/lib/pricing";
import { verifyAdminSession } from "@/lib/dal";
import { resyncOrdersSheet } from "@/lib/googleSheets";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OrderActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  orderNumber?: number;
};

export async function createOrder(
  _prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    items = [];
  }

  const raw = {
    items,
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    neighborhood: formData.get("neighborhood"),
    address: formData.get("address"),
    notes: formData.get("notes"),
    payFullInCash: formData.get("payFullInCash") === "on",
    depositMarkedPaid: formData.get("depositMarkedPaid") === "on",
    termsAccepted: formData.get("termsAccepted") === "on" ? true : undefined,
  };

  const parsed = OrderFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Merge duplicate setIds (defensive — the cart UI shouldn't produce
      // these, but never trust client-submitted data).
      const quantityBySetId = new Map<string, number>();
      for (const item of data.items) {
        quantityBySetId.set(item.setId, (quantityBySetId.get(item.setId) || 0) + item.quantity);
      }

      let totalPrice = 0;
      const itemsToCreate: {
        setId: string;
        setNameSnapshot: string;
        etrogTypeSnapshot: string;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const [setId, quantity] of quantityBySetId) {
        const set = await tx.productSet.findUnique({ where: { id: setId } });
        if (!set || !set.active) {
          throw new Error("אחד הסטים בסל אינו זמין יותר. נא לרענן את הסל.");
        }
        if (set.stockTotal != null && set.stockSold + quantity > set.stockTotal) {
          const remaining = Math.max(set.stockTotal - set.stockSold, 0);
          throw new Error(
            `אין מספיק מלאי עבור "${set.name}" — נותרו ${remaining} יחידות בלבד.`
          );
        }

        totalPrice += set.price * quantity;
        itemsToCreate.push({
          setId: set.id,
          setNameSnapshot: set.name,
          etrogTypeSnapshot: set.etrogType,
          unitPrice: set.price,
          quantity,
        });

        // Always track sold quantity, even when there's no stockTotal limit
        // yet (unlimited) — otherwise the moment an admin later sets a real
        // limit, stockSold is missing every sale that happened before that,
        // and "remaining" comes out wrong (too high).
        await tx.productSet.update({
          where: { id: set.id },
          data: { stockSold: { increment: quantity } },
        });
      }

      // Based on the highest existing order number, not a count of rows —
      // counting breaks the moment any order is ever deleted (the count
      // drops, so this would recompute a number that's still taken by a
      // surviving order and hit the unique constraint on every checkout
      // from then on).
      const lastOrder = await tx.order.findFirst({
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const orderNumber = (lastOrder?.orderNumber ?? 1000) + 1;

      const order = await tx.order.create({
        data: {
          orderNumber,
          totalPrice,
          depositAmount: calcDeposit(totalPrice),
          customerName: data.customerName,
          phone: data.phone,
          neighborhood: data.neighborhood,
          address: data.address,
          notes: data.notes || null,
          payFullInCash: data.payFullInCash,
          depositMarkedPaid: data.depositMarkedPaid,
          depositMarkedAt: data.depositMarkedPaid ? new Date() : null,
          termsAccepted: true,
          items: { create: itemsToCreate },
        },
      });

      return order;
    });

    revalidatePath("/");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    await resyncOrdersSheet();

    return { success: true, orderNumber: result.orderNumber };
  } catch (err) {
    return {
      message: err instanceof Error ? err.message : "אירעה שגיאה, נסו שוב",
    };
  }
}

export async function confirmDeposit(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { depositConfirmed: true, depositConfirmedAt: new Date(), status: "CONFIRMED" },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  await resyncOrdersSheet();
}

export async function unconfirmDeposit(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { depositConfirmed: false, depositConfirmedAt: null },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  await resyncOrdersSheet();
}

export async function markDelivered(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { delivered: true, deliveredAt: new Date() },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function unmarkDelivered(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { delivered: false, deliveredAt: null },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function markDepositExempt(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { depositExempt: true },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function unmarkDepositExempt(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { depositExempt: false },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function markFullyPaid(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { fullyPaid: true, fullyPaidAt: new Date() },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function unmarkFullyPaid(orderId: string) {
  await verifyAdminSession();
  await prisma.order.update({
    where: { id: orderId },
    data: { fullyPaid: false, fullyPaidAt: null },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

// Lets the admin override a specific order item's price (e.g. a discount
// agreed by phone) — the set itself (name/etrog type) is untouched, only
// the price this particular order was charged. Recomputes the order total
// from all its items; doesn't touch the already-calculated depositAmount.
export async function updateOrderItemPrice(orderId: string, orderItemId: string, formData: FormData) {
  await verifyAdminSession();

  const priceShekels = Number(formData.get("unitPrice"));
  if (!Number.isFinite(priceShekels) || priceShekels < 0) return;
  const unitPrice = Math.round(priceShekels * 100);

  await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({ where: { id: orderItemId } });
    if (!item || item.orderId !== orderId) return;

    await tx.orderItem.update({ where: { id: orderItemId }, data: { unitPrice } });

    const items = await tx.orderItem.findMany({ where: { orderId } });
    const totalPrice = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    await tx.order.update({ where: { id: orderId }, data: { totalPrice } });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

// Lets the admin attach an ADDON (e.g. an admin-only extra like spare
// hadassim) to an already-placed order — the customer never sees or
// chooses this; it just raises the total (and so the balance due at
// delivery, since the deposit already collected isn't recalculated).
export async function addOrderExtra(orderId: string, formData: FormData) {
  await verifyAdminSession();

  const setId = String(formData.get("setId") || "");
  if (!setId) return;

  const set = await prisma.productSet.findUnique({ where: { id: setId } });
  if (!set || set.kind !== "ADDON") return;

  await prisma.$transaction(async (tx) => {
    const existingItem = await tx.orderItem.findFirst({ where: { orderId, setId } });
    if (existingItem) {
      await tx.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: 1 } },
      });
    } else {
      await tx.orderItem.create({
        data: {
          orderId,
          setId: set.id,
          setNameSnapshot: set.name,
          etrogTypeSnapshot: set.etrogType,
          unitPrice: set.price,
          quantity: 1,
        },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { totalPrice: { increment: set.price } },
    });
    await tx.productSet.update({
      where: { id: set.id },
      data: { stockSold: { increment: 1 } },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

// Undoes addOrderExtra — only for ADDON line items (regular/special items
// carry stock and deposit implications this doesn't account for).
export async function removeOrderExtra(orderId: string, orderItemId: string) {
  await verifyAdminSession();

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item || item.orderId !== orderId) return;

  const set = await prisma.productSet.findUnique({ where: { id: item.setId } });
  if (set?.kind !== "ADDON") return;

  await prisma.$transaction(async (tx) => {
    if (item.quantity > 1) {
      await tx.orderItem.update({
        where: { id: item.id },
        data: { quantity: { decrement: 1 } },
      });
    } else {
      await tx.orderItem.delete({ where: { id: item.id } });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { totalPrice: { decrement: item.unitPrice } },
    });
    await tx.productSet.update({
      where: { id: set.id },
      data: { stockSold: { decrement: 1 } },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function saveAdminNotes(orderId: string, formData: FormData) {
  await verifyAdminSession();
  const notes = String(formData.get("notes") || "");
  await prisma.order.update({ where: { id: orderId }, data: { adminNotes: notes } });
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function updateOrderDetails(orderId: string, formData: FormData) {
  await verifyAdminSession();

  const customerName = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const neighborhood = String(formData.get("neighborhood") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!customerName || !phone || !neighborhood || !address) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { customerName, phone, neighborhood, address, notes: notes || null },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/orders/${orderId}`);
  await resyncOrdersSheet();
}

export async function deleteOrder(orderId: string) {
  await verifyAdminSession();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return;

    // Restore stock for every item, unless it was already cancelled (in
    // which case stock was already given back when it was cancelled).
    if (order.status !== "CANCELLED") {
      for (const item of order.items) {
        const set = await tx.productSet.findUnique({ where: { id: item.setId } });
        if (set) {
          await tx.productSet.update({
            where: { id: set.id },
            data: { stockSold: { decrement: item.quantity } },
          });
        }
      }
    }

    // OrderItem rows cascade-delete with the order.
    await tx.order.delete({ where: { id: orderId } });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  // Deleting an order can free up a special set's last unit, so the public
  // catalog needs to reflect that immediately in every case.
  revalidatePath("/");
  revalidatePath("/sets/[slug]", "page");
  await resyncOrdersSheet();
  redirect("/admin/orders");
}

export async function manualSheetResync() {
  await verifyAdminSession();
  await resyncOrdersSheet();
  revalidatePath("/admin/orders");
}
