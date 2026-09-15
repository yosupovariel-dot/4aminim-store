import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — corrects the spare-hadassim addon created
// earlier this session: wrong price (was ₪7, should be ₪35) and it should
// never have been shown to customers (admin-only extra, added to a
// specific order after the fact). Gated by a secret query param. Delete
// this file (and redeploy) immediately after one use.
const SECRET = "e2c6a9f3b0d7184c6a2f8b5e1d9c4a7f0b3e6d9a2c5f8b1e4a7d0c3f6b9e2a5d";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.productSet.updateMany({
    where: { slug: "spare-hadassim" },
    data: { price: 3500, customerVisible: false },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}
