/**
 * Configurazione iniziale del wizard (versione 1), dall'analisi di business.
 * Le regole di punteggio sono ESEMPI da validare: si modificano dalla dashboard admin.
 */

type T = { it: string; en: string };
type Opt = { key: string; label: T; description?: T; visibleIf?: object };
type StepSeed = {
  key: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "NUMBER" | "TEXT" | "FIELDS";
  title: T;
  description?: T;
  help?: T;
  required?: boolean;
  visibleIf?: object;
  config?: object;
  options?: Opt[];
};

export const steps: StepSeed[] = [
  {
    key: "industry",
    type: "SINGLE_CHOICE",
    title: { it: "In quale settore opera la tua azienda?", en: "Which industry does your company operate in?" },
    description: {
      it: "Gli obblighi e le tempistiche del DPP dipendono dalla categoria di prodotto.",
      en: "DPP obligations and timelines depend on the product category.",
    },
    options: [
      { key: "battery", label: { it: "Batterie", en: "Batteries" } },
      { key: "textile", label: { it: "Tessile e moda", en: "Textile and fashion" } },
      { key: "electronics", label: { it: "Elettronica", en: "Electronics" } },
      { key: "furniture", label: { it: "Arredamento", en: "Furniture" } },
      { key: "steel_aluminium", label: { it: "Ferro, acciaio e alluminio", en: "Iron, steel and aluminium" } },
      { key: "tyres", label: { it: "Pneumatici", en: "Tyres" } },
      { key: "construction", label: { it: "Prodotti da costruzione", en: "Construction products" } },
      { key: "other", label: { it: "Altro", en: "Other" } },
    ],
  },
  {
    key: "company_type",
    type: "MULTI_CHOICE",
    title: { it: "Che tipo di azienda siete?", en: "What type of company are you?" },
    options: [
      { key: "manufacturer", label: { it: "Produttore", en: "Manufacturer" } },
      { key: "brand", label: { it: "Brand", en: "Brand" } },
      { key: "importer", label: { it: "Importatore", en: "Importer" } },
      { key: "distributor", label: { it: "Distributore", en: "Distributor" } },
      { key: "retailer", label: { it: "Rivenditore", en: "Retailer" } },
      { key: "other", label: { it: "Altro", en: "Other" } },
    ],
  },
  {
    key: "production_model",
    type: "SINGLE_CHOICE",
    title: { it: "Producete internamente o vi affidate a fornitori?", en: "Do you manufacture in-house or rely on suppliers?" },
    options: [
      { key: "in_house", label: { it: "Produciamo internamente", en: "We manufacture in-house" } },
      { key: "suppliers", label: { it: "Ci affidiamo a fornitori", en: "We rely on suppliers" } },
      { key: "both", label: { it: "Entrambi", en: "Both" } },
    ],
  },
  {
    key: "sku_count",
    type: "NUMBER",
    title: { it: "Quanti prodotti diversi (SKU) gestite ogni anno?", en: "How many different products (SKUs) do you handle each year?" },
    help: { it: "Una stima è sufficiente.", en: "An estimate is fine." },
    config: { min: 1, max: 10000000 },
  },
  {
    key: "sample_product",
    type: "FIELDS",
    title: { it: "Descrivi un prodotto di esempio", en: "Describe a sample product" },
    description: {
      it: "Useremo questo prodotto come riferimento per il progetto.",
      en: "We will use this product as a reference throughout the journey.",
    },
    config: {
      maxLength: 120,
      fields: [
        { key: "name", type: "text", required: true, label: { it: "Nome commerciale", en: "Commercial name" } },
        { key: "category", type: "text", required: false, label: { it: "Categoria", en: "Category" } },
        { key: "main_materials", type: "text", required: false, label: { it: "Materiali principali", en: "Main materials" } },
      ],
    },
  },
  {
    key: "maintenance",
    type: "SINGLE_CHOICE",
    title: { it: "Il prodotto richiede manutenzione o riparazioni?", en: "Does the product require maintenance or repairs?" },
    options: [
      { key: "yes", label: { it: "Sì", en: "Yes" } },
      { key: "no", label: { it: "No", en: "No" } },
    ],
  },
  {
    key: "data_dynamics",
    type: "SINGLE_CHOICE",
    title: { it: "I dati del prodotto sono statici o dinamici?", en: "Is the product data static or dynamic?" },
    description: {
      it: "Dinamici: cambiano durante la vita del prodotto (es. riparazioni, stato di salute, proprietari).",
      en: "Dynamic: they change during the product's life (e.g. repairs, state of health, owners).",
    },
    options: [
      { key: "static", label: { it: "Statici", en: "Static" } },
      { key: "dynamic", label: { it: "Dinamici", en: "Dynamic" } },
      { key: "mixed", label: { it: "Entrambi", en: "Both" } },
    ],
  },
  {
    key: "data_sources",
    type: "MULTI_CHOICE",
    title: { it: "Da dove arrivano i dati che finiranno nel DPP?", en: "Where does the data for the DPP come from?" },
    options: [
      { key: "suppliers_excel", label: { it: "Fornitori — file Excel o email", en: "Suppliers — Excel files or email" } },
      { key: "suppliers_pdf", label: { it: "Fornitori — documenti PDF", en: "Suppliers — PDF documents" } },
      { key: "suppliers_api", label: { it: "Fornitori — API o portale", en: "Suppliers — API or portal" } },
      { key: "erp", label: { it: "ERP / gestionale", en: "ERP" } },
      { key: "mes", label: { it: "MES (produzione)", en: "MES (manufacturing)" } },
      { key: "plm", label: { it: "PLM (sviluppo prodotto)", en: "PLM (product development)" } },
      { key: "manual", label: { it: "Inserimento manuale", en: "Manual entry" } },
    ],
  },
  {
    key: "data_organization",
    type: "SINGLE_CHOICE",
    title: { it: "Come sono organizzati oggi questi dati?", en: "How is this data organized today?" },
    options: [
      { key: "centralized", label: { it: "Centralizzati in un unico sistema", en: "Centralized in a single system" } },
      { key: "decentralized", label: { it: "Distribuiti su più sistemi", en: "Spread across several systems" } },
      { key: "unorganized", label: { it: "Non organizzati", en: "Not organized" } },
    ],
  },
  {
    key: "data_model",
    type: "MULTI_CHOICE",
    title: { it: "Quali informazioni avete già disponibili?", en: "Which information do you already have?" },
    description: {
      it: "Il modello dati richiesto dipende dall'atto delegato del settore.",
      en: "The required data model depends on the sector's delegated act.",
    },
    required: false,
    options: [
      { key: "materials", label: { it: "Composizione e materiali", en: "Composition and materials" } },
      { key: "origin", label: { it: "Origine e provenienza", en: "Origin and provenance" } },
      { key: "sustainability", label: { it: "Metriche di sostenibilità (es. impronta di carbonio)", en: "Sustainability metrics (e.g. carbon footprint)" } },
      { key: "end_of_life", label: { it: "Istruzioni di fine vita e riciclo", en: "End-of-life and recycling instructions" } },
      { key: "compliance_docs", label: { it: "Documentazione di conformità", en: "Compliance documentation" } },
      {
        key: "repair_info",
        label: { it: "Informazioni di riparazione e ricambi", en: "Repair and spare parts information" },
        visibleIf: { step: "maintenance", op: "eq", value: "yes" },
      },
    ],
  },
  {
    key: "qr_presence",
    type: "SINGLE_CHOICE",
    title: { it: "Sul prodotto è già presente un data carrier?", en: "Does the product already carry a data carrier?" },
    options: [
      { key: "qr", label: { it: "Sì, un QR code", en: "Yes, a QR code" } },
      { key: "other_carrier", label: { it: "Sì, altro (RFID, NFC, …)", en: "Yes, something else (RFID, NFC, …)" } },
      { key: "none", label: { it: "No", en: "No" } },
    ],
  },
  {
    key: "qr_code_type",
    type: "SINGLE_CHOICE",
    title: { it: "Quali requisiti deve rispettare il data carrier?", en: "Which requirements must the data carrier meet?" },
    help: {
      it: "Riferimenti normativi da verificare con il consulente per il tuo settore.",
      en: "Regulatory references to be verified with the consultant for your sector.",
    },
    options: [
      { key: "espr", label: { it: "Requisiti ESPR", en: "ESPR requirements" } },
      {
        key: "battery_regulation",
        label: { it: "Requisiti del Regolamento Batterie (UE) 2023/1542", en: "Battery Regulation (EU) 2023/1542 requirements" },
        visibleIf: { step: "industry", op: "eq", value: "battery" },
      },
      { key: "unsure", label: { it: "Non lo so", en: "I don't know" } },
    ],
  },
  {
    key: "dpp_granularity",
    type: "SINGLE_CHOICE",
    title: { it: "A quale livello serve il passaporto?", en: "At which level is the passport needed?" },
    options: [
      { key: "model", label: { it: "Per modello", en: "Per model" } },
      { key: "batch", label: { it: "Per lotto", en: "Per batch" } },
      { key: "item", label: { it: "Per singolo prodotto", en: "Per individual item" } },
      { key: "unsure", label: { it: "Non lo so", en: "I don't know" } },
    ],
  },
  {
    key: "url_scheme",
    type: "SINGLE_CHOICE",
    title: { it: "Che schema userete per l'identificativo e l'URL?", en: "Which scheme will you use for the identifier and URL?" },
    help: {
      it: "Rif. EN 18219 (identificativi univoci DPP): verificare lo stato della norma.",
      en: "See EN 18219 (DPP unique identifiers): check the standard's status.",
    },
    options: [
      { key: "gs1_digital_link", label: { it: "GS1 Digital Link", en: "GS1 Digital Link" } },
      { key: "own_domain", label: { it: "Schema proprio su dominio aziendale", en: "Own scheme on company domain" } },
      { key: "unsure", label: { it: "Non lo so", en: "I don't know" } },
    ],
  },
  {
    key: "hosting",
    type: "SINGLE_CHOICE",
    title: { it: "Dove ospiterete i passaporti?", en: "Where will you host the passports?" },
    options: [
      { key: "proprietary", label: { it: "Piattaforma proprietaria", en: "Proprietary platform" } },
      { key: "saas", label: { it: "Licenza SaaS", en: "SaaS licence" } },
      { key: "paas", label: { it: "Licenza PaaS", en: "PaaS licence" } },
      { key: "undecided", label: { it: "Non ancora deciso", en: "Not decided yet" } },
    ],
  },
  {
    key: "registry_integration",
    type: "SINGLE_CHOICE",
    title: { it: "Come pensate di integrarvi con il Registry UE?", en: "How do you plan to integrate with the EU Registry?" },
    options: [
      { key: "direct", label: { it: "Integrazione diretta", en: "Direct integration" } },
      { key: "via_provider", label: { it: "Tramite il fornitore della piattaforma", en: "Through the platform provider" } },
      { key: "not_planned", label: { it: "Non ancora pianificata", en: "Not planned yet" } },
      { key: "unknown", label: { it: "Non so cosa sia", en: "I don't know what it is" } },
    ],
  },
];

