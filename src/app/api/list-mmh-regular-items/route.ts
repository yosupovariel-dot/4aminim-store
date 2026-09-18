import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic route — lists every order item referencing the
// "סט מהדרין מן המהדרין, רגיל" product, to manually recompute the true
// total and find the discrepancy. Gated by a secret query param. Delete
// this file (and redeploy) immediately after one use.
const SECRET = "a7d0c3f6b9e2851a4d7c0f3b6e9a2d5c8f1b4e7a0d3c6f9b2e5a8d1c4f7b0e3a";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const items = await prisma.orderItem.findMany({
    where: { setId: "cmtvxmlnw0002l804kj5m4efh" },
    include: { order: { select: { orderNumber: true, customerName: true, status: true } } },
  });

  const sumAll = items.reduce((s, i) => s + i.quantity, 0);
  const sumNotCancelled = items
    .filter((i) => i.order.status !== "CANCELLED")
    .reduce((s, i) => s + i.quantity, 0);

  return NextResponse.json({ ok: true, items, sumAll, sumNotCancelled });
}
