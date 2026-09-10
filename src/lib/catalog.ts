import type { HiddurLevel } from "@prisma/client";

// Shared catalog vocabulary: etrog varieties and hiddur (kashrut level) tiers,
// used across the homepage, set detail page, and admin sets/reports pages.

export const HIDDUR_LABEL: Record<HiddurLevel, string> = {
  KOSHER: "סט כשר",
  MEHADRIN: "סט מהדרין",
  MEHADRIN_MIN_HAMEHADRIN: "סט מהדרין מן המהדרין",
  DIAMOND: "סט יהלום",
};

export const HIDDUR_ORDER: HiddurLevel[] = [
  "KOSHER",
  "MEHADRIN",
  "MEHADRIN_MIN_HAMEHADRIN",
  "DIAMOND",
];

export const HIDDUR_DESCRIPTION: Record<HiddurLevel, string> = {
  KOSHER: "הרמה הבסיסית העומדת בדרישות ההלכה — איכות נאה ומחיר נגיש.",
  MEHADRIN: "הידור מוקפד יותר בבחירת המינים, לשימוש נוח ואיכות גבוהה.",
  MEHADRIN_MIN_HAMEHADRIN: "הידור מן המובחר — מינים נבחרים ברמת שלמות גבוהה במיוחד.",
  DIAMOND: "הרמה הגבוהה ביותר שלנו — מינים יוצאי דופן, לבחירת המהדרים ביותר.",
};

// Display order for etrog varieties. "רגיל" is the internal/default variety
// key — it must never be shown to customers as an etrog "type" or labeled
// recommended. תימני and מרוקאי are the exceptional, higher-priced options.
export const VARIETY_ORDER = ["רגיל", "תימני", "מרוקאי"] as const;
export type Variety = (typeof VARIETY_ORDER)[number];
export const DEFAULT_VARIETY: Variety = "רגיל";

export function isKnownVariety(value: string): value is Variety {
  return (VARIETY_ORDER as readonly string[]).includes(value);
}

// Customer-facing surfaces should never print "אתרוג רגיל" — the default
// variety has no distinguishing etrog-type label at all.
export function isDefaultVariety(etrogType: string) {
  return etrogType === DEFAULT_VARIETY;
}

// Customer-facing etrog label: just "אתרוג" for the default variety, or
// "אתרוג תימני" / "אתרוג מרוקאי" for the named exceptions. Never "אתרוג רגיל".
export function customerEtrogLabel(etrogType: string) {
  return isDefaultVariety(etrogType) ? "אתרוג" : `אתרוג ${etrogType}`;
}
