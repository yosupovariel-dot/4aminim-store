import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — recomputes stockSold for every ProductSet from
// actual order history. Needed because createOrder used to only increment
// stockSold when stockTotal was already set (a bug, now fixed) — so any
// product that was "unlimited" at the time it sold is missing those sales
// from its stockSold count. Gated by a secret query param. Delete this file
// (and redeploy) immediately after one use.
const SECRET = "d3f6c9b2e5a8017d4f7c0b3e6a9d2851c4f7a0d3e6b9c2f5a8d1e4b7c0f3a6d9";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [allSets, orderItems] = await Promise.all([
    prisma.productSet.findMany({ select: { id: true, name: true, etrogType: true, stockSold: true } }),
    prisma.orderItem.findMany({
      where: { order: { status: { not: "CANCELLED" } } },
      select: { setId: true, quantity: true },
    }),
  ]);

  const soldBySet = new Map<string, number>();
  for (const item of orderItems) {
    soldBySet.set(item.setId, (soldBySet.get(item.setId) ?? 0) + item.quantity);
  }

  const changes: { name: string; etrogType: string; before: number; after: number }[] = [];
  const updates = [];
  for (const set of allSets) {
    const correct = soldBySet.get(set.id) ?? 0;
    if (correct !== set.stockSold) {
      changes.push({ name: set.name, etrogType: set.etrogType, before: set.stockSold, after: correct });
      updates.push(prisma.productSet.update({ where: { id: set.id }, data: { stockSold: correct } }));
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return NextResponse.json({ ok: true, changedCount: updates.length, changes });
}
