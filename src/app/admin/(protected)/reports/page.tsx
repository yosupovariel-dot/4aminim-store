import { buildProcurementReport } from "@/lib/procurementReport";

export default async function AdminReportsPage() {
  const report = await buildProcurementReport();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950">דוח רכש וכמויות</h1>
          <p className="mt-1 text-sm text-emerald-600">
            כמה מכל דבר צריך להכין, לפי הזמנות שאינן מבוטלות (כולל סטים מיוחדים ותוספות).
          </p>
        </div>
        <a
          href="/admin/reports/export"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          הורדת דוח (CSV)
        </a>
      </div>

      {/* Universal components */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-bold text-emerald-950">רכיבים משותפים לכל הסטים</h2>
        <p className="mb-4 text-xs text-emerald-500">
          לולבים, ערבות ונרתיקים זהים לכל הסטים — לא תלוי בסוג או ברמת ההידור.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatBox label="לולבים" value={report.universal.lulav} />
          <StatBox
            label="ערבות (כולל ספייר)"
            value={report.universal.arava}
            hint={
              report.addons.length > 0
                ? `מתוכן ${report.addons.reduce((s, a) => s + a.quantity, 0)} יח' ספייר`
                : undefined
            }
          />
          <StatBox label="נרתיקים" value={report.universal.caseCount} />
        </div>
      </section>

      {/* Hadassim by level */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-bold text-emerald-950">הדסים — לפי רמת הידור</h2>
        <p className="mb-4 text-xs text-emerald-500">
          איכות ההדס נקבעת לפי רמת ההידור, לא לפי סוג האתרוג. מהדרין מן
          המהדרין, יהלום וסטים מיוחדים משתמשים כולם באותו הידור הדס עליון.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {report.hadassimByLevel.map((row) => (
            <StatBox key={row.label} label={row.label} value={row.quantity} />
          ))}
        </div>
      </section>

      {/* Etrogim */}
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-bold text-emerald-950">אתרוגים — לפי סוג ורמה</h2>
        <p className="mb-4 text-xs text-emerald-500">
          לכל אתרוג יש סוג (רגיל / תימני / מרוקאי) ורמת הידור משלו — לכן מפורט לכל סט בנפרד.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-emerald-50 text-emerald-800">
              <tr>
                <th className="px-3 py-2 text-right font-semibold">סוג אתרוג</th>
                <th className="px-3 py-2 text-right font-semibold">רמת הידור</th>
                <th className="px-3 py-2 text-right font-semibold">כמות נדרשת</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {report.etrogimRegular.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-emerald-950">{row.variety}</td>
                  <td className="px-3 py-2 text-emerald-950">{row.label}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-900">{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report.etrogimSpecial.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold text-emerald-800">אתרוגים לסטים מיוחדים</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-amber-50 text-amber-900">
                  <tr>
                    <th className="px-3 py-2 text-right font-semibold">סט</th>
                    <th className="px-3 py-2 text-right font-semibold">אתרוג</th>
                    <th className="px-3 py-2 text-right font-semibold">כמות נדרשת</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {report.etrogimSpecial.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-emerald-950">{row.name}</td>
                      <td className="px-3 py-2 text-emerald-950">{row.etrogType}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-900">{row.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatBox({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl bg-emerald-50 p-4">
      <div className="text-xs text-emerald-600">{label}</div>
      <div className="text-2xl font-extrabold text-emerald-950">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-emerald-500">{hint}</div>}
    </div>
  );
}
