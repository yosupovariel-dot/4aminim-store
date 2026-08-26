import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";
import { AddToCartControl } from "@/components/AddToCartControl";
import { isDefaultVariety } from "@/lib/catalog";

export default async function SetDetailPage({
  params,
}: PageProps<"/sets/[slug]">) {
  const { slug } = await params;

  const set = await prisma.productSet.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!set || !set.active) {
    notFound();
  }

  const remaining =
    set.stockTotal != null ? Math.max(set.stockTotal - set.stockSold, 0) : null;
  const soldOut = remaining !== null && remaining <= 0;

  // Sold-out special sets disappear from the site entirely rather than
  // showing a "sold out" page.
  if (set.kind === "SPECIAL" && soldOut) {
    notFound();
  }

  const media = set.images.length
    ? set.images
    : [{ id: "placeholder", type: "IMAGE" as const, url: "/images/placeholder-set.svg", sortOrder: 0, setId: set.id }];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-3">
            {media.map((m) =>
              m.type === "VIDEO" ? (
                <video
                  key={m.id}
                  src={m.url}
                  controls
                  className="w-full rounded-3xl border border-emerald-100 bg-black"
                />
              ) : (
                <div
                  key={m.id}
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50"
                >
                  <Image
                    src={m.url}
                    alt={`תמונה של ${set.name}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div>
          {set.kind === "SPECIAL" && (
            <span className="mb-3 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
              סט מיוחד — כמות מוגבלת
            </span>
          )}
          <h1 className="text-3xl font-extrabold text-emerald-950">{set.name}</h1>
          {!isDefaultVariety(set.etrogType) && (
            <p className="mt-2 text-emerald-700">סוג אתרוג: {set.etrogType}</p>
          )}
          <p className="mt-4 leading-relaxed text-emerald-900">{set.description}</p>

          <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            🎁 נרתיק במתנה
          </span>

          {typeof remaining === "number" && !soldOut && (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              נותרו {remaining} יחידות בלבד
            </p>
          )}

          <div className="mt-5">
            <span className="text-3xl font-extrabold text-emerald-800">
              {formatILS(set.price / 100)}
            </span>
            <span className="mr-2 text-sm font-medium text-emerald-600">
              — מחיר לסט המלא (לולב, הדס, ערבה ואתרוג)
            </span>
          </div>

          <div className="mt-8">
            <AddToCartControl
              set={{
                id: set.id,
                slug: set.slug,
                name: set.name,
                etrogType: set.etrogType,
                price: set.price,
                kind: set.kind,
              }}
              remaining={remaining}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
