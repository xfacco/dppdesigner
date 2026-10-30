import type { PrismaClient } from "../../src/generated/prisma/client";
import { granularitySuggestions, productCategoriesStep as s } from "./product-categories";

const LOCALES = ["it", "en"] as const;

/**
 * Aggiunge alla versione indicata lo step "product_categories" subito dopo "industry"
 * e i suggerimenti sul livello del passaporto. Idempotente: non tocca ciò che esiste già.
 */
export async function applyProductCategories(db: PrismaClient, versionId: string) {
  const log: string[] = [];
  const industry = await db.step.findUnique({ where: { versionId_key: { versionId, key: "industry" } } });
  if (!industry) throw new Error("Step 'industry' non trovato nella versione");

  const exists = await db.step.findUnique({ where: { versionId_key: { versionId, key: s.key } } });
  if (exists) {
    log.push("step product_categories già presente");
  } else {
    await db.$transaction(async (tx) => {
      // Fa spazio subito dopo "industry"
      await tx.step.updateMany({ where: { versionId, position: { gt: industry.position } }, data: { position: { increment: 1 } } });
      await tx.step.create({
        data: {
          versionId,
          key: s.key,
          type: s.type,
          required: true,
          position: industry.position + 1,
          translations: {
            create: LOCALES.map((locale) => ({
              locale,
              title: s.title[locale],
              description: s.description[locale],
              references: s.references[locale],
            })),
          },
          options: {
            create: s.options.map((o, i) => ({
              key: o.key,
              position: i,
              visibleIf: o.visibleIf,
              translations: { create: LOCALES.map((locale) => ({ locale, label: o.label[locale] })) },
            })),
          },
        },
      });
    });
    log.push(`step product_categories creato con ${s.options.length} categorie`);
  }

  const granularity = await db.step.findUnique({
    where: { versionId_key: { versionId, key: "dpp_granularity" } },
    include: { suggestions: true },
  });
  if (!granularity) {
    log.push("step dpp_granularity non trovato: suggerimenti non aggiunti");
  } else if (granularity.suggestions.length > 0) {
    log.push("suggerimenti su dpp_granularity già presenti");
  } else {
    for (const sg of granularitySuggestions) {
      await db.stepSuggestion.create({
        data: {
          stepId: granularity.id,
          optionKey: sg.optionKey,
          priority: sg.priority,
          condition: sg.condition,
          translations: { create: LOCALES.map((locale) => ({ locale, message: sg.message[locale] })) },
        },
      });
    }
    log.push(`${granularitySuggestions.length} suggerimenti aggiunti a dpp_granularity`);
  }
  return log;
}
