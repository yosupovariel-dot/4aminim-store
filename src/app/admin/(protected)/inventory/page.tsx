import { prisma } from "@/lib/prisma";
import { updateStockBrought } from "@/actions/sets";
import { HIDDUR_LABEL, VARIETY_ORDER } from "@/lib/catalog";

export default async function AdminInventoryPage() {
  const sets = await prisma.productSet.findMany({
    where: { kind: "REGULAR", active: true },
    orderBy: [{ etrogType: "asc" }, { sortOrder: "asc" }],
  });

  const varieties = VARIETY_ORDER.filter((v) => sets.some((s) => s.etrogType === v));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-emerald-950">מלאי — כמה סטים הבאתי</h1>
        <p className="mt-1 text-sm text-emerald-600">
          לכל סט רגיל, הזינו כמה יחידות הבאתם השנה. המערכת תציג כמה נמכרו וכמה
          נשאר למכור, ותגביל אוטומטית הזמנות נוספות ברגע שהמלאי אוזל. השאירו
          ריק כדי להשאיר ללא הגבלת כמות. (סטים עם אתרוגים מיוחדים אינם כאן —
          כל אחד מהם הוא פריט ייחודי אחד, ומנוהל בעמוד &quot;ניהול סטים&quot;.)
        </p>
      </div>

      {varieties.map((variety) => (
        <section key={variety}>
          <h2 className="mb-3 text-lg font-bold text-emerald-950">
            {variety === "רגיל" ? "הסטים הרגילים" : `אתרוג ${variety}`}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">סט</th>
                  <th className="px-4 py-3 text-right font-semibold">נמכרו</th>
                  <th className="px-4 py-3 text-right font-semibold">כמות שהבאתי</th>
                  <th className="px-4 py-3 text-right font-semibold">נשאר למכור</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {sets
                  .filter((s) => s.etrogType === variety)
                  .map((set) => {
                    const remaining = set.stockTotal != null ? Math.max(set.stockTotal - set.stockSold, 0) : null;
                    return (
                      <tr key={set.id}>
                        <td className="px-4 py-3 font-medium text-emerald-950">
                          {set.hiddurLevel ? HIDDUR_LABEL[set.hiddurLevel] : set.name}
                        </td>
                        <td className="px-4 py-3 text-emerald-700">{set.stockSold}</td>
                        <td className="px-4 py-3">
                          <form
                            action={updateStockBrought.bind(null, set.id)}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="number"
                              name="stockTotal"
                              min={0}
                              step="1"
                              defaultValue={set.stockTotal ?? ""}
                              placeholder="ללא הגבלה"
                              className="w-24 rounded-lg border border-emerald-200 px-2 py-1"
                            />
                            <button className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                              שמירה
                            </button>
                          </form>
                        </td>
                        <td className="px-4 py-3">
                          {remaining === null ? (
                            <span className="text-emerald-500">ללא הגבלה</span>
                          ) : (
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                remaining <= 0 ? "bg-neutral-200 text-neutral-600" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {remaining}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
