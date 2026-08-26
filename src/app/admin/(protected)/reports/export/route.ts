import { verifyAdminSession } from "@/lib/dal";
import { buildProcurementReport } from "@/lib/procurementReport";

function csvCell(value: string | number) {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function csvRow(cells: (string | number)[]) {
  return cells.map(csvCell).join(",") + "\r\n";
}

export async function GET() {
  await verifyAdminSession();

  const report = await buildProcurementReport();
  let csv = "﻿"; // BOM so Excel opens Hebrew UTF-8 correctly

  csv += csvRow(["דוח רכש - ארבעת המינים"]);
  csv += csvRow([]);

  csv += csvRow(["רכיבים משותפים"]);
  csv += csvRow(["פריט", "כמות"]);
  csv += csvRow(["לולבים", report.universal.lulav]);
  csv += csvRow(["ערבות (כולל ספייר)", report.universal.arava]);
  csv += csvRow(["נרתיקים", report.universal.caseCount]);
  csv += csvRow([]);

  csv += csvRow(["הדסים לפי רמת הידור"]);
  csv += csvRow(["רמת הידור", "כמות"]);
  for (const row of report.hadassimByLevel) {
    csv += csvRow([row.label, row.quantity]);
  }
  csv += csvRow([]);

  csv += csvRow(["אתרוגים - סטים רגילים"]);
  csv += csvRow(["סוג אתרוג", "רמת הידור", "כמות"]);
  for (const row of report.etrogimRegular) {
    csv += csvRow([row.variety, row.label, row.quantity]);
  }
  csv += csvRow([]);

  if (report.etrogimSpecial.length > 0) {
    csv += csvRow(["אתרוגים - סטים מיוחדים"]);
    csv += csvRow(["סט", "אתרוג", "כמות"]);
    for (const row of report.etrogimSpecial) {
      csv += csvRow([row.name, row.etrogType, row.quantity]);
    }
    csv += csvRow([]);
  }

  if (report.addons.length > 0) {
    csv += csvRow(["תוספות"]);
    csv += csvRow(["פריט", "כמות"]);
    for (const row of report.addons) {
      csv += csvRow([row.name, row.quantity]);
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="procurement-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
