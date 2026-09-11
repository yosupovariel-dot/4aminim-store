// TEMPORARY, ONE-TIME-USE diagnostic route — checks Google Sheets config
// and attempts a real sync, surfacing the actual error (resyncOrdersSheet
// normally swallows errors, logging only server-side). Delete after use.
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { isGoogleSheetsConfigured } from "@/lib/googleSheets";

const ONE_TIME_SECRET = "b7191446ff651eda9f690653a6035ac85615c9e909f628e3";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== ONE_TIME_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const configured = isGoogleSheetsConfigured();
  const envPresence = {
    GOOGLE_SHEETS_SPREADSHEET_ID: Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
  };

  if (!configured) {
    return NextResponse.json({ configured, envPresence });
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    return NextResponse.json({
      configured,
      envPresence,
      connectionOk: true,
      spreadsheetTitle: meta.data.properties?.title,
      tabs: meta.data.sheets?.map((s) => s.properties?.title),
    });
  } catch (err: unknown) {
    const e = err as { message?: string; response?: { data?: unknown } };
    return NextResponse.json({
      configured,
      envPresence,
      connectionOk: false,
      error: e?.message,
      details: e?.response?.data,
    });
  }
}
