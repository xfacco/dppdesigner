/**
 * Step "Categorie di prodotto" (opzioni filtrate per industry) e suggerimenti
 * sul livello del passaporto (step dpp_granularity) in base alle categorie scelte.
 * Solo il caso batterie è un obbligo di legge; gli altri sono indicazioni da
 * confermare con gli atti delegati.
 */

type T = { it: string; en: string };
const onIndustry = (industry: string) => ({ step: "industry", op: "eq", value: industry });
const anyOf = (keys: string[]) => ({ step: "product_categories", op: "includes", value: keys });

const categories: { key: string; industry: string; label: T }[] = [
  { key: "battery_portable", industry: "battery", label: { it: "Batterie portatili", en: "Portable batteries" } },
  {
    key: "battery_lmt",
    industry: "battery",
    label: { it: "Batterie per mezzi di trasporto leggeri (e-bike, monopattini)", en: "Light means of transport batteries (e-bikes, scooters)" },
  },
  { key: "battery_ev", industry: "battery", label: { it: "Batterie per veicoli elettrici", en: "Electric vehicle batteries" } },
  { key: "battery_industrial", industry: "battery", label: { it: "Batterie industriali oltre 2 kWh", en: "Industrial batteries above 2 kWh" } },
  {
    key: "battery_sli",
    industry: "battery",
    label: { it: "Batterie di avviamento, illuminazione e accensione (SLI)", en: "Starting, lighting and ignition (SLI) batteries" },
  },
  { key: "textile_apparel", industry: "textile", label: { it: "Abbigliamento", en: "Apparel" } },
  { key: "textile_footwear", industry: "textile", label: { it: "Calzature", en: "Footwear" } },
  { key: "textile_home", industry: "textile", label: { it: "Tessili per la casa", en: "Home textiles" } },
  { key: "textile_accessories", industry: "textile", label: { it: "Accessori (borse, cinture…)", en: "Accessories (bags, belts…)" } },
  { key: "elec_mobile", industry: "electronics", label: { it: "Smartphone e tablet", en: "Smartphones and tablets" } },
  { key: "elec_computers", industry: "electronics", label: { it: "Computer e server", en: "Computers and servers" } },
  { key: "elec_appliances", industry: "electronics", label: { it: "Elettrodomestici", en: "Household appliances" } },
  { key: "elec_displays", industry: "electronics", label: { it: "Display e TV", en: "Displays and TVs" } },
  { key: "elec_other", industry: "electronics", label: { it: "Altri apparecchi elettronici", en: "Other electronic equipment" } },
  { key: "furn_furniture", industry: "furniture", label: { it: "Mobili", en: "Furniture" } },
  { key: "furn_mattresses", industry: "furniture", label: { it: "Materassi", en: "Mattresses" } },
  { key: "metal_steel", industry: "steel_aluminium", label: { it: "Prodotti in ferro e acciaio", en: "Iron and steel products" } },
  { key: "metal_aluminium", industry: "steel_aluminium", label: { it: "Prodotti in alluminio", en: "Aluminium products" } },
  { key: "tyres_car", industry: "tyres", label: { it: "Pneumatici per auto", en: "Car tyres" } },
  {
    key: "tyres_commercial",
    industry: "tyres",
    label: { it: "Pneumatici per veicoli commerciali e industriali", en: "Commercial and industrial vehicle tyres" },
  },
  {
    key: "constr_materials",
    industry: "construction",
    label: { it: "Materiali da costruzione (es. cemento, isolanti, laterizi)", en: "Construction materials (e.g. cement, insulation, bricks)" },
  },
  {
    key: "constr_components",
    industry: "construction",
    label: { it: "Componenti e prodotti prefabbricati", en: "Prefabricated components and products" },
  },
  { key: "other_category", industry: "other", label: { it: "Altra categoria", en: "Other category" } },
];

export const productCategoriesStep = {
  key: "product_categories",
  type: "MULTI_CHOICE" as const,
  title: { it: "Quali categorie di prodotto immettete sul mercato?", en: "Which product categories do you place on the market?" },
  description: {
    it: "Le categorie proposte dipendono dal settore scelto. Puoi selezionarne più di una.",
    en: "The categories shown depend on the industry you chose. You can select more than one.",
  },
  references: {
    it: `- [Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj/ita): requisiti e passaporto sono definiti **per gruppo di prodotto** dagli atti delegati.
- **Batterie**: [Regolamento (UE) 2023/1542](https://eur-lex.europa.eu/eli/reg/2023/1542/oj/ita), art. 77: il passaporto riguarda le batterie per mezzi di trasporto leggeri, le batterie industriali oltre 2 kWh e le batterie per veicoli elettrici.`,
    en: `- [Regulation (EU) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj): requirements and the passport are set **per product group** by delegated acts.
- **Batteries**: [Regulation (EU) 2023/1542](https://eur-lex.europa.eu/eli/reg/2023/1542/oj), Article 77: the passport covers light means of transport batteries, industrial batteries above 2 kWh and electric vehicle batteries.`,
  },
  options: categories.map((c) => ({ key: c.key, label: c.label, visibleIf: onIndustry(c.industry) })),
};

