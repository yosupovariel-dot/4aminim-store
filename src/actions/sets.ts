"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/dal";
import { revalidatePath } from "next/cache";
import type { HiddurLevel } from "@prisma/client";

const HIDDUR_VALUES: HiddurLevel[] = ["KOSHER", "MEHADRIN", "MEHADRIN_MIN_HAMEHADRIN", "DIAMOND"];

function revalidateCatalog(setId?: string) {
  revalidatePath("/admin/sets");
  revalidatePath("/");
  if (setId) revalidatePath(`/sets/[slug]`, "page");
}

export async function updateSet(setId: string, formData: FormData) {
  await verifyAdminSession();

  const name = String(formData.get("name") || "").trim();
  const etrogType = String(formData.get("etrogType") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceShekels = Number(formData.get("price"));
  const stockTotalRaw = formData.get("stockTotal");
  const active = formData.get("active") === "on";
  const hiddurLevelRaw = String(formData.get("hiddurLevel") || "");
  const hiddurLevel = HIDDUR_VALUES.includes(hiddurLevelRaw as HiddurLevel)
    ? (hiddurLevelRaw as HiddurLevel)
    : null;

  const stockTotal =
    stockTotalRaw === null || stockTotalRaw === ""
      ? null
      : Math.max(0, Math.trunc(Number(stockTotalRaw)));

  if (!name || !etrogType || !description) return;
  if (!Number.isFinite(priceShekels) || priceShekels <= 0) return;

  await prisma.productSet.update({
    where: { id: setId },
    data: {
      name,
      etrogType,
      description,
      hiddurLevel,
      price: Math.round(priceShekels * 100),
      stockTotal,
      active,
    },
  });

  revalidateCatalog(setId);
}

function slugify(input: string) {
  // Hebrew names don't survive ASCII slugification, so we keep only a plain
  // ASCII base (if any) and always append a random suffix for uniqueness.
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = randomUUID().slice(0, 6);
  return `${base ? `${base}-` : "special-"}${suffix}`;
}

export async function createSpecialSet(formData: FormData) {
  await verifyAdminSession();

  const name = String(formData.get("name") || "").trim();
  const etrogType = String(formData.get("etrogType") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceShekels = Number(formData.get("price"));
  const stockTotalRaw = formData.get("stockTotal");

  if (!name || !etrogType || !description) return;
  if (!Number.isFinite(priceShekels) || priceShekels <= 0) return;

  const stockTotal =
    stockTotalRaw === null || stockTotalRaw === ""
      ? 1
      : Math.max(0, Math.trunc(Number(stockTotalRaw)));

  const maxSort = await prisma.productSet.aggregate({
    where: { kind: "SPECIAL" },
    _max: { sortOrder: true },
  });

  await prisma.productSet.create({
    data: {
      kind: "SPECIAL",
      slug: slugify(name),
      name,
      etrogType,
      description,
      price: Math.round(priceShekels * 100),
      stockTotal,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      active: true,
    },
  });

  revalidateCatalog();
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadSetImage(setId: string, formData: FormData) {
  await verifyAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_IMAGE_BYTES) return;
  if (!ALLOWED_TYPES.has(file.type)) return;

  const ext = EXT_BY_TYPE[file.type] || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "sets", setId);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const existingCount = await prisma.setMedia.count({ where: { setId, type: "IMAGE" } });

  await prisma.setMedia.create({
    data: {
      setId,
      type: "IMAGE",
      url: `/uploads/sets/${setId}/${filename}`,
      sortOrder: existingCount,
    },
  });

  revalidateCatalog(setId);
}

export async function setPrimaryImage(setId: string, mediaId: string) {
  await verifyAdminSession();

  const images = await prisma.setMedia.findMany({
    where: { setId, type: "IMAGE" },
    orderBy: { sortOrder: "asc" },
  });

  const reordered = [
    ...images.filter((m) => m.id === mediaId),
    ...images.filter((m) => m.id !== mediaId),
  ];

  await prisma.$transaction(
    reordered.map((m, index) =>
      prisma.setMedia.update({ where: { id: m.id }, data: { sortOrder: index } })
    )
  );

  revalidateCatalog(setId);
}

export async function deleteSetImage(setId: string, mediaId: string) {
  await verifyAdminSession();

  const media = await prisma.setMedia.findUnique({ where: { id: mediaId } });
  if (!media || media.setId !== setId) return;

  await prisma.setMedia.delete({ where: { id: mediaId } });

  if (media.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", media.url);
    await unlink(filePath).catch(() => {
      // best-effort — a missing file on disk shouldn't block the deletion
    });
  }

  // Re-number remaining images so the lowest sortOrder is always 0 (primary).
  const remaining = await prisma.setMedia.findMany({
    where: { setId, type: "IMAGE" },
    orderBy: { sortOrder: "asc" },
  });
  await prisma.$transaction(
    remaining.map((m, index) =>
      prisma.setMedia.update({ where: { id: m.id }, data: { sortOrder: index } })
    )
  );

  revalidateCatalog(setId);
}
