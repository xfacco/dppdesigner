import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
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

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function readToken(): Promise<string | null> {
  return (await cookies()).get(JOURNEY_COOKIE)?.value ?? null;
}

/**
 * Crea un nuovo progetto legato all'utente: il wizard richiede la registrazione.
 * I progetti anonimi (cookie di ripresa) sono quelli creati prima di questo obbligo:
 * si collegano all'account alla registrazione o al login (claimAnonymousJourney).
 */
export async function createJourney(locale: string) {
  const versionId = await getPublishedVersionId();
  if (!versionId) throw new Error("Nessuna versione del wizard pubblicata");
  const session = await getSession();
  if (!session) throw new Error("Per creare un progetto serve un account");
  return db.journey.create({ data: { versionId, locale, userId: session.user.id } });
}

/** Progetto anonimo associato al cookie di questo browser, se ancora valido. */
export async function getAnonymousJourney() {
  const token = await readToken();
  if (!token) return null;
  return db.journey.findFirst({
    where: { tokenHash: hashToken(token), tokenExpiresAt: { gt: new Date() }, userId: null },
  });
}

/** Progetto accessibile all'utente corrente: solo il proprietario registrato. */
export async function getAccessibleJourney(journeyId: string) {
  const session = await getSession();
  if (!session) return null;
  const journey = await db.journey.findUnique({ where: { id: journeyId }, include: { answers: true } });
  return journey && journey.userId === session.user.id ? journey : null;
}

/**
 * Per le pagine del wizard: il progetto dell'utente, altrimenti 404.
 * Chi non ha fatto l'accesso va alla registrazione e poi torna a `path` (senza lingua).
 */
export async function requireJourney(journeyId: string, locale: string, path: string) {
  const journey = await getAccessibleJourney(journeyId);
  if (journey) return journey;
  if (!(await getSession())) redirect(`/${locale}/register?next=${encodeURIComponent(path)}`);
  notFound();
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