export const areas = [
  { key: "data", label: { it: "Dati", en: "Data" }, weight: 1, maxPoints: 10 },
  { key: "process", label: { it: "Processi e organizzazione", en: "Processes and organization" }, weight: 1, maxPoints: 10 },
  { key: "technology", label: { it: "Tecnologia e infrastruttura", en: "Technology and infrastructure" }, weight: 1, maxPoints: 10 },
];

export const scoringRules = [
  { area: "data", points: 4, condition: { step: "data_organization", op: "eq", value: "centralized" }, note: "Esempio" },
  { area: "data", points: 2, condition: { step: "data_organization", op: "eq", value: "decentralized" }, note: "Esempio" },
  { area: "data", points: 2, condition: { step: "data_sources", op: "includes", value: ["erp", "mes", "plm"] }, note: "Esempio" },
  { area: "data", points: 1, condition: { step: "data_sources", op: "includes", value: "suppliers_api" }, note: "Esempio" },
  { area: "data", points: 1, condition: { step: "data_model", op: "includes", value: "materials" }, note: "Esempio" },
  { area: "data", points: 1, condition: { step: "data_model", op: "includes", value: "origin" }, note: "Esempio" },
  { area: "data", points: 1, condition: { step: "data_model", op: "includes", value: "sustainability" }, note: "Esempio" },
  { area: "data", points: 1, condition: { step: "data_model", op: "includes", value: "end_of_life" }, note: "Esempio" },
  { area: "process", points: 3, condition: { step: "production_model", op: "eq", value: "in_house" }, note: "Esempio" },
  { area: "process", points: 2, condition: { step: "production_model", op: "eq", value: "both" }, note: "Esempio" },
  { area: "process", points: 3, condition: { step: "qr_presence", op: "in", value: ["qr", "other_carrier"] }, note: "Esempio" },
  { area: "process", points: 2, condition: { step: "qr_code_type", op: "in", value: ["espr", "battery_regulation"] }, note: "Esempio" },
  { area: "process", points: 2, condition: { step: "dpp_granularity", op: "in", value: ["model", "batch", "item"] }, note: "Esempio" },
  { area: "technology", points: 4, condition: { step: "hosting", op: "in", value: ["proprietary", "saas", "paas"] }, note: "Esempio" },
  { area: "technology", points: 4, condition: { step: "registry_integration", op: "in", value: ["direct", "via_provider"] }, note: "Esempio" },
  { area: "technology", points: 2, condition: { step: "url_scheme", op: "in", value: ["gs1_digital_link", "own_domain"] }, note: "Esempio" },
];

