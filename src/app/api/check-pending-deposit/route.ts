import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic route — identifies which order(s) count toward the
// dashboard's "מקדמות ממתינות לאישור" stat, since local Postgres access is
// broken (IPv6 routing issue). Gated by a secret query param. Delete this
// file (and redeploy) immediately after one use.
const SECRET = "c7b0a3f6e9d2851c4b7a0f3e6d9c2851a4b7e0d3c6f9b2e5a8d1c4f7b0e3a6d9";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { not: "CANCELLED" },
      depositMarkedPaid: true,
      depositConfirmed: false,
      depositExempt: false,
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      depositAmount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, orders });
}
