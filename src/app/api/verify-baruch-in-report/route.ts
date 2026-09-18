import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildProcurementReport } from "@/lib/procurementReport";

// TEMPORARY diagnostic route — confirms Baruch's added second unit is
// reflected in the procurement report and the raw product stockSold, not
// just in the order row itself. Gated by a secret query param. Delete this
// file (and redeploy) immediately after one use.
const SECRET = "f0a3d6c9b2e5871f4a7d0c3f6b9e2a5d8c1f4b7e0a3d6c9f2b5e8a1d4c7f0b3e";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const set = await prisma.productSet.findUnique({
    where: { id: "cmtvxmlnw0002l804kj5m4efh" }, // סט מהדרין מן המהדרין, רגיל
    select: { name: true, etrogType: true, stockSold: true, stockTotal: true },
  });

  const report = await buildProcurementReport();
  const reportRow = report.etrogimRegular.find(
    (r) => r.variety === "רגיל" && r.level === "MEHADRIN_MIN_HAMEHADRIN"
  );

  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { items: true },
  });
  const totalSetsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return NextResponse.json({
    ok: true,
    productSet: set,
    procurementReportRow: reportRow,
    dashboardTotalSetsSold: totalSetsSold,
    dashboardTotalSales: totalSales,
  });
}
