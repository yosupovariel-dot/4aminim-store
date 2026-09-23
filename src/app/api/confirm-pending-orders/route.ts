import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — moves every existing PENDING (non-cancelled)
// order to CONFIRMED, since new orders no longer go through a pending step
// (see createOrder). Without this, existing orders from before the change
// wouldn't show up in the new admin distribution view. Gated by a secret
// query param. Delete this file (and redeploy) immediately after one use.
const SECRET = "b1e4a7d0c3f6924b5e8a1d4c7f0b3e6a9d2c5f8b1e4a7d0c3f6b9e2a5d8c1f4b";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.order.updateMany({
    where: { status: "PENDING" },
    data: { status: "CONFIRMED" },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}
