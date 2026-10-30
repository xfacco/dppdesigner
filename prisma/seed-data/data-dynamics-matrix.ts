import { anyCategory, type CategoryMatrixSpec } from "./apply-category-matrix";

/**
 * "I dati del prodotto sono statici o dinamici?" per categoria, una risposta per riga.
 * Consigli indicativi; il caso batterie si basa sul Regolamento (UE) 2023/1542.
 */
export const dataDynamicsMatrix: CategoryMatrixSpec = {
  stepKey: "data_dynamics",
  multiple: false,
  title: {
    it: "Per ciascuna categoria, i dati del prodotto sono statici o dinamici?",
    en: "For each category, is the product data static or dynamic?",
  },
  description: {
    it: "Statici: definiti alla produzione e non cambiano (es. composizione). Dinamici: cambiano durante la vita del prodotto (es. riparazioni, stato di salute, proprietari).",
    en: "Static: set at production and unchanged (e.g. composition). Dynamic: they change during the product's life (e.g. repairs, state of health, owners).",
  },
  suggestions: [
    {
      optionKey: "mixed",
      priority: 5,
      condition: anyCategory(["battery_lmt", "battery_ev", "battery_industrial"]),
      message: {
        it: "**Batterie EV, LMT e industriali**: il passaporto ha una parte statica (composizione, impronta di carbonio) e una dinamica, come lo stato di salute, da aggiornare durante la vita della batteria (Reg. (UE) 2023/1542, art. 14 e Allegato XIII).",
        en: "**EV, LMT and industrial batteries**: the passport has a static part (composition, carbon footprint) and a dynamic one, such as state of health, to be updated during the battery's life (Regulation (EU) 2023/1542, Article 14 and Annex XIII).",
      },
    },
    {
      optionKey: "mixed",
      priority: 4,
      condition: anyCategory(["elec_mobile", "elec_computers", "elec_appliances", "elec_displays", "elec_other"]),
      message: {
        it: "**Elettronica**: specifiche e composizione sono statiche; riparazioni, ricambi sostituiti e aggiornamenti software rendono una parte dei dati dinamica.",
        en: "**Electronics**: specifications and composition are static; repairs, replaced parts and software updates make part of the data dynamic.",
      },
    },
    {
      optionKey: "mixed",
      priority: 3,
      condition: anyCategory(["tyres_commercial"]),
      message: {
        it: "**Pneumatici per veicoli commerciali**: con la ricostruzione alcuni dati cambiano durante la vita del pneumatico.",
        en: "**Commercial vehicle tyres**: with retreading some data changes during the tyre's life.",
      },
    },
    {
      optionKey: "static",
      priority: 2,
      condition: anyCategory([
        "textile_apparel",
        "textile_footwear",
        "textile_home",
        "textile_accessories",
        "furn_furniture",
        "furn_mattresses",
        "metal_steel",
        "metal_aluminium",
        "constr_materials",
        "tyres_car",
      ]),
      message: {
        it: "Per questa categoria i dati sono di norma **statici**, fissati alla produzione. Scegli Entrambi se vuoi registrare riparazioni, rivendite o altri eventi successivi.",
        en: "For this category data is usually **static**, set at production. Choose Both if you want to record repairs, resales or other later events.",
      },
    },
  ],
};
