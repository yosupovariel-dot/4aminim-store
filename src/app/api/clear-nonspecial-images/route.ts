import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — removes all SetMedia rows from every ProductSet
// that isn't kind SPECIAL (regular/kids/addon), per decision that only
// one-of-a-kind special sets should show a specific photo (regular/kids
// sets are a random pick from stock, so a specific photo is misleading).
// Gated by a secret query param. Delete this file (and redeploy)
// immediately after one use.
const SECRET = "d8f2b5e9c3a70164d9f3c7b2e5a80936d1f4c8b3e6a92057d3f6c1b9e4a80572";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const nonSpecialSets = await prisma.productSet.findMany({
    where: { kind: { not: "SPECIAL" } },
    select: { id: true, slug: true },
  });

  const result = await prisma.setMedia.deleteMany({
    where: { setId: { in: nonSpecialSets.map((s) => s.id) } },
  });

  return NextResponse.json({
    ok: true,
    sets: nonSpecialSets.map((s) => s.slug),
    deletedImages: result.count,
  });
}
