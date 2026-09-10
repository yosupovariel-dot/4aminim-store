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

        if (set.stockTotal != null) {
          await tx.productSet.update({
            where: { id: set.id },
            data: { stockSold: { increment: quantity } },
          });
        }
      }

      const orderCount = await tx.order.count();
      const orderNumber = 1000 + orderCount + 1;

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
        if (set?.stockTotal != null) {
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
