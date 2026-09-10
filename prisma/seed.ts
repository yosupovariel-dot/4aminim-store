import { PrismaClient, SetKind, HiddurLevel, MediaType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real catalog: 3 etrog varieties × 4 hiddur levels = 12 regular sets.
// Prices in agorot (1 ש"ח = 100).
const HIDDUR_LABEL: Record<HiddurLevel, string> = {
  KOSHER: "סט כשר",
  MEHADRIN: "סט מהדרין",
  MEHADRIN_MIN_HAMEHADRIN: "סט מהדרין מן המהדרין",
  DIAMOND: "סט יהלום",
};

const VARIETY_PRICING: Record<string, Record<HiddurLevel, number>> = {
  "רגיל": {
    KOSHER: 10000,
    MEHADRIN: 12000,
    MEHADRIN_MIN_HAMEHADRIN: 13000,
    DIAMOND: 20000,
  },
  "תימני": {
    KOSHER: 16000,
    MEHADRIN: 18000,
    MEHADRIN_MIN_HAMEHADRIN: 20000,
    DIAMOND: 30000,
  },
  "מרוקאי": {
    KOSHER: 16000,
    MEHADRIN: 18000,
    MEHADRIN_MIN_HAMEHADRIN: 20000,
    DIAMOND: 30000,
  },
};

const VARIETY_SLUG: Record<string, string> = {
  "רגיל": "regular",
  "תימני": "temani",
  "מרוקאי": "moroccan",
};

const LEVEL_SLUG: Record<HiddurLevel, string> = {
  KOSHER: "kosher",
  MEHADRIN: "mehadrin",
  MEHADRIN_MIN_HAMEHADRIN: "mehadrin-min-hamehadrin",
  DIAMOND: "diamond",
};

const LEVEL_ORDER: HiddurLevel[] = ["KOSHER", "MEHADRIN", "MEHADRIN_MIN_HAMEHADRIN", "DIAMOND"];
const VARIETY_ORDER = ["רגיל", "תימני", "מרוקאי"];

function buildRegularSets() {
  const sets: {
    slug: string;
    name: string;
    etrogType: string;
    hiddurLevel: HiddurLevel;
    description: string;
    price: number;
    sortOrder: number;
  }[] = [];

  let sortOrder = 1;
  for (const variety of VARIETY_ORDER) {
    for (const level of LEVEL_ORDER) {
      sets.push({
        slug: `${VARIETY_SLUG[variety]}-${LEVEL_SLUG[level]}`,
        name: HIDDUR_LABEL[level],
        etrogType: variety,
        hiddurLevel: level,
        description: `סט ארבעת המינים ברמת הידור "${HIDDUR_LABEL[level]}", עם אתרוג ${variety}. כולל לולב, הדסים, ערבות ואתרוג.`,
        price: VARIETY_PRICING[variety][level],
        sortOrder: sortOrder++,
      });
    }
  }
  return sets;
}

// Legacy placeholder regular sets from the previous catalog structure — kept
// (not deleted) so any existing orders referencing them stay intact, but
// deactivated so they no longer show on the site.
const LEGACY_REGULAR_SLUGS = ["basic", "premium", "deluxe"];

// Each special set is ONE unique physical set with a specific etrog — not a
// batch of identical units. stockTotal is always 1: once ordered, it's this
// particular etrog that's gone, and the listing disappears from the site.
const SPECIAL_SETS = [
  {
    slug: "special-yanover",
    name: "סט מיוחד — יאנובר",
    etrogType: "אתרוג יאנובר מיוחד",
    description:
      "סט חגיגי עם אתרוג יאנובר מיוחד אחד ויחיד, נבחר ידנית. ברגע שהסט הזה נמכר, הוא יורד מהאתר.",
    price: 75000,
    stockTotal: 1,
    sortOrder: 1,
  },
  {
    slug: "special-collectors",
    name: "סט אספנים",
    etrogType: "אתרוג תימני מיוחד",
    description:
      "סט אספנים מפואר במיוחד, כולל אריזת מתנה חגיגית — אתרוג ייחודי אחד בלבד.",
    price: 95000,
    stockTotal: 1,
    sortOrder: 2,
  },
];

// Optional add-on, offered at checkout — not a full set. Price is a
// placeholder; adjust from the admin sets page.
const ADDON_SETS = [
  {
    slug: "spare-aravot",
    name: "ערבות ספייר (להחלפה)",
    etrogType: "תוספת",
    description:
      "ערבות מתייבשות תוך מספר ימים — כדאי להחזיק זוג ערבות רזרביות כדי להחליף באמצע החג ולהמשיך לקיים את המצווה בהידור.",
    price: 700,
    sortOrder: 1,
  },
];

async function main() {
  for (const set of buildRegularSets()) {
    await prisma.productSet.upsert({
      where: { slug: set.slug },
      update: {
        name: set.name,
        etrogType: set.etrogType,
        hiddurLevel: set.hiddurLevel,
        description: set.description,
        price: set.price,
        sortOrder: set.sortOrder,
        active: true,
      },
      create: { ...set, kind: SetKind.REGULAR },
    });
  }

  for (const slug of LEGACY_REGULAR_SLUGS) {
    await prisma.productSet.updateMany({
      where: { slug },
      data: { active: false },
    });
  }

  for (const set of SPECIAL_SETS) {
    const created = await prisma.productSet.upsert({
      where: { slug: set.slug },
      update: {},
      create: { ...set, kind: SetKind.SPECIAL },
    });
    const existingMedia = await prisma.setMedia.count({
      where: { setId: created.id },
    });
    if (existingMedia === 0) {
      await prisma.setMedia.create({
        data: {
          setId: created.id,
          type: MediaType.IMAGE,
          url: "/images/placeholder-set.svg",
          sortOrder: 0,
        },
      });
    }
  }

  for (const set of ADDON_SETS) {
    await prisma.productSet.upsert({
      where: { slug: set.slug },
      update: {},
      create: { ...set, kind: SetKind.ADDON },
    });
  }

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-please";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash, failedAttempts: 0, lockedUntil: null },
    create: { username: adminUsername, passwordHash },
  });

  console.log("Seed complete.");
  console.log(`Admin login -> username: "${adminUsername}", password: (from .env ADMIN_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
