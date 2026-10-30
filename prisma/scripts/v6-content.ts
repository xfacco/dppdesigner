/**
 * Miglioramenti dei contenuti della bozza v6 (concordati con il cliente):
 * - correzioni: regola orfana su qr_code_type, area "Processi" ribilanciata, "Registro UE", codice prodotto
 * - testi: descrizioni di step e opzioni, nuove informazioni disponibili, "Specifica il settore"
 * - nuove domande: responsabile DPP, numero di fornitori, accessi al passaporto, posizione del data carrier
 * - punteggio e raccomandazioni
 * L'ordine degli step esistenti non cambia; le nuove domande sono inserite vicino agli step correlati.
 *
 *   npx tsx prisma/scripts/v6-content.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const VERSION_NUMBER = 6;
const LOCALES = ["it", "en"] as const;
type T = { it: string; en: string };
type Tx = Prisma.TransactionClient;
const log: string[] = [];

const ESPR_IT = "[Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj/ita)";
const ESPR_EN = "[Regulation (EU) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj)";
const BATT_IT = "[Regolamento (UE) 2023/1542 (Batterie)](https://eur-lex.europa.eu/eli/reg/2023/1542/oj/ita)";
const BATT_EN = "[Regulation (EU) 2023/1542 (Batteries)](https://eur-lex.europa.eu/eli/reg/2023/1542/oj)";
const BATTERY_PASSPORT = ["battery_lmt", "battery_ev", "battery_industrial"];

// ─── Nuove domande ───

type NewStep = {
  key: string;
  after: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TEXT";
  required: boolean;
  visibleIf?: object;
  config?: object;
  title: T;
  description?: T;
  references?: T;
  options?: { key: string; label: T; description?: T; visibleIf?: object }[];
  suggestions?: { optionKey: string | null; priority: number; condition: object; message: T }[];
};

const NEW_STEPS: NewStep[] = [
  {
    key: "industry_other",
    after: "industry",
    type: "TEXT",
    required: false,
    visibleIf: { step: "industry", op: "eq", value: "other" },
    config: { maxLength: 80 },
    title: { it: "Specifica il settore", en: "Specify the industry" },
    description: {
      it: "Ci aiuta a capire quali atti delegati potrebbero riguardarvi.",
      en: "It helps us understand which delegated acts may apply to you.",
    },
  },
  {
    key: "dpp_owner",
    after: "production_model",
    type: "SINGLE_CHOICE",
    required: true,
    title: { it: "Chi è responsabile del progetto DPP in azienda?", en: "Who owns the DPP project in your company?" },
    description: {
      it: "Il passaporto coinvolge prodotto, qualità, IT e fornitori: serve una persona o una funzione che ne guidi il progetto.",
      en: "The passport involves product, quality, IT and suppliers: a person or function needs to lead the project.",
    },
    options: [
      { key: "sustainability", label: { it: "Sostenibilità / ESG", en: "Sustainability / ESG" } },
      { key: "quality", label: { it: "Qualità e compliance", en: "Quality and compliance" } },
      { key: "it", label: { it: "IT / sistemi informativi", en: "IT / information systems" } },
      { key: "product", label: { it: "Prodotto / R&D", en: "Product / R&D" } },
      { key: "undefined", label: { it: "Non ancora definito", en: "Not defined yet" } },
    ],
  },
  {
    key: "supplier_count",
    after: "data_sources",
    type: "SINGLE_CHOICE",
    required: true,
    title: { it: "Quanti fornitori dovranno fornirvi dati per il passaporto?", en: "How many suppliers will need to provide data for the passport?" },
    description: {
      it: "Più sono i fornitori, più conta avere un formato standard e un canale strutturato per raccogliere i dati.",
      en: "The more suppliers, the more a standard format and a structured channel to collect data matter.",
    },
    options: [
      { key: "none", label: { it: "Nessuno: i dati sono tutti interni", en: "None: all data is internal" } },
      { key: "1_10", label: { it: "Da 1 a 10", en: "1 to 10" } },
      { key: "11_50", label: { it: "Da 11 a 50", en: "11 to 50" } },
      { key: "over_50", label: { it: "Oltre 50", en: "More than 50" } },
    ],
  },
  {
    key: "carrier_placement",
    after: "qr_presence",
    type: "SINGLE_CHOICE",
    required: true,
    title: { it: "Dove verrà applicato il data carrier?", en: "Where will the data carrier be applied?" },
    description: {
      it: "La posizione ha un impatto su produzione, packaging ed etichette.",
      en: "The position affects production, packaging and labels.",
    },
    references: {
      it: `- ${ESPR_IT}: il data carrier può trovarsi **sul prodotto, sull'imballaggio o sulla documentazione** che lo accompagna; l'atto delegato del gruppo di prodotto indica dove.\n- **Batterie**: ${BATT_IT}, art. 13: il QR code va stampato o inciso sulla batteria (o, se non possibile, sull'imballaggio e sui documenti).`,
      en: `- ${ESPR_EN}: the data carrier may be placed **on the product, its packaging or accompanying documentation**; the product group's delegated act says where.\n- **Batteries**: ${BATT_EN}, Article 13: the QR code must be printed or engraved on the battery (or, where not possible, on the packaging and documents).`,
    },
    options: [
      { key: "product", label: { it: "Sul prodotto", en: "On the product" } },
      { key: "packaging", label: { it: "Sull'imballaggio", en: "On the packaging" } },
      { key: "documentation", label: { it: "Sulla documentazione", en: "On the documentation" } },
      { key: "unsure", label: { it: "Non lo so", en: "I don't know" } },
    ],
    suggestions: [
      {
        optionKey: "product",
        priority: 5,
        condition: { step: "product_categories", op: "includes", value: ["battery_portable", "battery_lmt", "battery_ev", "battery_industrial", "battery_sli"] },
        message: {
          it: "**Batterie**: il QR code va di norma stampato o inciso sulla batteria stessa (Reg. (UE) 2023/1542, art. 13).",
          en: "**Batteries**: the QR code is normally printed or engraved on the battery itself (Regulation (EU) 2023/1542, Article 13).",
        },
      },
    ],
  },
  {
    key: "data_access",
    after: "hosting",
    type: "MULTI_CHOICE",
    required: true,
    title: { it: "Chi deve poter consultare o aggiornare il passaporto?", en: "Who must be able to view or update the passport?" },
    description: {
      it: "Il passaporto prevede livelli di accesso diversi: alcune informazioni sono pubbliche, altre riservate a specifici operatori.",
      en: "The passport has different access levels: some information is public, other information is restricted to specific operators.",
    },
    references: {
      it: `- ${ESPR_IT}: l'accesso alle informazioni del passaporto può essere **differenziato per tipo di soggetto** (consumatori, operatori economici, riparatori, riciclatori, autorità); l'atto delegato stabilisce chi può accedere a cosa e chi può aggiornarlo.`,
      en: `- ${ESPR_EN}: access to passport information may be **differentiated by type of actor** (consumers, economic operators, repairers, recyclers, authorities); the delegated act sets who can access what and who can update it.`,
    },
    options: [
      { key: "consumers", label: { it: "Consumatori", en: "Consumers" } },
      { key: "b2b", label: { it: "Clienti e partner B2B", en: "B2B customers and partners" } },
      { key: "repairers", label: { it: "Riparatori e manutentori", en: "Repairers and maintainers" } },
      { key: "recyclers", label: { it: "Riciclatori e gestori di fine vita", en: "Recyclers and end-of-life operators" } },
      { key: "authorities", label: { it: "Autorità di vigilanza e dogane", en: "Market surveillance authorities and customs" } },
    ],
    suggestions: [
      {
        optionKey: "repairers",
        priority: 3,
        condition: { step: "maintenance", op: "includes", value: ["yes", "depends"] },
        message: {
          it: "Avete indicato prodotti con manutenzione: i **riparatori** avranno bisogno di accedere alle informazioni di riparazione e, a seconda del settore, di registrare gli interventi.",
          en: "You indicated products with maintenance: **repairers** will need access to repair information and, depending on the sector, to record their work.",
        },
      },
    ],
  },
];

// ─── Descrizioni di step e opzioni esistenti ───

const STEP_DESCRIPTIONS: Record<string, T> = {
  company_type: {
    it: "Chi immette il prodotto sul mercato UE ha la responsabilità del passaporto. Un brand che fa produrre a terzi con il proprio marchio è di norma considerato fabbricante. Puoi selezionare più ruoli.",
    en: "Whoever places the product on the EU market is responsible for the passport. A brand having products made by third parties under its own name is usually considered the manufacturer. You can select more than one role.",
  },
  data_sources: {
    it: "Indica tutte le fonti da cui oggi arrivano le informazioni sul prodotto: sistemi interni e fornitori.",
    en: "Indicate all the sources the product information comes from today: internal systems and suppliers.",
  },
  qr_presence: {
    it: "Il data carrier (es. QR code) collega il prodotto fisico al suo passaporto. Può trovarsi sul prodotto, sull'imballaggio o sulla documentazione.",
    en: "The data carrier (e.g. a QR code) links the physical product to its passport. It can be on the product, its packaging or the documentation.",
  },
  hosting: {
    it: "Il passaporto deve restare disponibile per tutta la vita del prodotto, anche se cambiano fornitore o azienda.",
    en: "The passport must remain available for the whole product life, even if the provider or the company changes.",
  },
};

const OPTION_DESCRIPTIONS: Record<string, Record<string, T>> = {
  data_sources: {
    erp: { it: "Gestionale aziendale: anagrafiche, acquisti, ordini.", en: "Company management system: master data, purchasing, orders." },
    mes: { it: "Sistema che governa la produzione in reparto: lotti, macchine, tempi.", en: "System running production on the shop floor: batches, machines, times." },
    plm: { it: "Gestione del ciclo di vita del prodotto: distinte, specifiche, progetti.", en: "Product lifecycle management: bills of materials, specifications, designs." },
    suppliers_api: { it: "I fornitori inviano i dati in automatico o li inseriscono in un portale.", en: "Suppliers send data automatically or enter it in a portal." },
  },
  hosting: {
    proprietary: { it: "Sviluppata e gestita internamente o su misura.", en: "Developed and run in-house or custom-built." },
    saas: { it: "Piattaforma pronta all'uso, in abbonamento.", en: "Ready-to-use platform, by subscription." },
    paas: { it: "Servizi cloud su cui sviluppare la vostra soluzione.", en: "Cloud services on which to build your own solution." },
  },
  url_scheme: {
    gs1_digital_link: {
      it: "Standard che codifica il codice prodotto (GTIN) in un indirizzo web leggibile da QR code.",
      en: "Standard that encodes the product code (GTIN) in a web address readable from a QR code.",
    },
    own_domain: { it: "Indirizzi sul dominio aziendale, con uno schema definito da voi.", en: "Addresses on your company domain, with a scheme you define." },
  },
};

const NEW_DATA_MODEL_OPTIONS: { key: string; label: T; visibleIf?: object }[] = [
  { key: "substances", label: { it: "Sostanze preoccupanti", en: "Substances of concern" } },
  { key: "recycled_content", label: { it: "Contenuto riciclato", en: "Recycled content" } },
  { key: "durability", label: { it: "Durabilità e prestazioni", en: "Durability and performance" } },
  { key: "instructions", label: { it: "Istruzioni d'uso e sicurezza", en: "Use and safety instructions" } },
  {
    key: "state_of_health",
    label: { it: "Stato di salute della batteria", en: "Battery state of health" },
    visibleIf: { step: "industry", op: "eq", value: "battery" },
  },
];

// ─── Funzioni ───

async function stepByKey(tx: Tx, versionId: string, key: string) {
  return tx.step.findUnique({ where: { versionId_key: { versionId, key } }, include: { options: true, translations: true } });
}

async function addNewSteps(tx: Tx, versionId: string) {
  for (const s of NEW_STEPS) {
    if (await stepByKey(tx, versionId, s.key)) {
      log.push(`step ${s.key} già presente`);
      continue;
    }
    const created = await tx.step.create({
      data: {
        versionId,
        key: s.key,
        type: s.type,
        required: s.required,
        position: 9999, // riordinato in fondo alla funzione
        visibleIf: s.visibleIf,
        config: s.config,
        translations: {
          create: LOCALES.map((l) => ({
            locale: l,
            title: s.title[l],
            description: s.description?.[l],
            references: s.references?.[l],
          })),
        },
        options: {
          create: (s.options ?? []).map((o, i) => ({
            key: o.key,
            position: i,
            visibleIf: o.visibleIf,
            translations: { create: LOCALES.map((l) => ({ locale: l, label: o.label[l], description: o.description?.[l] })) },
          })),
        },
        suggestions: {
          create: (s.suggestions ?? []).map((g) => ({
            optionKey: g.optionKey,
            priority: g.priority,
            condition: g.condition,
            translations: { create: LOCALES.map((l) => ({ locale: l, message: g.message[l] })) },
          })),
        },
      },
    });
    log.push(`nuova domanda: ${s.key}`);
    void created;
  }

  // Ordine: quello attuale, con ogni nuova domanda subito dopo lo step indicato
  const steps = await tx.step.findMany({ where: { versionId }, orderBy: { position: "asc" } });
  const newKeys = new Set(NEW_STEPS.map((s) => s.key));
  const order: string[] = [];
  for (const s of steps.filter((x) => !newKeys.has(x.key))) {
    order.push(s.key);
    for (const n of NEW_STEPS.filter((x) => x.after === s.key)) order.push(n.key);
  }
  for (const n of NEW_STEPS) if (!order.includes(n.key)) order.push(n.key);
  for (const [position, key] of order.entries()) {
    await tx.step.update({ where: { versionId_key: { versionId, key } }, data: { position } });
  }
  log.push(`ordine aggiornato: ${order.length} step`);
}

async function improveTexts(tx: Tx, versionId: string) {
  for (const [key, desc] of Object.entries(STEP_DESCRIPTIONS)) {
    const step = await stepByKey(tx, versionId, key);
    if (!step) continue;
    for (const l of LOCALES) {
      await tx.stepTranslation.updateMany({ where: { stepId: step.id, locale: l }, data: { description: desc[l] } });
    }
  }
  log.push(`descrizioni aggiornate: ${Object.keys(STEP_DESCRIPTIONS).join(", ")}`);

  for (const [key, opts] of Object.entries(OPTION_DESCRIPTIONS)) {
    const step = await stepByKey(tx, versionId, key);
    if (!step) continue;
    for (const [optKey, desc] of Object.entries(opts)) {
      const o = step.options.find((x) => x.key === optKey);
      if (!o) continue;
      for (const l of LOCALES) {
        await tx.optionTranslation.updateMany({ where: { optionId: o.id, locale: l }, data: { description: desc[l] } });
      }
    }
  }
  log.push("descrizioni delle opzioni aggiunte (fonti, hosting, schema identificativo)");

  const dataModel = await stepByKey(tx, versionId, "data_model");
  if (dataModel) {
    let pos = Math.max(-1, ...dataModel.options.map((o) => o.position));
    for (const o of NEW_DATA_MODEL_OPTIONS) {
      if (dataModel.options.some((x) => x.key === o.key)) continue;
      await tx.option.create({
        data: {
          stepId: dataModel.id,
          key: o.key,
          position: ++pos,
          visibleIf: o.visibleIf,
          translations: { create: LOCALES.map((l) => ({ locale: l, label: o.label[l] })) },
        },
      });
    }
    log.push("informazioni disponibili: aggiunte sostanze, contenuto riciclato, durabilità, istruzioni, stato di salute (batterie)");
  }
}

async function fixProblems(tx: Tx, versionId: string) {
  // 1. Regola orfana su qr_code_type (step eliminato)
  const rules = await tx.scoringRule.findMany({ where: { versionId } });
  const orphan = rules.filter((r) => JSON.stringify(r.condition).includes('"qr_code_type"'));
  for (const r of orphan) await tx.scoringRule.delete({ where: { id: r.id } });
  log.push(`regole orfane eliminate: ${orphan.length}`);

  // 4. "Registry UE" → "Registro UE" nei testi italiani (il nome della pagina "DPP Registry" resta)
  const fix = (s: string | null) => (s ? s.replace(/Registry UE/g, "Registro UE").replace(/\bil Registry\b/g, "il Registro") : s);
  for (const t of await tx.stepTranslation.findMany({ where: { locale: "it", step: { versionId } } })) {
    const next = { title: fix(t.title)!, description: fix(t.description), references: fix(t.references) };
    if (next.title !== t.title || next.description !== t.description || next.references !== t.references) {
      await tx.stepTranslation.update({ where: { id: t.id }, data: next });
    }
  }
  for (const t of await tx.recommendationTranslation.findMany({ where: { locale: "it", recommendation: { versionId } } })) {
    const next = { title: fix(t.title)!, body: fix(t.body)! };
    if (next.title !== t.title || next.body !== t.body) await tx.recommendationTranslation.update({ where: { id: t.id }, data: next });
  }
  log.push('"Registry UE" sostituito con "Registro UE" nei testi italiani');

  // 5. Prodotto di esempio: il campo "Categoria" diventa "Codice prodotto (SKU o GTIN)"
  const sample = await stepByKey(tx, versionId, "sample_product");
  const cfg = (sample?.config ?? {}) as { fields?: { key: string; type: string; required?: boolean; label: Record<string, string> }[] };
  if (sample && cfg.fields?.some((f) => f.key === "category")) {
    cfg.fields = cfg.fields.map((f) =>
      f.key === "category"
        ? { key: "code", type: "text", required: false, label: { it: "Codice prodotto (SKU o GTIN)", en: "Product code (SKU or GTIN)" } }
        : f,
    );
    await tx.step.update({ where: { id: sample.id }, data: { config: cfg as Prisma.InputJsonValue } });
    log.push('prodotto di esempio: "Categoria" sostituito da "Codice prodotto (SKU o GTIN)"');
  }
}

async function rebalanceScoring(tx: Tx, versionId: string) {
  const areas = await tx.scoringArea.findMany({ where: { versionId } });
  const area = (key: string) => areas.find((a) => a.key === key)!.id;
  const rules = await tx.scoringRule.findMany({ where: { versionId } });
  const find = (step: string) => rules.filter((r) => JSON.stringify(r.condition).includes(`"${step}"`));

  // Processi: produzione (3) oppure fornitori con API per chi non produce (3) + responsabile (3) + carrier (2) + livello definito (2) = 10
  for (const r of find("qr_presence")) await tx.scoringRule.update({ where: { id: r.id }, data: { points: 2 } });
  for (const r of find("dpp_granularity")) {
    await tx.scoringRule.update({
      where: { id: r.id },
      data: {
        condition: { all: [{ step: "dpp_granularity", op: "answered" }, { step: "dpp_granularity", op: "excludes", value: "unsure" }] },
        note: "Livello definito per tutte le categorie (nessun «Non lo so»)",
      },
    });
  }
  const newRules = [
    {
      areaId: area("process"),
      points: 3,
      note: "Chi non produce: fornitori collegati via API o portale",
      condition: {
        all: [
          { step: "company_type", op: "excludes", value: ["manufacturer", "other"] },
          { step: "data_sources", op: "includes", value: "suppliers_api" },
        ],
      },
    },
    {
      areaId: area("process"),
      points: 3,
      note: "Responsabile del progetto definito",
      condition: { all: [{ step: "dpp_owner", op: "answered" }, { step: "dpp_owner", op: "neq", value: "undefined" }] },
    },
    // Tecnologia: hosting (4) + Registro (3) + accessi (2) + schema identificativo (1) = 10
    {
      areaId: area("technology"),
      points: 2,
      note: "Accessi differenziati oltre ai consumatori",
      condition: { step: "data_access", op: "includes", value: ["b2b", "repairers", "recyclers", "authorities"] },
    },
  ];
  for (const r of newRules) {
    const exists = rules.some((x) => x.note === r.note);
    if (!exists) await tx.scoringRule.create({ data: { ...r, versionId } });
  }
  for (const r of find("registry_integration")) await tx.scoringRule.update({ where: { id: r.id }, data: { points: 3 } });
  for (const r of find("url_scheme")) await tx.scoringRule.update({ where: { id: r.id }, data: { points: 1 } });
  log.push("punteggio: Processi e Tecnologia ribilanciati (massimo 10 raggiungibile da tutti i tipi di azienda)");

  const recs = await tx.recommendation.findMany({ where: { versionId }, include: { translations: true } });
  const NEW_RECS: { key: string; priority: number; condition: object; title: T; body: T }[] = [
    {
      key: "owner",
      priority: 8,
      condition: { step: "dpp_owner", op: "eq", value: "undefined" },
      title: { it: "Nomina un responsabile del progetto DPP", en: "Appoint a DPP project owner" },
      body: {
        it: "Il passaporto coinvolge prodotto, qualità, IT e fornitori: senza una persona che coordini, le decisioni restano ferme. Definisci un responsabile e un piccolo gruppo di lavoro.",
        en: "The passport involves product, quality, IT and suppliers: without someone coordinating, decisions stall. Appoint an owner and a small working group.",
      },
    },
    {
      key: "supplier_portal",
      priority: 7,
      condition: {
        all: [
          { step: "supplier_count", op: "in", value: ["11_50", "over_50"] },
          { step: "data_sources", op: "includes", value: ["suppliers_excel", "suppliers_pdf"] },
        ],
      },
      title: { it: "Introduci un portale o un formato standard per i fornitori", en: "Introduce a portal or standard format for suppliers" },
      body: {
        it: "Con molti fornitori, file Excel e PDF diventano ingestibili: un portale o un template unico riduce errori e tempi di raccolta.",
        en: "With many suppliers, Excel files and PDFs become unmanageable: a portal or a single template reduces errors and collection time.",
      },
    },
    {
      key: "granularity_unsure",
      priority: 5,
      condition: { step: "dpp_granularity", op: "includes", value: "unsure" },
      title: { it: "Chiarisci il livello del passaporto", en: "Clarify the passport level" },
      body: {
        it: "Per almeno una categoria non è chiaro se il passaporto sarà per modello, lotto o singolo prodotto. È una scelta che incide su identificativi, data carrier e costi: verificala sull'atto delegato del settore.",
        en: "For at least one category it is unclear whether the passport will be per model, batch or item. This choice affects identifiers, data carriers and costs: check it against the sector's delegated act.",
      },
    },
  ];
  for (const r of NEW_RECS) {
    if (recs.some((x) => x.translations.some((t) => t.locale === "it" && t.title === r.title.it))) continue;
    await tx.recommendation.create({
      data: {
        versionId,
        priority: r.priority,
        condition: r.condition,
        translations: { create: LOCALES.map((l) => ({ locale: l, title: r.title[l], body: r.body[l] })) },
      },
    });
  }
  log.push("raccomandazioni aggiunte: responsabile, portale fornitori, livello del passaporto");
}

async function main() {
  const version = await db.wizardVersion.findUniqueOrThrow({ where: { number: VERSION_NUMBER } });
  if (version.status !== "DRAFT") throw new Error(`La versione ${VERSION_NUMBER} non è una bozza`);
  await db.$transaction(
    async (tx) => {
      await fixProblems(tx, version.id);
      await improveTexts(tx, version.id);
      await addNewSteps(tx, version.id);
      await rebalanceScoring(tx, version.id);
    },
    { timeout: 60_000 },
  );
  for (const l of log) console.log(`v${VERSION_NUMBER}: ${l}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