export const recommendations = [
  {
    priority: 10,
    condition: { step: "industry", op: "eq", value: "battery" },
    title: { it: "Verifica gli obblighi del passaporto batterie", en: "Check the battery passport obligations" },
    body: {
      it: "Il Regolamento (UE) 2023/1542 prevede un passaporto dedicato per alcune categorie di batterie. Verifica categoria, scadenze e dati richiesti.",
      en: "Regulation (EU) 2023/1542 sets out a dedicated passport for certain battery categories. Check category, deadlines and required data.",
    },
  },
  {
    priority: 9,
    condition: { step: "data_organization", op: "eq", value: "unorganized" },
    title: { it: "Mappa e centralizza i dati di prodotto", en: "Map and centralize product data" },
    body: {
      it: "Prima di scegliere una piattaforma, censisci dove si trovano oggi i dati richiesti dal DPP e chi ne è responsabile.",
      en: "Before choosing a platform, map where the DPP data lives today and who owns it.",
    },
  },
  {
    priority: 8,
    condition: { step: "qr_presence", op: "eq", value: "none" },
    title: { it: "Definisci il data carrier", en: "Define the data carrier" },
    body: {
      it: "Serve un data carrier (es. QR code) con un identificativo univoco e persistente: valuta impatti su packaging, etichette e linee produttive.",
      en: "You need a data carrier (e.g. a QR code) with a unique, persistent identifier: assess impacts on packaging, labels and production lines.",
    },
  },
  {
    priority: 7,
    condition: { step: "data_sources", op: "includes", value: "suppliers_excel" },
    title: { it: "Struttura la raccolta dati dai fornitori", en: "Structure supplier data collection" },
    body: {
      it: "Excel ed email non scalano: definisci un formato standard e, dove possibile, un portale o un'API per i fornitori.",
      en: "Excel and email do not scale: define a standard format and, where possible, a portal or API for suppliers.",
    },
  },
  {
    priority: 6,
    condition: { step: "hosting", op: "eq", value: "undecided" },
    title: { it: "Scegli il modello di hosting", en: "Choose the hosting model" },
    body: {
      it: "Confronta piattaforma proprietaria, SaaS e PaaS su costi, controllo dei dati, integrazione e tempi di avvio.",
      en: "Compare proprietary platform, SaaS and PaaS on cost, data control, integration and time to launch.",
    },
  },
  {
    priority: 5,
    condition: { step: "registry_integration", op: "in", value: ["not_planned", "unknown"] },
    title: { it: "Pianifica l'integrazione con il Registry UE", en: "Plan the EU Registry integration" },
    body: {
      it: "Il Registry UE collega l'identificativo del prodotto al data host che ospita il passaporto: inseriscilo nella roadmap.",
      en: "The EU Registry links the product identifier to the data host serving the passport: include it in your roadmap.",
    },
  },
  {
    priority: 4,
    condition: { step: "data_dynamics", op: "in", value: ["dynamic", "mixed"] },
    title: { it: "Prevedi l'aggiornamento del passaporto", en: "Plan for passport updates" },
    body: {
      it: "Con dati dinamici serve un processo (e permessi) per aggiornare il passaporto durante la vita del prodotto.",
      en: "With dynamic data you need a process (and permissions) to update the passport during the product's life.",
    },
  },
  {
    priority: 3,
    condition: { step: "url_scheme", op: "eq", value: "unsure" },
    title: { it: "Approfondisci gli standard di identificazione", en: "Look into identification standards" },
    body: {
      it: "Gli standard CEN/CENELEC sul DPP definiscono identificativi e risoluzione: scegli uno schema stabile nel tempo.",
      en: "CEN/CENELEC DPP standards define identifiers and resolution: choose a scheme that stays stable over time.",
    },
  },
];
