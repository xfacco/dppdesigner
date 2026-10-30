import type { PrismaClient } from "../../src/generated/prisma/client";

const TITLE = {
  it: "A quale livello serve il passaporto, per ciascuna categoria?",
  en: "At which level is the passport needed, for each category?",
};
const DESCRIPTION = {
  it: "Il passaporto può riferirsi al modello, al lotto di produzione o al singolo prodotto. Il livello può essere diverso tra categorie e anche tra prodotti della stessa categoria.",
  en: "The passport can relate to the model, the production batch or the individual item. The level can differ between categories and also between products of the same category.",
};
/** Categorie per cui il passaporto per singola batteria è un obbligo (Reg. UE 2023/1542, art. 77). */
const BATTERY_PASSPORT = ["battery_lmt", "battery_ev", "battery_industrial"];

/**
 * Trasforma lo step "dpp_granularity" in una griglia: una riga per ogni categoria scelta in
 * "product_categories", con i livelli come colonne; rende obbligatorio "item" per le batterie
 * soggette al passaporto. Idempotente.
 */
export async function applyGranularityMatrix(db: PrismaClient, versionId: string) {
  const log: string[] = [];
  const step = await db.step.findUnique({
    where: { versionId_key: { versionId, key: "dpp_granularity" } },
    include: { suggestions: true },
  });
  const source = await db.step.findUnique({ where: { versionId_key: { versionId, key: "product_categories" } } });
  if (!step || !source) throw new Error("Servono gli step 'product_categories' e 'dpp_granularity'");
  if (source.position >= step.position) throw new Error("'product_categories' deve venire prima di 'dpp_granularity'");

  if (step.type === "MATRIX") {
    log.push("dpp_granularity è già una griglia");
  } else {
    await db.$transaction([
      db.step.update({
        where: { id: step.id },
        data: { type: "MATRIX", required: true, config: { rowsFrom: "product_categories" } },
      }),
      ...(["it", "en"] as const).map((locale) =>
        db.stepTranslation.updateMany({
          where: { stepId: step.id, locale },
          data: { title: TITLE[locale], description: DESCRIPTION[locale] },
        }),
      ),
    ]);
    log.push("dpp_granularity trasformato in griglia per categorie");
  }

  const battery = step.suggestions.find(
    (s) => s.optionKey === "item" && JSON.stringify(s.condition).includes(BATTERY_PASSPORT[0]),
  );
  if (battery && !battery.mandatory) {
    await db.stepSuggestion.update({ where: { id: battery.id }, data: { mandatory: true } });
    log.push("livello 'singolo prodotto' reso obbligatorio per le batterie con passaporto");
  }
  return log;
}
