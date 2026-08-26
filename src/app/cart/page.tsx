import { prisma } from "@/lib/prisma";
import { CartPageClient } from "@/components/CartPageClient";

export default async function CartPage() {
  const addon = await prisma.productSet.findFirst({
    where: { kind: "ADDON", active: true },
    orderBy: { sortOrder: "asc" },
  });

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
    />
  );
}
