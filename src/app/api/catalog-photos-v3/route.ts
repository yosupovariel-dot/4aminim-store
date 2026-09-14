import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route — pulls in 3 additional real, public-domain etrog
// photos from Wikimedia Commons (verified public-domain, no attribution
// required) to further diversify the regular-set images, and cuts down how
// often the shared lulav-packaging photo repeats across products. Gated by
// a secret query param. Delete this file (and redeploy) immediately after
// one use.
const SECRET = "a4d7c2f9e1b6083d5a9c2e7f4b1d8a6c3e0f7b4d1a8c5e2f9b6d3a0c7e4f1b8d";

const EXTERNAL_SOURCES = {
  balady:
    "https://upload.wikimedia.org/wikipedia/commons/3/35/Balady_citron_%28Braverman_cultivar%29.jpg",
  moroccan:
    "https://upload.wikimedia.org/wikipedia/commons/a/a9/MoroccanEtrog.jpg",
  pitom: "https://upload.wikimedia.org/wikipedia/commons/4/49/Etrog_with_Pitom.jpg",
};

async function uploadFromUrl(pathname: string, sourceUrl: string) {
  // Wikimedia's upload servers reject requests without a descriptive
  // User-Agent (returns 403) per their bot/reuse policy.
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "4aminim-store-catalog-import/1.0 (one-off product photo import)" },
  });
  if (!res.ok) throw new Error(`fetch failed for ${sourceUrl}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const blob = await put(pathname, buffer, { access: "public", contentType });
  return blob.url;
}

// Keeps the existing primary (sortOrder 0) image for a set, replaces
// everything else with the given secondary image.
async function setSecondary(slug: string, secondaryUrl: string) {
  const set = await prisma.productSet.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!set) return `MISSING SLUG: ${slug}`;

  const primary = set.images[0];
  await prisma.setMedia.deleteMany({ where: { setId: set.id } });

  let sortOrder = 0;
  if (primary) {
    await prisma.setMedia.create({
      data: { setId: set.id, type: "IMAGE", url: primary.url, sortOrder: sortOrder++ },
    });
  }
  await prisma.setMedia.create({
    data: { setId: set.id, type: "IMAGE", url: secondaryUrl, sortOrder: sortOrder++ },
  });
  return `${slug}: secondary replaced`;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const log: string[] = [];

  try {
    const baladyUrl = await uploadFromUrl(
      `sets/variety-refs/balady-${Date.now()}.jpg`,
      EXTERNAL_SOURCES.balady
    );
    const moroccanUrl = await uploadFromUrl(
      `sets/variety-refs/moroccan-extra-${Date.now()}.jpg`,
      EXTERNAL_SOURCES.moroccan
    );
    const pitomUrl = await uploadFromUrl(
      `sets/variety-refs/pitom-${Date.now()}.jpg`,
      EXTERNAL_SOURCES.pitom
    );
    log.push(`uploaded 3 external images: ${baladyUrl}, ${moroccanUrl}, ${pitomUrl}`);

    // Give roughly half of each variety's products the shared lulav-box
    // photo kept as-is (untouched below), and the other half a distinct new
    // photo — so the same secondary image no longer repeats across all 12
    // products.
    log.push(await setSecondary("regular-mehadrin", baladyUrl));
    log.push(await setSecondary("regular-diamond", baladyUrl));

    log.push(await setSecondary("temani-mehadrin", pitomUrl));
    log.push(await setSecondary("temani-diamond", pitomUrl));

    log.push(await setSecondary("moroccan-mehadrin", moroccanUrl));
    log.push(await setSecondary("moroccan-diamond", moroccanUrl));

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    return NextResponse.json(
      { ok: false, log, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
