import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { StepConfig, WizardDef } from "@/lib/wizard/engine";
import { parseCondition, type AnswerValue, type Answers } from "@/lib/wizard/rules";

const FALLBACK_LOCALE = "it";

/** Sceglie la traduzione nella lingua richiesta, poi italiano, poi la prima disponibile. */
export function pickTranslation<T extends { locale: string }>(list: T[], locale: string): T | undefined {
  return list.find((t) => t.locale === locale) ?? list.find((t) => t.locale === FALLBACK_LOCALE) ?? list[0];
}

export const loadWizard = cache(async (versionId: string, locale: string): Promise<WizardDef> => {
  const version = await db.wizardVersion.findUniqueOrThrow({
    where: { id: versionId },
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: {
          translations: true,
          options: { orderBy: { position: "asc" }, include: { translations: true } },
          suggestions: { include: { translations: true } },
        },
      },
      areas: { orderBy: { position: "asc" }, include: { translations: true } },
      scoringRules: { include: { area: true } },
      recommendations: { include: { translations: true } },
    },
  });

  return {
    versionId: version.id,
    steps: version.steps.map((s) => {
      const t = pickTranslation(s.translations, locale);
      return {
        key: s.key,
        type: s.type,
        required: s.required,
        visibleIf: parseCondition(s.visibleIf),
        config: (s.config ?? {}) as StepConfig,
        title: t?.title ?? s.key,
        description: t?.description,
        help: t?.help,
        references: t?.references,
        options: s.options.map((o) => {
          const ot = pickTranslation(o.translations, locale);
          return {
            key: o.key,
            label: ot?.label ?? o.key,
            description: ot?.description,
            visibleIf: parseCondition(o.visibleIf),
          };
        }),
        suggestions: s.suggestions.map((sg) => ({
          condition: parseCondition(sg.condition) ?? { all: [] },
          optionKey: sg.optionKey,
          mandatory: sg.mandatory,
          priority: sg.priority,
          message: pickTranslation(sg.translations, locale)?.message ?? "",
        })),
      };
    }),
    areas: version.areas.map((a) => ({
      key: a.key,
      label: pickTranslation(a.translations, locale)?.label ?? a.key,
      weight: a.weight,
      maxPoints: a.maxPoints,
    })),
    scoringRules: version.scoringRules.map((r) => ({
      areaKey: r.area.key,
      condition: parseCondition(r.condition) ?? { all: [] },
      points: r.points,
    })),
    recommendations: version.recommendations.map((r) => {
      const t = pickTranslation(r.translations, locale);
      return {
        condition: parseCondition(r.condition) ?? { all: [] },
        priority: r.priority,
        title: t?.title ?? "",
        body: t?.body ?? "",
      };
    }),
  };
});

export async function getPublishedVersionId(): Promise<string | null> {
  const v = await db.wizardVersion.findFirst({ where: { status: "PUBLISHED" }, select: { id: true } });
  return v?.id ?? null;
}

export function toAnswers(rows: { stepKey: string; value: unknown }[]): Answers {
  return Object.fromEntries(rows.map((r) => [r.stepKey, r.value as AnswerValue]));
}
