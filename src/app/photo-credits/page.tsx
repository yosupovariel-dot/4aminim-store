import type { Metadata } from "next";
import { SITE } from "@/lib/site-content";
import { PHOTO_CREDITS } from "@/lib/photo-credits";

export const metadata: Metadata = { title: "קרדיטים לתמונות | " + SITE.siteName };

export default function PhotoCreditsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-extrabold text-emerald-950 mb-4">קרדיטים לתמונות</h1>
      <p className="mb-8 leading-relaxed text-emerald-800">
        חלק מהתמונות באתר הן תמונות אמיתיות שצילמנו בעצמנו. חלק אחר נלקח מתוך
        Wikimedia Commons, תחת רישיונות פתוחים המתירים שימוש חופשי (לרבות
        מסחרי). להלן פירוט המקור והרישיון של כל תמונה כזו.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-emerald-50 text-emerald-800">
            <tr>
              <th className="px-4 py-3 text-right font-semibold">התמונה</th>
              <th className="px-4 py-3 text-right font-semibold">צלם/ת</th>
              <th className="px-4 py-3 text-right font-semibold">רישיון</th>
              <th className="px-4 py-3 text-right font-semibold">מקור</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {PHOTO_CREDITS.map((c) => (
              <tr key={c.sourceUrl}>
                <td className="px-4 py-3">{c.subject}</td>
                <td className="px-4 py-3 text-emerald-600">{c.photographer || "—"}</td>
                <td className="px-4 py-3 text-emerald-600">{c.license}</td>
                <td className="px-4 py-3">
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline hover:text-emerald-900"
                  >
                    Wikimedia Commons
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
