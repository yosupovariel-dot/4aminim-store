import { prisma } from "@/lib/prisma";
import { CartPageClient } from "@/components/CartPageClient";

export default async function CartPage() {
  const addon = await prisma.productSet.findFirst({
    where: { kind: "ADDON", active: true },
    orderBy: { sortOrder: "asc" },
  });

  // Donation pricing mirrors the רגיל (default variety) price per hiddur
  // level — donations aren't tied to a specific set or its stock.
  const donationSets = await prisma.productSet.findMany({
    where: { kind: "REGULAR", etrogType: "רגיל", active: true },
    select: { hiddurLevel: true, price: true },
  });
  const hiddurPricing = Object.fromEntries(
    donationSets
      .filter((s) => s.hiddurLevel != null)
      .map((s) => [s.hiddurLevel as string, s.price])
  );

  return (
    <CartPageClient
      addon={
        addon
          ? {
              id: addon.id,
              slug: addon.slug,
              name: addon.name,
              etrogType: addon.etrogType,
              description: addon.description,
              price: addon.price,
            }
          : null
      }
      hiddurPricing={hiddurPricing}
    />
  );
}
