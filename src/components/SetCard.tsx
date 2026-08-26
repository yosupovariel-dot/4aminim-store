import Image from "next/image";
import Link from "next/link";
import { formatILS } from "@/lib/pricing";
import { isDefaultVariety } from "@/lib/catalog";

type SetCardProps = {
  slug: string;
  name: string;
  etrogType: string;
  price: number;
  imageUrl: string;
  special?: boolean;
  soldOut?: boolean;
  remaining?: number | null;
};

export function SetCard({
  slug,
  name,
  etrogType,
  price,
  imageUrl,
  special,
  soldOut,
  remaining,
}: SetCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
      {special && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow">
          סט מיוחד — כמות מוגבלת
        </span>
      )}
      {soldOut && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold text-white shadow">
          אזל המלאי
        </span>
      )}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-emerald-50">
        <Image
          src={imageUrl}
          alt={`תמונה של ${name}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-bold text-emerald-950">{name}</h3>
        {!isDefaultVariety(etrogType) && (
          <p className="text-sm text-emerald-700">סוג אתרוג: {etrogType}</p>
        )}
        {typeof remaining === "number" && remaining >= 0 && !soldOut && (
          <p className="text-xs font-medium text-amber-700">
            נותרו {remaining} יחידות בלבד
          </p>
        )}
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          🎁 נרתיק במתנה
        </span>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span>
            <span className="text-xl font-extrabold text-emerald-800">
              {formatILS(price / 100)}
            </span>
            <span className="block text-[11px] font-medium text-emerald-600">לסט המלא</span>
          </span>
          {soldOut ? (
            <span className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-400">
              אזל המלאי
            </span>
          ) : (
            <Link
              href={`/sets/${slug}`}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              לפרטים והזמנה
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
