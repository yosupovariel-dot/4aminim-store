import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic route — looks up the customer "ברוך" and their
// order(s), to figure out exactly what "add a set" should mean here.
// Gated by a secret query param. Delete this file (and redeploy)
// immediately after one use.
const SECRET = "b9e2c5f8a1d4067b3e6c9f2a5d8b1e4c7a0d3f6b9c2e5a8d1f4c7b0a3e6d9c2f";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: { customerName: { contains: "ברוך" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, orders });
}
