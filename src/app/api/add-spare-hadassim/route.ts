import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — creates the "הדסים ספייר" addon on production,
// since local Postgres access is broken (IPv6 routing issue). Gated by a
// secret query param. Delete this file (and redeploy) immediately after
// one use.
const SECRET = "b3f7e1a9c5d20846f1a7c3e9b6d05af2c8e4b0f6a3d9c1e7b5f0a4c8e2d6b9a1";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await prisma.productSet.findUnique({ where: { slug: "spare-hadassim" } });
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
      slug: "spare-hadassim",
      name: "הדסים ספייר (להחלפה)",
      etrogType: "תוספת",
      description:
        "הדסים מתייבשים תוך מספר ימים — כדאי להחזיק שלישיית הדסים רזרבית כדי להחליף באמצע החג ולהמשיך לקיים את המצווה בהידור.",
      price: 700,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      active: true,
    },
  });

  return NextResponse.json({ ok: true, log: ["created spare-hadassim addon"] });
}
