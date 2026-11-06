"use server";

import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { PRIVACY_POLICY_VERSION } from "@/lib/schemas";
import { getSession } from "@/lib/session";
import { claimAnonymousJourney, createJourney } from "@/server/journey";

/**
 * Dopo la registrazione: salva i consensi e collega il progetto anonimo al nuovo account.
 * Se la registrazione parte da "Inizia a progettare" e non c'è un progetto da collegare, ne apre uno nuovo.
 * Il consenso PRIVACY registra la presa visione dell'informativa (implicita nella registrazione).
 */
export async function completeRegistration(options: { marketing: boolean; startWizard?: boolean }) {
  const session = await getSession();
  if (!session) return { ok: false as const };

  await db.consent.createMany({
    data: [
      { userId: session.user.id, type: "PRIVACY", granted: true, policyVersion: PRIVACY_POLICY_VERSION },
      { userId: session.user.id, type: "MARKETING", granted: options.marketing, policyVersion: PRIVACY_POLICY_VERSION },
    ],
  });
  let journeyId = await claimAnonymousJourney(session.user.id);
  if (!journeyId && options.startWizard) journeyId = (await createJourney(await getLocale())).id;
  return { ok: true as const, journeyId };
}

/** Dopo il login: collega l'eventuale progetto anonimo di questo browser all'account. */
export async function claimAfterLogin() {
  const session = await getSession();
  if (!session) return { ok: false as const };
  const journeyId = await claimAnonymousJourney(session.user.id);
  return { ok: true as const, journeyId };
}
