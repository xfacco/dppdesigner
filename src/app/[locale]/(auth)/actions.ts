"use server";

import { db } from "@/lib/db";
import { PRIVACY_POLICY_VERSION } from "@/lib/schemas";
import { getSession } from "@/lib/session";
import { claimAnonymousJourney } from "@/server/journey";

/** Dopo la registrazione: salva i consensi e collega il progetto anonimo al nuovo account. */
export async function completeRegistration(consents: { marketing: boolean }) {
  const session = await getSession();
  if (!session) return { ok: false as const };

  await db.consent.createMany({
    data: [
      { userId: session.user.id, type: "PRIVACY", granted: true, policyVersion: PRIVACY_POLICY_VERSION },
      { userId: session.user.id, type: "MARKETING", granted: consents.marketing, policyVersion: PRIVACY_POLICY_VERSION },
    ],
  });
  const journeyId = await claimAnonymousJourney(session.user.id);
  return { ok: true as const, journeyId };
}

/** Dopo il login: collega l'eventuale progetto anonimo di questo browser all'account. */
export async function claimAfterLogin() {
  const session = await getSession();
  if (!session) return { ok: false as const };
  const journeyId = await claimAnonymousJourney(session.user.id);
  return { ok: true as const, journeyId };
}
