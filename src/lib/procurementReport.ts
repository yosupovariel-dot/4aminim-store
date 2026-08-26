import "server-only";
import { prisma } from "@/lib/prisma";
import { HIDDUR_LABEL } from "@/lib/catalog";

const NOT_CANCELLED = { order: { status: { not: "CANCELLED" as const } } };

function soldQty(set: { orderItems: { quantity: number }[] }) {
  return set.orderItems.reduce((sum, i) => sum + i.quantity, 0);
}

export async function buildProcurementReport() {
  const [regularSets, specialSets, addonSets] = await Promise.all([
    prisma.productSet.findMany({
      where: { kind: "REGULAR", active: true },
      orderBy: [{ etrogType: "asc" }, { sortOrder: "asc" }],
      include: { orderItems: { where: NOT_CANCELLED } },
    }),
    prisma.productSet.findMany({
      where: { kind: "SPECIAL", active: true },
      orderBy: { sortOrder: "asc" },
      include: { orderItems: { where: NOT_CANCELLED } },
    }),
    prisma.productSet.findMany({
      where: { kind: "ADDON", active: true },
      orderBy: { sortOrder: "asc" },
      include: { orderItems: { where: NOT_CANCELLED } },
    }),
  ]);

  const regularTotal = regularSets.reduce((sum, s) => sum + soldQty(s), 0);
  const specialTotal = specialSets.reduce((sum, s) => sum + soldQty(s), 0);
  // All current add-ons are spare-aravot replacements, so their quantity
  // folds into the arava total (not lulav/case) — see checkout add-on copy.
  const addonTotal = addonSets.reduce((sum, s) => sum + soldQty(s), 0);

  const universal = {
    lulav: regularTotal + specialTotal,
    caseCount: regularTotal + specialTotal,
    arava: regularTotal + specialTotal + addonTotal,
  };

  const qtyForLevel = (level: "KOSHER" | "MEHADRIN" | "MEHADRIN_MIN_HAMEHADRIN" | "DIAMOND") =>
    regularSets.filter((s) => s.hiddurLevel === level).reduce((sum, s) => sum + soldQty(s), 0);

  // Hadas quality only really differs at the KOSHER and MEHADRIN tiers —
  // MEHADRIN_MIN_HAMEHADRIN, DIAMOND, and every special set all use the same
  // top-tier hadas, so their demand is reported as one combined bucket.
  const hadassimByLevel = [
    { label: HIDDUR_LABEL.KOSHER, quantity: qtyForLevel("KOSHER") },
    { label: HIDDUR_LABEL.MEHADRIN, quantity: qtyForLevel("MEHADRIN") },
    {
      label: "הידור מובחר (מהדרין מן המהדרין / יהלום / סטים מיוחדים)",
      quantity: qtyForLevel("MEHADRIN_MIN_HAMEHADRIN") + qtyForLevel("DIAMOND") + specialTotal,
    },
  ];

  const etrogimRegular = regularSets.map((s) => ({
    variety: s.etrogType,
    level: s.hiddurLevel,
    label: s.hiddurLevel ? HIDDUR_LABEL[s.hiddurLevel] : s.name,
    quantity: soldQty(s),
  }));

  const etrogimSpecial = specialSets.map((s) => ({
    name: s.name,
    etrogType: s.etrogType,
    quantity: soldQty(s),
  }));

  const addons = addonSets.map((s) => ({ name: s.name, quantity: soldQty(s) }));

  return {
    universal,
    hadassimByLevel,
    etrogimRegular,
    etrogimSpecial,
    addons,
    regularTotal,
    specialTotal,
  };
}

export type ProcurementReport = Awaited<ReturnType<typeof buildProcurementReport>>;
