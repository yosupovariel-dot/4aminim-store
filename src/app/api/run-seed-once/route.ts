// TEMPORARY, ONE-TIME-USE route to seed the production database from
// outside Vercel's dashboard (used because local dev couldn't reach Neon
// directly). Delete this file and redeploy immediately after use.
import { NextRequest, NextResponse } from "next/server";
import { runSeed, prisma } from "../../../../prisma/seed";

const ONE_TIME_SECRET = "73d2f03bdf4ba8b3e90c91d0c106268b304196aa00fcea70";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== ONE_TIME_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await runSeed();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
