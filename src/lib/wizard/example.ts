import type { Answers } from "./rules";

/**
 * Risposte di un'azienda di esempio, per mostrare nella pagina "Progetta" che cosa si ottiene alla
 * fine (Blueprint, Flusso dei dati, prossimi passi). Sono calcolati con il wizard pubblicato, come nel
 * riepilogo vero: chiavi di step o opzioni che non esistono più vengono semplicemente ignorate.
 *
 * Esempio: produttore di batterie per e-bike, passaporto per singola batteria (Reg. UE 2023/1542).
 */
export function exampleAnswers(locale: string): Answers {
  return {
    industry: "battery",
    product_categories: ["battery_lmt"],
    company_type: ["manufacturer"],
    production_model: "both",
    dpp_owner: "quality",
    dpp_granularity: { battery_lmt: ["item"] },
    maintenance: { battery_lmt: ["yes"] },
    dpp_versioning: { battery_lmt: ["history_linked"] },
    data_dynamics: { battery_lmt: ["mixed"] },
    data_sources: ["erp", "mes", "suppliers_excel"],
    supplier_count: "11_50",
    data_organization: "decentralized",
    data_model: ["materials", "origin", "sustainability", "end_of_life", "compliance_docs", "repair_info", "state_of_health", "recycled_content"],
    qr_presence: "qr",
    carrier_placement: "product",
    url_scheme: "gs1_digital_link",
    hosting: "saas",
    data_access: ["consumers", "b2b", "repairers", "recyclers", "authorities"],
    registry_integration: "via_provider",
    sku_count: 40,
    sample_product: {
      name: locale === "en" ? "E-bike battery 500 Wh" : "Batteria e-bike 500 Wh",
      code: "EB-500",
      main_materials: locale === "en" ? "Li-ion NMC cells, aluminium casing" : "Celle Li-ion NMC, involucro in alluminio",
    },
  } as Answers;
}
