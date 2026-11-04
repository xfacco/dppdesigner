import type { PrismaClient } from "../../src/generated/prisma/client";
import { anyCategory, type T } from "./apply-category-matrix";

const LOCALES = ["it", "en"] as const;

/**
 * "Come gestirete le versioni del passaporto?" per categoria, una risposta per riga, subito dopo
 * "maintenance". Un consiglio per ogni categoria di "product_categories" più uno generale.
 * Consigli indicativi; i casi batterie e prodotti da costruzione si basano sui rispettivi regolamenti.
 */
const STEP_KEY = "dpp_versioning";
const AFTER = "maintenance";

const TITLE: T = {
  it: "Per ciascuna categoria, come gestirete le versioni del passaporto?",
  en: "For each category, how will you manage passport versions?",
};
const DESCRIPTION: T = {
  it: "Il passaporto cambia nel tempo: correzioni, dati aggiornati, prodotti riparati o rigenerati. Il versioning decide cosa succede ai dati precedenti: vengono sostituiti, conservati come versioni datate, oppure il prodotto riceve un nuovo passaporto collegato al precedente.",
  en: "The passport changes over time: corrections, updated data, repaired or remanufactured products. Versioning decides what happens to previous data: it is replaced, kept as dated versions, or the product gets a new passport linked to the previous one.",
};
const REFERENCES: T = {
  it: `- [Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj/ita): il passaporto deve restare **accessibile e aggiornato** per tutta la durata prevista dall'atto delegato, che indica anche chi può modificare quali dati; è prevista una **copia di backup** presso un fornitore di servizi DPP.
- **Batterie**: [Regolamento (UE) 2023/1542 (Batterie)](https://eur-lex.europa.eu/eli/reg/2023/1542/oj/ita), art. 77: una batteria preparata per il riutilizzo, il cambio di destinazione o la rifabbricazione riceve un **nuovo passaporto collegato** a quello della batteria originale; Allegato XIII: dati dinamici come lo stato di salute.
- **Prodotti da costruzione**: [Regolamento (UE) 2024/3110 (Prodotti da costruzione)](https://eur-lex.europa.eu/eli/reg/2024/3110/oj/ita): il passaporto è collegato alla **dichiarazione di prestazione e di conformità**.
- [CEN-CENELEC JTC 24](https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-07-15-dpp/): norme tecniche europee del passaporto (identificativi, diritti di accesso, interfacce per la gestione del ciclo di vita).`,
  en: `- [Regulation (EU) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj): the passport must remain **accessible and up to date** for the whole period set by the delegated act, which also sets who may change which data; a **back-up copy** must be kept by a DPP service provider.
- **Batteries**: [Regulation (EU) 2023/1542 (Batteries)](https://eur-lex.europa.eu/eli/reg/2023/1542/oj), Article 77: a battery prepared for re-use, repurposing or remanufacturing gets a **new passport linked** to that of the original battery; Annex XIII: dynamic data such as state of health.
- **Construction products**: [Regulation (EU) 2024/3110 (Construction products)](https://eur-lex.europa.eu/eli/reg/2024/3110/oj): the passport is linked to the **declaration of performance and conformity**.
- [CEN-CENELEC JTC 24](https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-07-15-dpp/): European technical standards for the passport (identifiers, access rights, lifecycle management interfaces).`,
};

const OPTIONS: { key: string; label: T; description: T }[] = [
  {
    key: "current_only",
    label: { it: "Solo la versione corrente", en: "Current version only" },
    description: {
      it: "Ogni modifica sostituisce i dati precedenti, che non restano consultabili.\nEs.: correzione di un errore nella scheda di un prodotto senza obbligo di passaporto.",
      en: "Each change replaces the previous data, which is no longer available.\nE.g. fixing an error in the sheet of a product with no passport obligation.",
    },
  },
  {
    key: "history",
    label: { it: "Storico delle versioni", en: "Version history" },
    description: {
      it: "Ogni modifica crea una nuova versione con data e motivo; le precedenti restano consultabili.\nEs.: impronta di carbonio di un lotto ricalcolata, nuova dichiarazione di prestazione.",
      en: "Each change creates a new version with date and reason; previous ones remain available.\nE.g. a recalculated carbon footprint for a batch, a new declaration of performance.",
    },
  },
  {
    key: "history_linked",
    label: { it: "Storico e passaporti collegati", en: "History and linked passports" },
    description: {
      it: "Storico delle versioni, più un nuovo passaporto collegato al precedente quando il prodotto cambia in modo sostanziale.\nEs.: batteria di un'auto elettrica riutilizzata come accumulo stazionario.",
      en: "Version history, plus a new passport linked to the previous one when the product changes substantially.\nE.g. an electric car battery repurposed as stationary storage.",
    },
  },
  {
    key: "unsure",
    label: { it: "Non ancora definito", en: "Not defined yet" },
    description: {
      it: "Non avete ancora deciso come gestire gli aggiornamenti del passaporto.\nEs.: progetto DPP nelle fasi iniziali.",
      en: "You have not decided yet how to handle passport updates.\nE.g. a DPP project at an early stage.",
    },
  },
];

