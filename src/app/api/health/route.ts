import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Controllo di disponibilità (uptime check): risponde 200 se il sito raggiunge il database. */
export async function GET() {
  try {
    await db.$queryRaw`select 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
