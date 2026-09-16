import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic route — verifies the dashboard's "סטים שנמכרו" stat
// against a from-scratch recomputation, broken down by item kind, since
// local Postgres access is broken (IPv6 routing issue). Gated by a secret
// query param. Delete this file (and redeploy) immediately after one use.
const SECRET = "a1d4b7e0c3f6982b5e8a1d4c7f0b3e6a9d2c5f8b1e4a7d0c3f6b9e2a5d8c1f4b";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [orders, donations] = await Promise.all([
    prisma.order.findMany({
      include: { items: { include: { set: { select: { kind: true, name: true } } } } },
    }),
    prisma.donation.findMany(),
  ]);

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const cancelledCount = orders.length - activeOrders.length;

  const byKind: Record<string, number> = {};
  let allItemsQty = 0;
  for (const o of activeOrders) {
    for (const i of o.items) {
      allItemsQty += i.quantity;
      const kind = i.set?.kind ?? "UNKNOWN(deleted set)";
      byKind[kind] = (byKind[kind] ?? 0) + i.quantity;
    }
  }

  const dashboardTotalSetsSold = allItemsQty + donations.length;
  const excludingAddons = (byKind.REGULAR ?? 0) + (byKind.SPECIAL ?? 0) + (byKind.KIDS ?? 0) + donations.length;

  return NextResponse.json({
    ok: true,
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    cancelledOrders: cancelledCount,
    donations: donations.length,
    itemQuantityByKind: byKind,
    dashboardTotalSetsSold, // matches the number currently shown on /admin
    alternativeExcludingAddons: excludingAddons,
  });
}
