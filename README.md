# ארבעת המינים לסוכות — אתר הזמנות

אתר להזמנת סטים לארבעת המינים (רגילים + מהדורה מוגבלת), עם תהליך הזמנה
ותשלום מקדמה (20%) בביט, ומערכת ניהול הזמנות למנהל.

נבנה עם Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Prisma.

## הרצה מקומית

בסיס הנתונים הוא Postgres מנוהל (Neon, מחובר דרך Vercel) — אותו בסיס נתונים
משמש גם לפיתוח מקומי וגם לפרודקשן. אין יותר SQLite בפרויקט הזה.

```bash
npm install
cp .env.example .env   # ומלאו DATABASE_URL / DATABASE_URL_UNPOOLED מ-Vercel
npx prisma migrate deploy   # מריץ את סכימת בסיס הנתונים מול Postgres
npm run seed                 # קטלוג לדוגמה + משתמש מנהל
npm run dev
```

**איך להשיג את משתני החיבור**: ב-Vercel Dashboard → הפרויקט → Storage →
בסיס הנתונים → לשונית `.env.local` (או Quickstart) → העתיקו את הערכים
`DATABASE_URL` ו-`DATABASE_URL_UNPOOLED`.

האתר יעלה בכתובת http://localhost:3000. כניסת מנהל: http://localhost:3000/admin/login —
כניסה בסיסמה בלבד (ללא שם משתמש), לפי הערך שמוגדר ב-`.env` תחת `ADMIN_PASSWORD`.

> **הערה למחשבים עם IPv6 לא תקין**: אם `prisma migrate`/`npm run dev`
> נכשלים עם `P1001: Can't reach database server` למרות שהחיבור לאינטרנט
> תקין, ייתכן שהרשת שלכם "מפרסמת" כתובות IPv6 בלי ניתוב אמיתי, ו-Prisma
> מנסה להתחבר דרכן במקום IPv4. פתרון (דורש הרשאת מנהל, הפיך):
> ```powershell
> Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters" -Name "DisabledComponents" -Value 0x20 -Type DWord
> Restart-Computer
> ```

## משתני סביבה (`.env`)

| משתנה | תיאור |
|---|---|
| `DATABASE_URL` | חיבור Postgres מאוגם (pooled) — משמש את האתר בזמן ריצה. |
| `DATABASE_URL_UNPOOLED` | חיבור Postgres ישיר (ללא pooler) — נדרש להרצת migrations. |
| `SESSION_SECRET` | מפתח לחתימת session מנהל. **חובה להחליף** לערך אקראי לפני העלאה לאוויר (`openssl rand -base64 32`). |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | משמשים ל-seed של משתמש המנהל. הכניסה בפועל היא בסיסמה בלבד — `ADMIN_USERNAME` הוא מזהה פנימי בלבד ואינו מוזן בטופס ההתחברות. שינוי `ADMIN_PASSWORD` ב-`.env` דורש הרצה חוזרת של `npm run seed` כדי שהסיסמה תתעדכן בפועל. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | מזהה Google Analytics (G-XXXXXXX). ריק = לא נטען GA כלל. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | מספר הוואטסאפ לכפתור הצף, בפורמט בינלאומי ללא +. |

## פריטים שהם Placeholder — יש להשלים לפני עלייה לאוויר

- **קטלוג הסטים**: שמות, סוגי אתרוג, מחירים ותיאורים ב-`prisma/seed.ts` הם
  לדוגמה בלבד. יש לעדכן שם ולהריץ `npm run seed` מחדש (או לערוך ישירות
  דרך עמוד `/admin/sets` לאחר ההרצה).
- **תמונות/סרטונים**: כרגע כל הסטים משתמשים בתמונת placeholder
  (`public/images/placeholder-set.svg`). יש להוסיף קבצי מדיה אמיתיים
  ולקשר אותם דרך טבלת `SetMedia` (כרגע נעשה בקוד/seed — ניהול תוכן מלא
  לא נבנה ב-MVP הזה).
- **מספר הביט לתשלום**: העמוד מפנה את הלקוח לקבל את מספר הביט בהודעת
  הוואטסאפ / בעמוד יצירת קשר. יש לוודא שהמספר בפועל (`SITE.phoneDisplay`
  ב-`src/lib/site-content.ts`) הוא המספר הנכון לביט.
- **אחוז/תנאי ביטול הזמנה**: הטקסט ב-`src/lib/site-content.ts`
  (`CANCELLATION_POLICY_TEXT`) הוא ניסוח לדוגמה בלבד — יש לאשר עם בעל
  העסק את האחוזים והתנאים המדויקים לפני העלאה לאוויר.
- **הודעות WhatsApp אוטומטיות**: בשלב זה שליחת הודעת אישור ללקוח נעשית
  ידנית — כפתור בעמוד ההזמנה במערכת הניהול פותח וואטסאפ עם טקסט מוכן
  מראש, שהמנהל שולח בלחיצה. שילוב API אוטומטי (למשל Twilio) אפשרי בהמשך.

