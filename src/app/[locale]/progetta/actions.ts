"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { AnswerValue } from "@/lib/wizard/rules";
import { createJourney, saveAnswer } from "@/server/journey";
import { askAi, askExpert } from "@/server/questions";

export async function startJourney() {
  const locale = await getLocale();
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
