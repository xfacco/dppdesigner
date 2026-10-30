import { z } from "zod";

/**
 * Collegamento tra gli step del wizard e le parti degli schemi del riepilogo.
 * Modificabile per versione da Admin → Wizard → versione → "Schemi del riepilogo".
 */

const stepKey = z.string().regex(/^[a-z][a-z0-9_]{0,49}$/);
const keyList = z.array(z.string().min(1));

export const diagramConfigSchema = z
  .object({
    /** Ruolo → chiave dello step che lo alimenta */
    steps: z
      .object({
        sources: stepKey,
        organization: stepKey,
        hosting: stepKey,
        carrierPresence: stepKey,
        carrierType: stepKey,
        urlScheme: stepKey,
        granularity: stepKey,
        categories: stepKey,
        dataModel: stepKey,
        dynamics: stepKey,
        maintenance: stepKey,
        registry: stepKey,
        product: stepKey,
        skuCount: stepKey,
      })
      .partial(),
    /** Gruppo → chiavi delle opzioni che ne fanno parte */
    options: z
      .object({
        supplierFiles: keyList,
        pdfFiles: keyList,
        supplierApi: keyList,
        internalSystems: keyList,
        manualEntry: keyList,
        centralized: keyList,
        disorganized: keyList,
        hostingUndecided: keyList,
        registryPlanned: keyList,
        noCarrier: keyList,
        dynamicData: keyList,
        needsMaintenance: keyList,
        unknown: keyList,
      })
      .partial(),
    /** Numero di SKU oltre il quale il middle layer mostra code ed elaborazione asincrona */
    largeCatalog: z.number().int().positive(),
    /** Blueprint del DPP: aree (in ordine) con gli step che contengono e titoli brevi delle schede */
    blueprint: z
      .object({
        sections: z.array(z.object({ key: stepKey, steps: z.array(stepKey) }).strict()),
        shortTitles: z.record(stepKey, z.object({ it: z.string().min(1), en: z.string().min(1) }).partial()),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type DiagramConfigInput = z.infer<typeof diagramConfigSchema>;

export const DEFAULT_DIAGRAM_CONFIG = {
  steps: {
    sources: "data_sources",
    organization: "data_organization",
    hosting: "hosting",
    carrierPresence: "qr_presence",
    carrierType: "qr_code_type",
    urlScheme: "url_scheme",
    granularity: "dpp_granularity",
    categories: "product_categories",
    dataModel: "data_model",
    dynamics: "data_dynamics",
    maintenance: "maintenance",
    registry: "registry_integration",
    product: "sample_product",
    skuCount: "sku_count",
  },
  options: {
    supplierFiles: ["suppliers_excel", "suppliers_pdf"],
    pdfFiles: ["suppliers_pdf"],
    supplierApi: ["suppliers_api"],
    internalSystems: ["erp", "mes", "plm"],
    manualEntry: ["manual"],
    centralized: ["centralized"],
    disorganized: ["unorganized"],
    hostingUndecided: ["undecided"],
    registryPlanned: ["direct", "via_provider"],
    noCarrier: ["none"],
    dynamicData: ["dynamic", "mixed"],
    needsMaintenance: ["yes", "depends"],
    unknown: ["unsure", "unknown"],
  },
  largeCatalog: 1000,
  blueprint: {
    sections: [
      { key: "company", steps: ["industry", "industry_other", "company_type", "production_model", "dpp_owner", "sku_count"] },
      { key: "product", steps: ["product_categories", "sample_product", "dpp_granularity", "maintenance", "data_dynamics"] },
      { key: "data", steps: ["data_sources", "supplier_count", "data_organization", "data_model"] },
      { key: "identification", steps: ["qr_presence", "carrier_placement", "qr_code_type", "url_scheme"] },
      { key: "infrastructure", steps: ["hosting", "data_access", "registry_integration"] },
    ],
    shortTitles: {} as Record<string, { it?: string; en?: string }>,
  },
};

export type DiagramConfig = typeof DEFAULT_DIAGRAM_CONFIG;

/** Configurazione completa: quella salvata nella versione sovrascrive i valori predefiniti. */
export function resolveDiagramConfig(raw: unknown): DiagramConfig {
  const parsed = diagramConfigSchema.safeParse(raw ?? {});
  const c = parsed.success ? parsed.data : {};
  return {
    steps: { ...DEFAULT_DIAGRAM_CONFIG.steps, ...c.steps },
    options: { ...DEFAULT_DIAGRAM_CONFIG.options, ...c.options },
    largeCatalog: c.largeCatalog ?? DEFAULT_DIAGRAM_CONFIG.largeCatalog,
    blueprint: {
      sections: c.blueprint?.sections ?? DEFAULT_DIAGRAM_CONFIG.blueprint.sections,
      shortTitles: { ...DEFAULT_DIAGRAM_CONFIG.blueprint.shortTitles, ...c.blueprint?.shortTitles },
    },
  };
}

/** Descrizione dei ruoli, mostrata nell'admin. */
export const STEP_ROLE_LABELS: Record<keyof DiagramConfig["steps"], string> = {
  sources: "Fonti dei dati (colonna 1 del flusso)",
  organization: "Organizzazione dei dati (decide se serve il middle layer)",
  hosting: "Piattaforma / data host",
  carrierPresence: "Presenza del data carrier",
  carrierType: "Requisiti del data carrier",
  urlScheme: "Schema dell'identificativo e dell'URL",
  granularity: "Livello del passaporto (modello / lotto / singolo)",
  categories: "Categorie di prodotto",
  dataModel: "Informazioni disponibili (arricchimento e contenuto del passaporto)",
  dynamics: "Dati statici o dinamici (storico, code dati)",
  maintenance: "Manutenzione e riparazioni",
  registry: "Integrazione con il Registro UE",
  product: "Prodotto di esempio (campo name)",
  skuCount: "Numero di SKU",
};
