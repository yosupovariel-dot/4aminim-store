import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — creates the free, admin-only "קויישלך" addon on
// production, since local Postgres access is broken (IPv6 routing issue).
// Gated by a secret query param. Delete this file (and redeploy)
// immediately after one use.
const SECRET = "f4a8d1c6e9b30257a4d8c1f6e9b3057a2d5c8f1e4b7a0d3c6f9b2e5a8d1c4f7b";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await prisma.productSet.findUnique({ where: { slug: "koyshelach" } });
  if (existing) {
    return NextResponse.json({ ok: true, log: ["already exists"] });
  }

  const maxSort = await prisma.productSet.aggregate({
    where: { kind: "ADDON" },
    _max: { sortOrder: true },
  });

  await prisma.productSet.create({
    data: {
      kind: "ADDON",
      slug: "koyshelach",
      name: "קויישלך",
      etrogType: "תוספת",
      description:
        "מתנה חינמית שהמנהל מוסיף לפי שיקול דעתו להזמנות נבחרות — לא מוצגת ללקוח ולא ניתנת להוספה עצמית.",
      price: 0,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      active: true,
      customerVisible: false,
    },
  });

  return NextResponse.json({ ok: true, log: ["created koyshelach addon"] });
}
