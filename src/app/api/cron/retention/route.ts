import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/** Conservazione dati utenti registrati: 24 mesi dall'ultimo accesso. */
const RETENTION_MONTHS = 24;

/**
 * Job giornaliero (Vercel Cron, vedi vercel.json). Cancella gli utenti USER inattivi
 * oltre il periodo di conservazione; i loro progetti restano nel DB come anonimi.
 * Pulisce anche i token di ripresa scaduti dei progetti anonimi (i progetti restano).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);

  const [users, tokens, verifications] = await db.$transaction([
    db.user.deleteMany({ where: { role: "USER", lastSeenAt: { lt: cutoff } } }),
    db.journey.updateMany({
      where: { tokenExpiresAt: { lt: new Date() } },
      data: { tokenHash: null, tokenExpiresAt: null },
    }),
    db.verification.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);

  return NextResponse.json({ deletedUsers: users.count, expiredTokens: tokens.count, verifications: verifications.count });
}
