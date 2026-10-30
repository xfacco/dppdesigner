import type { PrismaClient } from "../../src/generated/prisma/client";

const LOCALES = ["it", "en"] as const;
type T = { it: string; en: string };

const TITLE: T = {
  it: "Per ciascuna categoria, il prodotto richiede manutenzione o riparazioni?",
  en: "For each category, does the product require maintenance or repairs?",
};
const DESCRIPTION: T = {
  it: "Se il prodotto viene riparato o mantenuto, il passaporto dovrà riportare le informazioni utili (ricambi, istruzioni) e, a seconda del settore, gli interventi eseguiti.",
  en: "If the product is repaired or maintained, the passport will have to include the relevant information (spare parts, instructions) and, depending on the sector, the work carried out.",
};
const DEPENDS: T = { it: "Dipende dal prodotto", en: "Depends on the product" };
const anyOf = (keys: string[]) => ({ step: "product_categories", op: "includes", value: keys });

/** Consigli per riga (indicativi): la categoria della riga decide quale si applica. */
const SUGGESTIONS: { optionKey: string; priority: number; condition: object; message: T }[] = [
  {
    optionKey: "yes",
    priority: 5,
    condition: anyOf(["battery_lmt", "battery_ev", "battery_industrial"]),
    message: {
      it: "**Batterie EV, LMT e industriali**: stato di salute e durata prevista vanno aggiornati durante la vita della batteria (Reg. (UE) 2023/1542, art. 14).",
      en: "**EV, LMT and industrial batteries**: state of health and expected lifetime must be updated during the battery's life (Regulation (EU) 2023/1542, Article 14).",
    },
  },
  {
    optionKey: "yes",
    priority: 4,
    condition: anyOf(["elec_mobile", "elec_computers", "elec_appliances", "elec_displays", "elec_other"]),
    message: {
      it: "**Elettronica**: riparabilità e ricambi sono tra i requisiti attesi; per diverse categorie si applica anche la Direttiva (UE) 2024/1799 sul diritto alla riparazione.",
      en: "**Electronics**: reparability and spare parts are among the expected requirements; for several categories the Right to Repair Directive (EU) 2024/1799 also applies.",
    },
  },
  {
    optionKey: "yes",
    priority: 3,
    condition: anyOf(["tyres_commercial"]),
    message: {
      it: "**Pneumatici per veicoli commerciali**: sono spesso ricostruiti; valuta se registrare questi interventi nel passaporto.",
      en: "**Commercial vehicle tyres**: they are often retreaded; consider recording this work in the passport.",
    },
  },
  {
    optionKey: "depends",
    priority: 2,
    condition: anyOf(["textile_apparel", "textile_footwear", "textile_home", "textile_accessories", "furn_furniture", "furn_mattresses"]),
    message: {
      it: "**Tessile e arredamento**: dipende dal prodotto. I prodotti di fascia alta sono spesso riparati, quelli di largo consumo raramente.",
      en: "**Textiles and furniture**: it depends on the product. High-end products are often repaired, mass-market ones rarely.",
    },
  },
  {
    optionKey: "no",
    priority: 2,
    condition: anyOf(["metal_steel", "metal_aluminium", "constr_materials"]),
    message: {
      it: "**Materiali (acciaio, alluminio, materiali da costruzione)**: di norma non hanno manutenzione come singolo prodotto. Rispondi Sì solo per componenti o prodotti finiti.",
      en: "**Materials (steel, aluminium, construction materials)**: they usually have no maintenance as a single product. Answer Yes only for components or finished products.",
    },
  },
];

/**
 * Trasforma lo step "maintenance" in una griglia per categorie, una risposta per riga
 * (Sì / No / Dipende dal prodotto), con consigli per categoria; adegua l'opzione
 * "repair_info" dello step "data_model", che dipende da questa risposta. Idempotente.
 */
export async function applyMaintenanceMatrix(db: PrismaClient, versionId: string) {
  const log: string[] = [];
  const step = await db.step.findUnique({
    where: { versionId_key: { versionId, key: "maintenance" } },
    include: { options: true, suggestions: true },
  });
  const source = await db.step.findUnique({ where: { versionId_key: { versionId, key: "product_categories" } } });
  if (!step || !source) throw new Error("Servono gli step 'product_categories' e 'maintenance'");
  if (source.position >= step.position) throw new Error("'product_categories' deve venire prima di 'maintenance'");

  if (step.type !== "MATRIX") {
    await db.$transaction([
      db.step.update({
        where: { id: step.id },
        data: { type: "MATRIX", required: true, config: { rowsFrom: "product_categories", multiple: false } },
      }),
      ...LOCALES.map((locale) =>
        db.stepTranslation.updateMany({
          where: { stepId: step.id, locale },
          data: { title: TITLE[locale], description: DESCRIPTION[locale] },
        }),
      ),
    ]);
    log.push("maintenance trasformato in griglia per categorie (una risposta per riga)");
  }

  if (!step.options.some((o) => o.key === "depends")) {
    await db.option.create({
      data: {
        stepId: step.id,
        key: "depends",
        position: Math.max(...step.options.map((o) => o.position), -1) + 1,
        translations: { create: LOCALES.map((locale) => ({ locale, label: DEPENDS[locale] })) },
      },
    });
    log.push("aggiunta l'opzione 'Dipende dal prodotto'");
  }

  if (step.suggestions.length === 0) {
    for (const sg of SUGGESTIONS) {
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
    log.push(`${SUGGESTIONS.length} consigli per categoria aggiunti`);
  }

  // "Informazioni di riparazione e ricambi" compare se almeno una categoria ha manutenzione (Sì o Dipende)
  const dataModel = await db.step.findUnique({ where: { versionId_key: { versionId, key: "data_model" } } });
  if (dataModel) {
    const res = await db.option.updateMany({
      where: { stepId: dataModel.id, key: "repair_info" },
      data: { visibleIf: { step: "maintenance", op: "includes", value: ["yes", "depends"] } },
    });
    if (res.count) log.push("condizione di 'repair_info' adeguata alla griglia");
  }
  return log;
}
