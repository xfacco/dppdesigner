import type { PrismaClient } from "../../src/generated/prisma/client";

const LOCALES = ["it", "en"] as const;
export type T = { it: string; en: string };

export type CategoryMatrixSpec = {
  stepKey: string;
  title: T;
  description?: T;
  /** false = una risposta per riga */
  multiple: boolean;
  /** Opzioni da aggiungere se mancano (in coda) */
  extraOptions?: { key: string; label: T }[];
  /** Consigli per riga, aggiunti solo se lo step non ne ha */
  suggestions?: { optionKey: string | null; priority: number; condition: object; message: T }[];
};

export const anyCategory = (keys: string[]) => ({ step: "product_categories", op: "includes", value: keys });

/**
 * Trasforma uno step in una griglia con una riga per ogni categoria scelta in
 * "product_categories". Idempotente: non tocca ciò che è già stato convertito.
 */
export async function applyCategoryMatrix(db: PrismaClient, versionId: string, spec: CategoryMatrixSpec) {
  const log: string[] = [];
  const step = await db.step.findUnique({
    where: { versionId_key: { versionId, key: spec.stepKey } },
    include: { options: true, suggestions: true },
  });
  const source = await db.step.findUnique({ where: { versionId_key: { versionId, key: "product_categories" } } });
  if (!step || !source) throw new Error(`Servono gli step 'product_categories' e '${spec.stepKey}'`);
  if (source.position >= step.position) throw new Error(`'product_categories' deve venire prima di '${spec.stepKey}'`);

  if (step.type !== "MATRIX") {
    await db.$transaction([
      db.step.update({
        where: { id: step.id },
        data: { type: "MATRIX", required: true, config: { rowsFrom: "product_categories", multiple: spec.multiple } },
      }),
      ...LOCALES.map((locale) =>
        db.stepTranslation.updateMany({
          where: { stepId: step.id, locale },
          data: { title: spec.title[locale], ...(spec.description ? { description: spec.description[locale] } : {}) },
        }),
      ),
    ]);
    log.push(`${spec.stepKey} trasformato in griglia per categorie (${spec.multiple ? "più risposte" : "una risposta"} per riga)`);
  }

  let position = Math.max(...step.options.map((o) => o.position), -1);
  for (const opt of spec.extraOptions ?? []) {
    if (step.options.some((o) => o.key === opt.key)) continue;
    await db.option.create({
      data: {
        stepId: step.id,
        key: opt.key,
        position: ++position,
        translations: { create: LOCALES.map((locale) => ({ locale, label: opt.label[locale] })) },
      },
    });
    log.push(`aggiunta l'opzione '${opt.label.it}'`);
  }

  if (step.suggestions.length === 0 && spec.suggestions?.length) {
    for (const sg of spec.suggestions) {
      await db.stepSuggestion.create({
        data: {
          stepId: step.id,
          optionKey: sg.optionKey,
          priority: sg.priority,
          condition: sg.condition,
          translations: { create: LOCALES.map((locale) => ({ locale, message: sg.message[locale] })) },
        },
      });
    }
    log.push(`${spec.suggestions.length} consigli per categoria aggiunti`);
  }
  return log;
}
