import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { visibleSteps } from "@/lib/wizard/engine";
import { askAssistant } from "./ai";
import { getAccessibleJourney } from "./journey";
import { loadWizard, toAnswers } from "./wizard";

/** Limiti per progetto, per contenere costi e abusi. */
export const AI_LIMIT_PER_DAY = 10;
export const EXPERT_OPEN_LIMIT = 5;
/** Turni AI precedenti inviati come contesto. */
const AI_HISTORY_TURNS = 4;

export const questionSchema = z.string().trim().min(3).max(1000);

export type QuestionView = {
  id: string;
  channel: "AI" | "EXPERT";
  status: "OPEN" | "ANSWERED";
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
};

const toView = (q: {
  id: string;
  channel: "AI" | "EXPERT";
  status: "OPEN" | "ANSWERED";
  question: string;
  answer: string | null;
  createdAt: Date;
  answeredAt: Date | null;
}): QuestionView => ({
  id: q.id,
  channel: q.channel,
  status: q.status,
  question: q.question,
  answer: q.answer,
  createdAt: q.createdAt.toISOString(),
  answeredAt: q.answeredAt?.toISOString() ?? null,
});

export async function listStepQuestions(journeyId: string, stepKey: string) {
  const rows = await db.stepQuestion.findMany({ where: { journeyId, stepKey }, orderBy: { createdAt: "asc" } });
  return rows.map(toView);
}

export type AskResult =
  | { ok: true; question: QuestionView }
  | { ok: false; error: "not_found" | "invalid" | "limit" | "disabled" | "refused" | "unavailable" };

async function loadContext(journeyId: string, stepKey: string) {
  const journey = await getAccessibleJourney(journeyId);
  if (!journey) return null;
  const def = await loadWizard(journey.versionId, journey.locale);
  const answers = toAnswers(journey.answers);
  const step = visibleSteps(def, answers).find((s) => s.key === stepKey);
  return step ? { journey, def, answers, step } : null;
}

export async function askAi(journeyId: string, stepKey: string, rawQuestion: string, locale: string): Promise<AskResult> {
  const parsed = questionSchema.safeParse(rawQuestion);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ctx = await loadContext(journeyId, stepKey);
  if (!ctx) return { ok: false, error: "not_found" };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await db.stepQuestion.count({ where: { journeyId, channel: "AI", createdAt: { gte: since } } });
  if (used >= AI_LIMIT_PER_DAY) return { ok: false, error: "limit" };

  const history = await db.stepQuestion.findMany({
    where: { journeyId, stepKey, channel: "AI", status: "ANSWERED" },
    orderBy: { createdAt: "desc" },
    take: AI_HISTORY_TURNS,
  });

  const result = await askAssistant({
    def: ctx.def,
    step: ctx.step,
    answers: ctx.answers,
    locale,
    history: history.reverse().map((h) => ({ question: h.question, answer: h.answer ?? "" })),
    question: parsed.data,
  });
  if (!result.ok) return result;

  const saved = await db.stepQuestion.create({
    data: {
      journeyId,
      stepKey,
      locale,
      channel: "AI",
      status: "ANSWERED",
      question: parsed.data,
      answer: result.answer,
      answeredAt: new Date(),
    },
  });
  return { ok: true, question: toView(saved) };
}

export async function askExpert(journeyId: string, stepKey: string, rawQuestion: string, locale: string): Promise<AskResult> {
  const parsed = questionSchema.safeParse(rawQuestion);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const ctx = await loadContext(journeyId, stepKey);
  if (!ctx) return { ok: false, error: "not_found" };

  const open = await db.stepQuestion.count({ where: { journeyId, channel: "EXPERT", status: "OPEN" } });
  if (open >= EXPERT_OPEN_LIMIT) return { ok: false, error: "limit" };

  const saved = await db.stepQuestion.create({
    data: { journeyId, stepKey, locale, channel: "EXPERT", question: parsed.data },
  });
  return { ok: true, question: toView(saved) };
}
