import "server-only";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/pricing";

const SHEET_NAME = "הזמנות";
// One row per order ITEM (an order with 3 different sets becomes 3 rows
// sharing the same order number) — easiest to filter/pivot in a sheet.
const HEADER = [
  "מס' הזמנה",
  "תאריך",
  "לקוח",
  "טלפון",
  "סט",
  "סוג אתרוג",
  "כמות",
  "מחיר ליחידה",
  "סה\"כ לפריט",
  "מחיר כולל להזמנה",
  "מקדמה נדרשת",
  "לקוח סימן תשלום",
  "מקדמה אושרה",
  "סטטוס הזמנה",
  "שכונה",
  "כתובת",
  "הערות לקוח",
  "הערות מנהל",
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתינה",
  CONFIRMED: "אושרה",
  CANCELLED: "בוטלה",
  COMPLETED: "הושלמה",
};

export function isGoogleSheetsConfigured() {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // .env stores literal "\n" sequences; convert back to real newlines.
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// A brand-new spreadsheet only has a default "Sheet1" tab — create the
// "הזמנות" tab on first use instead of requiring the owner to rename it.
async function ensureOrdersTabExists(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === SHEET_NAME);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
    },
  });
}

// Best-effort, full-table resync: rewrites the whole "הזמנות" sheet from the
// current DB state on every order create/update. Simpler and less
// error-prone than incremental row patching, and cheap at this store's
// order volume. Never throws — a Sheets outage must not block a checkout
// or an admin action.
export async function resyncOrdersSheet() {
  if (!isGoogleSheetsConfigured()) return;

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    const sheets = getSheetsClient();
    await ensureOrdersTabExists(sheets, spreadsheetId);

    const orders = await prisma.order.findMany({
      orderBy: { orderNumber: "asc" },
      include: { items: true },
    });

    const rows = orders.flatMap((o) =>
      o.items.map((item) => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleString("he-IL"),
        o.customerName,
        o.phone,
        item.setNameSnapshot,
        item.etrogTypeSnapshot,
        item.quantity,
        formatILS(item.unitPrice / 100),
        formatILS((item.unitPrice * item.quantity) / 100),
        formatILS(o.totalPrice / 100),
        formatILS(o.depositAmount / 100),
        o.depositMarkedPaid ? "כן" : "לא",
        o.depositConfirmed ? "כן" : "לא",
        STATUS_LABEL[o.status] || o.status,
        o.neighborhood,
        o.address,
        o.notes || "",
        o.adminNotes || "",
      ])
    );

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER] },
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:R100000`,
    });

    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }
  } catch (err) {
    console.error("Google Sheets sync failed:", err);
  }
}
