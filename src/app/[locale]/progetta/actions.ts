"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { AnswerValue } from "@/lib/wizard/rules";
import { WIZARD_START } from "../(auth)/safe-next";
import { createJourney, saveAnswer } from "@/server/journey";
import { askAi, askExpert } from "@/server/questions";

/** Nuovo progetto: serve un account, chi non è registrato passa prima dalla registrazione. */
export async function startJourney() {
  const locale = await getLocale();
  if (!(await getSession())) redirect(`/${locale}/register?next=${WIZARD_START}`);
  const journey = await createJourney(locale);
  redirect(`/${locale}/progetta/${journey.id}`);
}

export async function saveStep(journeyId: string, stepKey: string, value: AnswerValue) {
  return saveAnswer(journeyId, stepKey, value);
}

export async function askStepAi(journeyId: string, stepKey: string, question: string) {
  return askAi(journeyId, stepKey, question, await getLocale());
}

export async function askStepExpert(journeyId: string, stepKey: string, question: string) {
  return askExpert(journeyId, stepKey, question, await getLocale());
}
