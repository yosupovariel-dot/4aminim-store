import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SetCard } from "@/components/SetCard";
import { RegularSetsBrowser } from "@/components/RegularSetsBrowser";
import { DELIVERY_NOTICE, SITE } from "@/lib/site-content";
import { HIDDUR_LABEL, HIDDUR_DESCRIPTION, HIDDUR_ORDER } from "@/lib/catalog";

export default async function HomePage() {
  const sets = await prisma.productSet.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  const regularSets = sets.filter((s) => s.kind === "REGULAR");
  const specialSets = sets.filter((s) => {
    if (s.kind !== "SPECIAL") return false;
    const remaining = s.stockTotal != null ? s.stockTotal - s.stockSold : null;
    // Once a special set sells out, it disappears from the site entirely
    // instead of showing a "sold out" badge.
    return remaining === null || remaining > 0;
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-100 via-emerald-50 to-transparent" />
        <div className="mx-auto max-w-5xl px-4 pt-14 pb-20 text-center sm:pt-20 sm:pb-28">
          <span className="mb-4 inline-block rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-emerald-700 shadow-sm">
            חג סוכות שמח 🌿
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950 sm:text-5xl">
            סטים לארבעת המינים
            <br className="hidden sm:block" /> באיכות מהודרת, עד הבית
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-emerald-800 sm:text-lg">
            סטים ברמות הידור שונות לבחירה, כולל אפשרויות אתרוג תימני ומרוקאי,
            וסטים מיוחדים במהדורה מוגבלת. הזמנה פשוטה באתר, ומשלוח אישי מתואם
            מראש לקראת החג.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#sets"
              className="rounded-full bg-emerald-600 px-7 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 transition-colors hover:bg-emerald-700"
            >
              לצפייה בסטים ולהזמנה
            </Link>
            <Link
              href="#delivery"
              className="rounded-full bg-white px-7 py-3 font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition-colors hover:bg-emerald-50"
            >
              פרטי משלוח
            </Link>
          </div>
        </div>
      </section>

      {/* Regular sets */}
      <section id="sets" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:py-14">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
            הסטים הרגילים שלנו
          </h2>
          <p className="mt-2 text-emerald-700">
            בחרו סוג אתרוג ואת רמת ההידור המתאימה לכם — בכמות בלתי מוגבלת.
          </p>
        </div>
        <RegularSetsBrowser
          sets={regularSets.map((set) => ({
            slug: set.slug,
            name: set.name,
            etrogType: set.etrogType,
            hiddurLevel: set.hiddurLevel,
            price: set.price,
            imageUrl: set.images[0]?.url || "/images/placeholder-set.svg",
            stockTotal: set.stockTotal,
            stockSold: set.stockSold,
          }))}
        />
      </section>

      {/* Hiddur levels explainer */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:pb-14">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-xl font-bold text-emerald-950 sm:text-2xl">
            מה ההבדל בין רמות ההידור?
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIDDUR_ORDER.map((level) => (
            <div
              key={level}
              className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <div className="text-sm font-bold text-emerald-800">{HIDDUR_LABEL[level]}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-emerald-700">
                {HIDDUR_DESCRIPTION[level]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Special sets */}
      {specialSets.length > 0 && (
        <section className="bg-gradient-to-b from-amber-50/70 to-transparent py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
                סטים מיוחדים — מהדורה מוגבלת
              </h2>
              <p className="mt-2 text-emerald-700">
                כמות מוגבלת מאוד. מומלץ להזמין מראש לפני גמר המלאי.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {specialSets.map((set) => {
                const remaining =
                  set.stockTotal != null
                    ? Math.max(set.stockTotal - set.stockSold, 0)
                    : null;
                const soldOut = remaining !== null && remaining <= 0;
                return (
                  <SetCard
                    key={set.id}
                    slug={set.slug}
                    name={set.name}
                    etrogType={set.etrogType}
                    price={set.price}
                    imageUrl={set.images[0]?.url || "/images/placeholder-set.svg"}
                    special
                    soldOut={soldOut}
                    remaining={remaining}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Delivery */}
      <section id="delivery" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-10 sm:py-14">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-emerald-950">פרטי משלוח</h2>
          <ul className="mt-4 space-y-2 text-emerald-800">
            <li className="flex gap-2">
              <span aria-hidden>🚚</span>
              <span>{DELIVERY_NOTICE.timing}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>📍</span>
              <span>{DELIVERY_NOTICE.areas}</span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-emerald-600">
            שאלות לגבי משלוח? אפשר לפנות ל{SITE.businessOwnerName} בוואטסאפ בכפתור הירוק
            בתחתית המסך.
          </p>
        </div>
      </section>
    </div>
  );
}
