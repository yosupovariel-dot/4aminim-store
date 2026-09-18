import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — deactivates the kids-set product so it can no
// longer be ordered (hidden from the homepage and its own /sets/kids-set
// page), while staying in the database for the admin to review/reactivate
// later. Gated by a secret query param. Delete this file (and redeploy)
// immediately after one use.
const SECRET = "c3f6b9e2a5d8071c4f7a0d3e6b9c2f5a8d1e4b7c0a3f6d9e2b5a8c1f4e7a0d3c";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = await prisma.productSet.updateMany({
    where: { slug: "kids-set" },
    data: { active: false },
  });

  return NextResponse.json({ ok: true, updated: updated.count });
}
