import Link from "next/link";
import { SITE } from "@/lib/site-content";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-emerald-100 bg-emerald-50/60">
      <div className="mx-auto max-w-5xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm text-emerald-900">
        <div>
          <div className="font-semibold text-emerald-900 mb-2 text-base">
            {SITE.siteName}
          </div>
          <p className="text-emerald-700 leading-relaxed">
            סטים לארבעת המינים באיכות גבוהה, עם משלוח אישי לפני החג.
          </p>
        </div>

        <div>
          <div className="font-semibold mb-2">יצירת קשר</div>
          <ul className="space-y-1 text-emerald-700">
            <li>{SITE.businessOwnerName}</li>
            <li>
              <a href={SITE.phoneHref} className="hover:text-emerald-900">
                {SITE.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-2">מידע נוסף</div>
          <ul className="space-y-1 text-emerald-700">
            <li>
              <Link href="/terms" className="hover:text-emerald-900">
                תקנון האתר
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-emerald-900">
                מדיניות פרטיות
              </Link>
            </li>
            <li>
              <Link href="/accessibility" className="hover:text-emerald-900">
                הצהרת נגישות
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-emerald-900">
                כניסת מנהל
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-emerald-100 py-4 text-center text-xs text-emerald-600">
        © {new Date().getFullYear()} {SITE.siteName}. כל הזכויות שמורות.
        {" · "}
        <span>
          האתר נבנה על ידי{" "}
          <a
            href="https://arielyosupov-webdesign.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-emerald-900"
          >
            Ariel Yosupov
          </a>
        </span>
      </div>
    </footer>
  );
}
