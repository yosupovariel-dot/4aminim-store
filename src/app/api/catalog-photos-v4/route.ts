import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// TEMPORARY one-off route:
// 1. Replaces the primary photo on 6 of the 12 regular products (3 רגיל +
//    3 תימני levels that still shared one photo across all 4 tiers) with
//    distinct real, verified-license photos, keeping each product's
//    existing secondary photo untouched.
// 2. Adds a second photo to the kids set.
// 3. Updates the kids set price to ₪50.
// Gated by a secret query param. Delete this file (and redeploy)
// immediately after one use.
const SECRET = "c6e9b3f0a7d4182e6c9b3f7a0d5e8c2b6f9a3d7e1c4b8f2a6d0e3c7b1f5a9d3e";

const UA = { "User-Agent": "4aminim-store-catalog-import/1.0 (one-off product photo import)" };

const NEW_PRIMARIES: Record<string, string> = {
  "regular-mehadrin": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Naxos_citron.jpg",
  "regular-mehadrin-min-hamehadrin":
    "https://upload.wikimedia.org/wikipedia/commons/9/99/Citrus_medica_fruit.jpg",
  "regular-diamond": "https://upload.wikimedia.org/wikipedia/commons/c/c4/Cedro_%28CItrus_medica%29.jpg",
  "temani-mehadrin": "https://upload.wikimedia.org/wikipedia/commons/b/bf/MoroccanWSeeds.jpg",
  "temani-mehadrin-min-hamehadrin":
    "https://upload.wikimedia.org/wikipedia/commons/7/73/Citron_%28819330933%29.jpg",
  "temani-diamond": "https://upload.wikimedia.org/wikipedia/commons/4/49/Etrog_with_Pitom.jpg",
};

const KIDS_SECOND_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/f/fd/Pushka2.JPG";

async function uploadFromUrl(pathname: string, sourceUrl: string) {
  const res = await fetch(sourceUrl, { headers: UA });
  if (!res.ok) throw new Error(`fetch failed for ${sourceUrl}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const blob = await put(pathname, buffer, { access: "public", contentType });
  return blob.url;
}

async function replacePrimary(slug: string, newUrl: string) {
  const set = await prisma.productSet.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!set) return `MISSING SLUG: ${slug}`;

  const secondary = set.images[1];
  await prisma.setMedia.deleteMany({ where: { setId: set.id } });

  await prisma.setMedia.create({
    data: { setId: set.id, type: "IMAGE", url: newUrl, sortOrder: 0 },
  });
  if (secondary) {
    await prisma.setMedia.create({
      data: { setId: set.id, type: "IMAGE", url: secondary.url, sortOrder: 1 },
    });
  }
  return `${slug}: primary replaced`;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const log: string[] = [];

  for (const [slug, sourceUrl] of Object.entries(NEW_PRIMARIES)) {
    try {
      const uploaded = await uploadFromUrl(`sets/variety-refs/${slug}-${Date.now()}.jpg`, sourceUrl);
      log.push(await replacePrimary(slug, uploaded));
    } catch (err) {
      log.push(`FAILED ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    const kidsUrl = await uploadFromUrl(`sets/variety-refs/kids-2nd-${Date.now()}.jpg`, KIDS_SECOND_IMAGE);
    const kids = await prisma.productSet.findUnique({ where: { slug: "kids-set" } });
    if (kids) {
      const count = await prisma.setMedia.count({ where: { setId: kids.id } });
      await prisma.setMedia.create({
        data: { setId: kids.id, type: "IMAGE", url: kidsUrl, sortOrder: count },
      });
      log.push("kids-set: 2nd image added");
    } else {
      log.push("MISSING SLUG: kids-set");
    }
  } catch (err) {
    log.push(`FAILED kids-set image: ${err instanceof Error ? err.message : String(err)}`);
  }

  await prisma.productSet.updateMany({ where: { slug: "kids-set" }, data: { price: 5000 } });
  log.push("kids-set: price set to 5000 agorot (₪50)");

  return NextResponse.json({ ok: true, log });
}
