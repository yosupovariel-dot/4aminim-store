import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  updateSet,
  createSpecialSet,
  uploadSetImage,
  setPrimaryImage,
  deleteSetImage,
} from "@/actions/sets";
import { HIDDUR_LABEL, HIDDUR_ORDER } from "@/lib/catalog";

export default async function AdminSetsPage() {
  const sets = await prisma.productSet.findMany({
    where: { active: true },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  const regularSets = sets.filter((s) => s.kind === "REGULAR");
  const specialSets = sets.filter((s) => s.kind === "SPECIAL");
  const addonSets = sets.filter((s) => s.kind === "ADDON");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">ניהול סטים</h1>
        <p className="mt-1 text-sm text-emerald-600">
          עריכת שם, סוג אתרוג, רמת הידור, תיאור, מחיר, מלאי, זמינות ותמונות לכל
          סט. סטים שהוסתרו (לא פעילים) לא מוצגים כאן — ניתן להפעילם מחדש דרך
          מסד הנתונים בשלב זה.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-emerald-950">סטים רגילים</h2>
        <div className="grid gap-4">
          {regularSets.map((set) => (
            <SetEditorCard key={set.id} set={set} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-emerald-950">סטים מיוחדים</h2>
        <div className="grid gap-4">
          {specialSets.map((set) => (
            <SetEditorCard key={set.id} set={set} />
          ))}
          {specialSets.length === 0 && (
            <p className="text-sm text-emerald-500">אין כרגע סטים מיוחדים פעילים.</p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-5">
          <h3 className="mb-1 font-bold text-emerald-900">הוספת סט מיוחד חדש</h3>
          <p className="mb-3 text-xs text-emerald-600">
            כל סט מיוחד הוא פריט ייחודי אחד ויחיד עם אתרוג ספציפי — לא כמות. ברגע
            שהוא נמכר, הוא יורד אוטומטית מהתצוגה באתר.
          </p>
          <form action={createSpecialSet} className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-emerald-700">שם הסט</span>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-emerald-200 px-3 py-1.5"
                placeholder='למשל: "סט מיוחד — אתרוג קלברי"'
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-emerald-700">סוג אתרוג</span>
              <input
                name="etrogType"
                required
                className="w-full rounded-lg border border-emerald-200 px-3 py-1.5"
                placeholder="למשל: אתרוג קלברי נדיר"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-emerald-700">תיאור</span>
              <textarea
                name="description"
                required
                rows={2}
                className="w-full rounded-lg border border-emerald-200 px-3 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-emerald-700">מחיר (₪)</span>
              <input
                type="number"
                name="price"
                min={1}
                step="1"
                required
                className="w-full rounded-lg border border-emerald-200 px-3 py-1.5"
              />
            </label>
            <div className="flex items-end sm:col-span-2">
              <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                יצירת הסט
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-emerald-950">תוספות (Add-ons)</h2>
        <p className="mb-3 text-sm text-emerald-600">
          פריטים אופציונליים המוצעים בסל הקניות, כמו ערבות ספייר להחלפה.
        </p>
        <div className="grid gap-4">
          {addonSets.map((set) => (
            <SetEditorCard key={set.id} set={set} />
          ))}
          {addonSets.length === 0 && (
            <p className="text-sm text-emerald-500">אין כרגע תוספות פעילות.</p>
          )}
        </div>
      </section>
    </div>
  );
}

type SetWithImages = Awaited<ReturnType<typeof prisma.productSet.findMany>>[number] & {
  images: { id: string; url: string; type: string; sortOrder: number }[];
};

function SetEditorCard({ set }: { set: SetWithImages }) {
  const updateAction = updateSet.bind(null, set.id);
  const uploadAction = uploadSetImage.bind(null, set.id);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-emerald-500">
          {set.kind === "SPECIAL" ? "סט מיוחד" : set.kind === "ADDON" ? "תוספת" : "סט רגיל"} · slug:{" "}
          {set.slug} · נמכרו: {set.stockSold}
        </div>
        {set.kind === "SPECIAL" ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              set.stockSold > 0 ? "bg-neutral-200 text-neutral-600" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {set.stockSold > 0 ? "נמכר — מוסתר באתר" : "זמין באתר"}
          </span>
        ) : (
          set.stockTotal != null && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                set.stockTotal - set.stockSold <= 0
                  ? "bg-neutral-200 text-neutral-600"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              נותרו למכירה: {Math.max(set.stockTotal - set.stockSold, 0)} מתוך {set.stockTotal}
            </span>
          )
        )}
      </div>

      {/* Images */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold text-emerald-700">תמונות</div>
        <div className="flex flex-wrap gap-3">
          {set.images.map((img, index) => (
            <div key={img.id} className="relative">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
                <Image src={img.url} alt="" fill className="object-cover" />
              </div>
              {index === 0 && (
                <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 shadow">
                  ראשית
                </span>
              )}
              <div className="mt-1 flex gap-1">
                {index !== 0 && (
                  <form action={setPrimaryImage.bind(null, set.id, img.id)}>
                    <button
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                      title="הפוך לתמונה ראשית"
                    >
                      הפוך לראשית
                    </button>
                  </form>
                )}
                <form action={deleteSetImage.bind(null, set.id, img.id)}>
                  <button
                    className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-100"
                    title="מחיקת תמונה"
                  >
                    מחיקה
                  </button>
                </form>
              </div>
            </div>
          ))}

          <form
            action={uploadAction}
            className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-2 text-center"
          >
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              required
              className="w-full text-[10px]"
            />
            <button className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700">
              העלאה
            </button>
          </form>
        </div>
      </div>

      {/* Fields */}
      <form action={updateAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">שם</span>
          <input
            name="name"
            defaultValue={set.name}
            required
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">סוג אתרוג</span>
          <input
            name="etrogType"
            defaultValue={set.etrogType}
            required
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        {set.kind === "REGULAR" && (
          <label className="text-sm">
            <span className="mb-1 block text-emerald-700">רמת הידור</span>
            <select
              name="hiddurLevel"
              defaultValue={set.hiddurLevel ?? ""}
              className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
            >
              <option value="">—</option>
              {HIDDUR_ORDER.map((level) => (
                <option key={level} value={level}>
                  {HIDDUR_LABEL[level]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="text-sm">
          <span className="mb-1 block text-emerald-700">מחיר (₪)</span>
          <input
            type="number"
            name="price"
            min={1}
            step="1"
            defaultValue={set.price / 100}
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        {set.kind === "SPECIAL" ? (
          <input type="hidden" name="stockTotal" value={1} />
        ) : (
          <label className="text-sm">
            <span className="mb-1 block text-emerald-700">מלאי כולל</span>
            <input
              type="number"
              name="stockTotal"
              min={0}
              step="1"
              defaultValue={set.stockTotal ?? ""}
              placeholder="ריק = ללא הגבלה"
              className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
            />
          </label>
        )}

        <label className="text-sm sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-emerald-700">תיאור</span>
          <textarea
            name="description"
            defaultValue={set.description}
            rows={2}
            required
            className="w-full rounded-lg border border-emerald-200 px-2 py-1.5"
          />
        </label>

        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm text-emerald-700">
            <input type="checkbox" name="active" defaultChecked={set.active} className="h-4 w-4 accent-emerald-600" />
            פעיל
          </label>
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            שמירה
          </button>
        </div>
      </form>
    </div>
  );
}
