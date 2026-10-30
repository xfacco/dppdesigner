import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  answerSchema,
  computeScore,
  dependentSteps,
  firstIncompleteStep,
  visibleSteps,
} from "@/lib/wizard/engine";
import type { AnswerValue } from "@/lib/wizard/rules";
import { getPublishedVersionId, loadWizard, toAnswers } from "./wizard";

export const JOURNEY_COOKIE = "dpp_journey";
export const RESUME_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function readToken(): Promise<string | null> {
  return (await cookies()).get(JOURNEY_COOKIE)?.value ?? null;
}

/** Crea un nuovo progetto: legato all'utente se loggato, altrimenti anonimo con cookie di ripresa. */
export async function createJourney(locale: string) {
  const versionId = await getPublishedVersionId();
  if (!versionId) throw new Error("Nessuna versione del wizard pubblicata");

  const session = await getSession();
  if (session) {
    return db.journey.create({ data: { versionId, locale, userId: session.user.id } });
  }

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + RESUME_DAYS * 24 * 60 * 60 * 1000);
  const journey = await db.journey.create({
    data: { versionId, locale, tokenHash: hashToken(token), tokenExpiresAt: expires },
  });
  (await cookies()).set(JOURNEY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  return journey;
}

/** Progetto anonimo associato al cookie di questo browser, se ancora valido. */
export async function getAnonymousJourney() {
  const token = await readToken();
  if (!token) return null;
  return db.journey.findFirst({
    where: { tokenHash: hashToken(token), tokenExpiresAt: { gt: new Date() }, userId: null },
  });
}

/** Progetto accessibile all'utente corrente (proprietario oppure titolare del cookie). */
export async function getAccessibleJourney(journeyId: string) {
  const journey = await db.journey.findUnique({ where: { id: journeyId }, include: { answers: true } });
  if (!journey) return null;

  if (journey.userId) {
    const session = await getSession();
    return session?.user.id === journey.userId ? journey : null;
  }

  const token = await readToken();
  const valid =
    token !== null &&
    journey.tokenHash === hashToken(token) &&
    journey.tokenExpiresAt !== null &&
    journey.tokenExpiresAt > new Date();
  return valid ? journey : null;
}

export type SaveResult =
  | { ok: true; next: string | null; completed: boolean }
  | { ok: false; error: "not_found" | "invalid" };

export async function saveAnswer(journeyId: string, stepKey: string, value: AnswerValue): Promise<SaveResult> {
  const journey = await getAccessibleJourney(journeyId);
  if (!journey) return { ok: false, error: "not_found" };

  const def = await loadWizard(journey.versionId, journey.locale);
  const answers = toAnswers(journey.answers);
  const step = visibleSteps(def, answers).find((s) => s.key === stepKey);
  if (!step) return { ok: false, error: "not_found" };

  const parsed = answerSchema(step, answers).safeParse(value);
  if (!parsed.success) return { ok: false, error: "invalid" };
  // Le opzioni "obbligatorie per legge" non bloccano il salvataggio: l'utente viene avvisato nel form.

  const previous = answers[stepKey];
  const changed = previous !== undefined && JSON.stringify(previous) !== JSON.stringify(parsed.data);
  const nextAnswers = { ...answers, [stepKey]: parsed.data };

  const incomplete = firstIncompleteStep(def, nextAnswers);
  const steps = visibleSteps(def, nextAnswers);
  const next = steps[steps.findIndex((s) => s.key === stepKey) + 1] ?? null;
  const score = incomplete ? null : computeScore(def, nextAnswers);

  await db.$transaction([
    db.answer.upsert({
      where: { journeyId_stepKey: { journeyId, stepKey } },
      create: { journeyId, stepKey, value: parsed.data, needsReview: false },
      update: { value: parsed.data, needsReview: false },
    }),
    ...(changed
      ? [
          db.answer.updateMany({
            where: { journeyId, stepKey: { in: dependentSteps(def, stepKey) } },
            data: { needsReview: true },
          }),
        ]
      : []),
    db.journey.update({
      where: { id: journeyId },
      data: {
        lastStepKey: stepKey,
        status: incomplete ? "IN_PROGRESS" : "COMPLETED",
        score: score?.total ?? null,
        areaScores: score ? score.areas : undefined,
        completedAt: incomplete ? null : (journey.completedAt ?? new Date()),
      },
    }),
  ]);

  return { ok: true, next: next?.key ?? null, completed: !incomplete };
}

/** Associa il progetto anonimo di questo browser all'utente appena registrato o loggato. */
export async function claimAnonymousJourney(userId: string) {
  const journey = await getAnonymousJourney();
  if (!journey) return null;
  await db.journey.update({
    where: { id: journey.id },
    data: { userId, tokenHash: null, tokenExpiresAt: null },
  });
  (await cookies()).delete(JOURNEY_COOKIE);
  return journey.id;
}