/** Un consiglio per ogni categoria (la riga della griglia decide quale si applica) e uno generale. */
const SUGGESTIONS: { optionKey: string | null; priority: number; condition: object; message: T }[] = [
  {
    optionKey: null,
    priority: 0,
    condition: { step: "product_categories", op: "answered" },
    message: {
      it: "**In ogni caso**: l'indirizzo del passaporto (l'URL nel data carrier) resta sempre lo stesso e mostra la versione corrente. Ogni versione riporta data, autore e motivo della modifica, e le versioni precedenti non si cancellano.",
      en: "**In any case**: the passport address (the URL in the data carrier) always stays the same and shows the current version. Each version records date, author and reason for the change, and previous versions are not deleted.",
    },
  },
  {
    optionKey: "history_linked",
    priority: 5,
    condition: anyCategory(["battery_lmt", "battery_ev", "battery_industrial"]),
    message: {
      it: "**Batterie EV, LMT e industriali**: lo stato di salute cambia nel tempo, quindi serve lo storico delle versioni. Se la batteria viene rigenerata o riutilizzata per un altro scopo, riceve un nuovo passaporto collegato a quello originale (Reg. (UE) 2023/1542, art. 77).",
      en: "**EV, LMT and industrial batteries**: state of health changes over time, so version history is needed. If the battery is remanufactured or repurposed, it gets a new passport linked to the original one (Regulation (EU) 2023/1542, Article 77).",
    },
  },
  {
    optionKey: "history",
    priority: 4,
    condition: anyCategory(["elec_mobile", "elec_computers", "elec_appliances", "elec_displays", "elec_other"]),
    message: {
      it: "**Elettronica**: riparazioni, ricambi e aggiornamenti software cambiano il prodotto dopo la vendita, quindi conserva lo storico. Per i prodotti ricondizionati e rimessi sul mercato valuta un passaporto collegato al precedente.",
      en: "**Electronics**: repairs, spare parts and software updates change the product after sale, so keep the history. For refurbished products placed back on the market, consider a passport linked to the previous one.",
    },
  },
  {
    optionKey: "history_linked",
    priority: 3,
    condition: anyCategory(["tyres_commercial"]),
    message: {
      it: "**Pneumatici per veicoli commerciali**: un pneumatico ricostruito torna sul mercato come nuovo prodotto. Un passaporto collegato a quello originale ne conserva la storia.",
      en: "**Commercial vehicle tyres**: a retreaded tyre returns to the market as a new product. A passport linked to the original one keeps its history.",
    },
  },
  {
    optionKey: "history",
    priority: 3,
    condition: anyCategory(["constr_materials", "constr_components"]),
    message: {
      it: "**Prodotti da costruzione**: il passaporto è legato alla dichiarazione di prestazione e di conformità (Reg. (UE) 2024/3110). Ogni nuova dichiarazione è una nuova versione; le precedenti restano consultabili per i prodotti già posati, che restano in opera per decenni.",
      en: "**Construction products**: the passport is linked to the declaration of performance and conformity (Regulation (EU) 2024/3110). Each new declaration is a new version; previous ones remain available for products already installed, which stay in place for decades.",
    },
  },
  {
    optionKey: "current_only",
    priority: 3,
    condition: anyCategory(["battery_portable", "battery_sli"]),
    message: {
      it: "**Batterie portatili e SLI**: il Regolamento Batterie non prevede il passaporto (art. 77). Per un passaporto volontario basta di norma la versione corrente; scegli lo storico se vuoi documentare cosa era dichiarato in ogni momento.",
      en: "**Portable and SLI batteries**: the Batteries Regulation does not require a passport (Article 77). For a voluntary passport the current version is usually enough; choose history if you want to document what was declared at any time.",
    },
  },
  {
    optionKey: "history",
    priority: 2,
    condition: anyCategory(["metal_steel", "metal_aluminium"]),
    message: {
      it: "**Acciaio e alluminio**: i dati sono fissati per colata o lotto e cambiano di rado, ma un ricalcolo dell'impronta di carbonio o una correzione vanno tracciati. Conserva lo storico, non sovrascrivere.",
      en: "**Steel and aluminium**: data is set per heat or batch and rarely changes, but a recalculated carbon footprint or a correction must be traceable. Keep the history, do not overwrite.",
    },
  },
  {
    optionKey: "history",
    priority: 2,
    condition: anyCategory(["textile_apparel", "textile_footwear", "textile_home", "textile_accessories"]),
    message: {
      it: "**Tessile e moda**: il passaporto è spesso per modello, e fornitori e composizione cambiano da una produzione all'altra. Conserva lo storico per dimostrare cosa era dichiarato quando il capo è stato venduto.",
      en: "**Textiles and fashion**: the passport is often per model, and suppliers and composition change from one production run to the next. Keep the history to show what was declared when the item was sold.",
    },
  },
  {
    optionKey: "history",
    priority: 2,
    condition: anyCategory(["furn_furniture", "furn_mattresses"]),
    message: {
      it: "**Arredamento**: i dati di produzione sono stabili, ma riparazioni, rivestimenti sostituiti e rivendite si aggiungono nel tempo. Lo storico conserva questi passaggi.",
      en: "**Furniture**: production data is stable, but repairs, replaced upholstery and resales are added over time. The history keeps track of them.",
    },
  },
  {
    optionKey: "history",
    priority: 2,
    condition: anyCategory(["tyres_car"]),
    message: {
      it: "**Pneumatici per auto**: i dati sono per lotto e stabili. Gli aggiornamenti sono rari, ma conserva le versioni: le correzioni devono restare tracciabili.",
      en: "**Car tyres**: data is per batch and stable. Updates are rare, but keep the versions: corrections must remain traceable.",
    },
  },
  {
    optionKey: "history",
    priority: 1,
    condition: anyCategory(["other_category"]),
    message: {
      it: "**Altra categoria**: lo storico delle versioni è la scelta più prudente finché l'atto delegato del tuo gruppo di prodotto non indica regole precise.",
      en: "**Other category**: version history is the safest choice until the delegated act for your product group sets precise rules.",
    },
  },
];