export const granularitySuggestions: { optionKey: string | null; priority: number; condition: object; message: T }[] = [
  {
    optionKey: "item",
    priority: 10,
    condition: anyOf(["battery_lmt", "battery_ev", "battery_industrial"]),
    message: {
      it: "**Batterie per mezzi di trasporto leggeri, veicoli elettrici e industriali oltre 2 kWh**: il Regolamento (UE) 2023/1542 richiede un passaporto per **ogni singola batteria** (art. 77). È un obbligo, non una scelta.",
      en: "**Light means of transport, electric vehicle and industrial batteries above 2 kWh**: Regulation (EU) 2023/1542 requires a passport for **each individual battery** (Article 77). This is an obligation, not a choice.",
    },
  },
  {
    optionKey: null,
    priority: 9,
    condition: anyOf(["battery_portable", "battery_sli"]),
    message: {
      it: "**Batterie portatili e SLI**: il Regolamento Batterie non prevede il passaporto per queste categorie (art. 77). Restano altri obblighi, come etichettatura e QR code (art. 13).",
      en: "**Portable and SLI batteries**: the Battery Regulation does not require a passport for these categories (Article 77). Other obligations still apply, such as labelling and the QR code (Article 13).",
    },
  },
  {
    optionKey: "item",
    priority: 6,
    condition: anyOf(["elec_mobile", "elec_computers", "elec_appliances", "elec_displays", "elec_other"]),
    message: {
      it: "**Elettronica**: prodotti con numero di serie, riparazioni e aggiornamenti durante la vita. Il livello di **singolo prodotto** permette di registrare questi eventi. Indicazione da confermare con l'atto delegato.",
      en: "**Electronics**: serialised products with repairs and updates during their life. The **individual item** level lets you record these events. Indicative, to be confirmed by the delegated act.",
    },
  },
  {
    optionKey: "batch",
    priority: 5,
    condition: anyOf(["metal_steel", "metal_aluminium", "constr_materials"]),
    message: {
      it: "**Acciaio, alluminio e materiali da costruzione**: composizione e impronta ambientale variano da una colata o da un lotto di produzione all'altro, quindi il livello di **lotto** è il più naturale. Indicazione da confermare con l'atto delegato o le specifiche tecniche CPR.",
      en: "**Steel, aluminium and construction materials**: composition and environmental footprint vary from one heat or production batch to another, so the **batch** level is the most natural. Indicative, to be confirmed by the delegated act or CPR technical specifications.",
    },
  },
  {
    optionKey: "batch",
    priority: 4,
    condition: anyOf(["tyres_car", "tyres_commercial"]),
    message: {
      it: "**Pneumatici**: sono già identificati per lotto e settimana di produzione, quindi il livello di **lotto** è un buon punto di partenza. Indicazione da confermare con l'atto delegato.",
      en: "**Tyres**: they are already identified by production batch and week, so the **batch** level is a good starting point. Indicative, to be confirmed by the delegated act.",
    },
  },
  {
    optionKey: "model",
    priority: 3,
    condition: anyOf(["textile_apparel", "textile_footwear", "textile_home", "textile_accessories", "furn_furniture", "furn_mattresses"]),
    message: {
      it: "**Tessile e arredamento**: per prodotti di serie con molte varianti si parte di solito dal livello di **modello**. Il lotto o il singolo prodotto servono se vuoi tracciare provenienza o riparazioni dei singoli pezzi. Indicazione da confermare con l'atto delegato.",
      en: "**Textiles and furniture**: for series products with many variants you usually start at **model** level. Batch or individual item are needed if you want to track provenance or repairs of single pieces. Indicative, to be confirmed by the delegated act.",
    },
  },
  {
    optionKey: null,
    priority: 0,
    condition: { step: "product_categories", op: "answered" },
    message: {
      it: "Il livello definitivo è stabilito dall'atto delegato del gruppo di prodotto. Se hai selezionato più categorie, il livello può essere diverso per ciascuna: il consiglio più vincolante è indicato per primo.",
      en: "The final level is set by the product group's delegated act. If you selected several categories, the level may differ for each: the most binding advice is shown first.",
    },
  },
];