## סנכרון ל-Google Sheets (אופציונלי)

מערכת הניהול יכולה לשמור עותק חי של כל ההזמנות בגיליון Google Sheets —
מתעדכן אוטומטית בכל הזמנה חדשה, אישור מקדמה, שינוי סטטוס וכו'. כברירת
מחדל זה כבוי (משתני הסביבה ריקים); כשלא מוגדר, שום דבר לא נשבר — פשוט
אין סנכרון.

**איך להפעיל (חד-פעמי, דורש חשבון Google):**

1. היכנסו ל-[Google Cloud Console](https://console.cloud.google.com/),
   צרו פרויקט חדש (או השתמשו בקיים).
2. הפעילו את ה-API: **Google Sheets API** (תפריט APIs & Services → Enable
   APIs → חיפוש "Google Sheets API" → Enable).
3. צרו **Service Account**: APIs & Services → Credentials → Create
   Credentials → Service Account. תנו לו שם (למשל `arba-minim-sync`).
4. בתוך ה-Service Account שנוצר → לשונית Keys → Add Key → Create new key
   → סוג **JSON**. יורד קובץ JSON — שם יש `client_email` ו-`private_key`.
5. צרו גיליון Google Sheets חדש (ריק), ושתפו אותו (כפתור Share) עם
   כתובת המייל מתוך `client_email` (משהו כמו
   `arba-minim-sync@your-project.iam.gserviceaccount.com`), עם הרשאת
   **עריכה (Editor)**.
6. העתיקו את מזהה הגיליון מתוך כתובת ה-URL שלו (החלק בין `/d/` ל-`/edit`).
7. מלאו ב-`.env` (או במשתני הסביבה ב-Vercel):
   ```bash
   GOOGLE_SHEETS_SPREADSHEET_ID="המזהה מהשלב 6"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="client_email מהקובץ JSON"
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="private_key מהקובץ JSON (עם ה-\n בפנים, במרכאות)"
   ```
8. הפעילו מחדש את השרת. בעמוד `/admin/orders` יופיע פס ירוק "סנכרון
   פעיל" במקום הפס הכתום, ויש גם כפתור "סנכרון ידני עכשיו".

הגיליון נכתב מחדש במלואו (לשונית בשם "הזמנות") בכל שינוי בהזמנה — כך
שהוא תמיד משקף בדיוק את מה שיש במערכת, ללא סיכון לשורות כפולות.

## פריסה לפרודקשן (Vercel)

הריפו מחובר ל-Vercel, ובסיס הנתונים (Postgres דרך Neon) כבר מחובר גם הוא —
`DATABASE_URL` ו-`DATABASE_URL_UNPOOLED` מוזרקים אוטומטית על ידי אינטגרציית
Neon של Vercel. פקודת ה-build (`npm run build`) מריצה אוטומטית
`prisma migrate deploy` לפני הבנייה, כך שסכימת בסיס הנתונים מתעדכנת בכל
דיפלוי.

צעדים שנותרו בצד Vercel (חד-פעמי):

1. הגדירו בפרויקט ב-Vercel: `SESSION_SECRET` (ערך אקראי וסודי —
   `openssl rand -base64 32`), `ADMIN_USERNAME`/`ADMIN_PASSWORD` (לצורך
   ה-seed הראשוני), `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, ואופציונלית משתני Google Sheets.
2. לאחר הדיפלוי הראשון, הריצו seed חד-פעמי מול בסיס הפרודקשן (למשל
   `DATABASE_URL="..." DATABASE_URL_UNPOOLED="..." npm run seed` עם הערכים
   של הפרודקשן), ואז **שנו את סיסמת המנהל** דרך `.env`+seed מחדש.

## אבטחה — מה כבר קיים

- סיסמת מנהל מוצפנת (bcrypt), session חתום (JWT/HttpOnly cookie),
  נעילת חשבון זמנית אחרי 5 ניסיונות כניסה כושלים.
- עמודי `/admin/*` מוגנים גם ב-Proxy (בדיקה אופטימית) וגם בכל עמוד/פעולת
  שרת בנפרד (הבדיקה האמיתית) — כך שאין נתיב שמדלג על ההרשאה.
- כל טופס מאומת בצד שרת (Zod) לפני כתיבה לבסיס הנתונים.
- לקוחות אינם רואים הזמנות של לקוחות אחרים — אין באתר הציבורי שום עמוד
  שמציג רשימת הזמנות; רק מסך "תודה" אישי לאחר שליחה.
- כותרות אבטחה בסיסיות (`X-Frame-Options`, `X-Content-Type-Options`
  וכו') מוגדרות ב-`next.config.ts`.

**מומלץ לפני עלייה לאוויר**: להריץ סקירת אבטחה נוספת (`/security-review`
בקוד הזה, או סקירה ידנית), ולוודא HTTPS בכל סביבת הפרודקשן.
