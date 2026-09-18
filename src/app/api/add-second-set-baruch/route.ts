import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resyncOrdersSheet } from "@/lib/googleSheets";

// TEMPORARY one-off route — adds a second unit of the same item already on
// order #1020 (ברוך, 0505510244): סט מהדרין מן המהדרין, רגיל, ₪140 — same
// price as the existing unit, same order. Gated by a secret query param.
// Delete this file (and redeploy) immediately after one use.
const SECRET = "e6d9c2f5a8b1074e7d0a3c6f9b2e5a8d1c4f7b0e3a6d9c2f5b8e1a4d7c0f3b6e";

const ORDER_ID = "cmu2hskis0003lb046e65urb2";
const ORDER_ITEM_ID = "cmu2hskis0005lb04952y09np";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const item = await prisma.orderItem.findUnique({ where: { id: ORDER_ITEM_ID } });
  if (!item || item.orderId !== ORDER_ID) {
    return NextResponse.json({ ok: false, error: "order item not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({
      where: { id: ORDER_ITEM_ID },
      data: { quantity: { increment: 1 } },
    });
    await tx.order.update({
      where: { id: ORDER_ID },
      data: { totalPrice: { increment: item.unitPrice } },
    });
    await tx.productSet.update({
      where: { id: item.setId },
      data: { stockSold: { increment: 1 } },
    });
  });

  await resyncOrdersSheet();

  const updated = await prisma.order.findUnique({
    where: { id: ORDER_ID },
    include: { items: true },
  });

  return NextResponse.json({ ok: true, order: updated });
}