/** Categorie coperte dai consigli (per il controllo di completezza). */
const VERSIONING_CATEGORIES = SUGGESTIONS.flatMap((s) => {
  const c = s.condition as { op: string; value?: unknown };
  return c.op === "includes" && Array.isArray(c.value) ? (c.value as string[]) : [];
});

/** Aggiunge lo step dopo "maintenance" spostando in avanti quelli successivi. Idempotente. */
export async function applyVersioningStep(db: PrismaClient, versionId: string) {
  const log: string[] = [];
  const steps = await db.step.findMany({ where: { versionId }, orderBy: { position: "asc" }, include: { options: true } });
  if (steps.some((s) => s.key === STEP_KEY)) return [`${STEP_KEY} già presente`];
  const after = steps.find((s) => s.key === AFTER);
  const categories = steps.find((s) => s.key === "product_categories");
  if (!after || !categories) throw new Error(`Servono gli step 'product_categories' e '${AFTER}'`);

  const missing = categories.options.map((o) => o.key).filter((k) => !VERSIONING_CATEGORIES.includes(k));
  if (missing.length) log.push(`attenzione: categorie senza consiglio: ${missing.join(", ")}`);

  await db.$transaction(async (tx) => {
    // Dal fondo, per non scontrarsi con altre posizioni durante lo spostamento
    for (const s of steps.filter((s) => s.position > after.position).reverse())
      await tx.step.update({ where: { id: s.id }, data: { position: s.position + 1 } });
    await tx.step.create({
      data: {
        versionId,
        key: STEP_KEY,
        position: after.position + 1,
        type: "MATRIX",
        required: true,
        config: { rowsFrom: "product_categories", multiple: false },
        translations: {
          create: LOCALES.map((locale) => ({ locale, title: TITLE[locale], description: DESCRIPTION[locale], references: REFERENCES[locale] })),
        },
        options: {
          create: OPTIONS.map((o, position) => ({
            key: o.key,
            position,
            translations: { create: LOCALES.map((locale) => ({ locale, label: o.label[locale], description: o.description[locale] })) },
          })),
        },
        suggestions: {
          create: SUGGESTIONS.map((sg) => ({
            optionKey: sg.optionKey,
            priority: sg.priority,
            condition: sg.condition,
            translations: { create: LOCALES.map((locale) => ({ locale, message: sg.message[locale] })) },
          })),
        },
      },
    });
  });
  log.push(`${STEP_KEY} aggiunto in posizione ${after.position + 2} (dopo '${AFTER}'), ${OPTIONS.length} risposte, ${SUGGESTIONS.length} consigli`);
  return log;
}
