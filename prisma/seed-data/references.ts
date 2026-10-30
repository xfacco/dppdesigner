/**
 * Riferimenti normativi iniziali per ogni step (Markdown, IT/EN).
 * Numeri di articolo citati solo dove verificati; il resto rimanda al regolamento.
 * Da validare sul testo ufficiale prima della pubblicazione in produzione.
 */

const ESPR_IT = "[Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj/ita)";
const ESPR_EN = "[Regulation (EU) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj)";
const BATT_IT = "[Regolamento (UE) 2023/1542 (Batterie)](https://eur-lex.europa.eu/eli/reg/2023/1542/oj/ita)";
const BATT_EN = "[Regulation (EU) 2023/1542 (Batteries)](https://eur-lex.europa.eu/eli/reg/2023/1542/oj)";
const CPR_IT = "[Regolamento (UE) 2024/3110 (Prodotti da costruzione)](https://eur-lex.europa.eu/eli/reg/2024/3110/oj/ita)";
const CPR_EN = "[Regulation (EU) 2024/3110 (Construction products)](https://eur-lex.europa.eu/eli/reg/2024/3110/oj)";
const R2R_IT = "[Direttiva (UE) 2024/1799 (Diritto alla riparazione)](https://eur-lex.europa.eu/eli/dir/2024/1799/oj/ita)";
const R2R_EN = "[Directive (EU) 2024/1799 (Right to repair)](https://eur-lex.europa.eu/eli/dir/2024/1799/oj)";
const DPP_PAGE = "https://single-market-economy.ec.europa.eu/single-market/digital-product-passport_en";
const REGISTRY = "https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/dpp-registry_en";
const CIRPASS = "[CIRPASS-2](https://cirpass2.eu/)";
const GS1_DL = "[GS1 Digital Link](https://www.gs1.org/standards/gs1-digital-link)";

export const stepReferences: Record<string, { it: string; en: string }> = {
  industry: {
    it: `- ${ESPR_IT}: quadro generale. I prodotti soggetti al passaporto e i dati richiesti sono definiti da **atti delegati per gruppo di prodotto**, adottati nel tempo secondo il piano di lavoro della Commissione.
- **Batterie**: ${BATT_IT}, art. 77 (passaporto delle batterie).
- **Prodotti da costruzione**: ${CPR_IT}, che prevede un proprio passaporto digitale.
- [Digital Product Passport — Commissione europea](${DPP_PAGE})`,
    en: `- ${ESPR_EN}: general framework. The products requiring a passport and the data required are set by **delegated acts per product group**, adopted over time following the Commission's working plan.
- **Batteries**: ${BATT_EN}, Article 77 (battery passport).
- **Construction products**: ${CPR_EN}, which provides for its own digital passport.
- [Digital Product Passport — European Commission](${DPP_PAGE})`,
  },
  company_type: {
    it: `- ${ESPR_IT}, art. 2 (definizioni): distingue **fabbricante**, **importatore**, **distributore** e **rivenditore** (dealer). Gli obblighi sul passaporto ricadono principalmente su chi immette il prodotto sul mercato UE.
- Un brand che fa produrre a terzi con il proprio marchio è di norma considerato fabbricante.`,
    en: `- ${ESPR_EN}, Article 2 (definitions): distinguishes **manufacturer**, **importer**, **distributor** and **dealer**. Passport obligations fall mainly on whoever places the product on the EU market.
- A brand having products made by third parties under its own name is usually considered the manufacturer.`,
  },
  production_model: {
    it: `- ${ESPR_IT}: chi immette il prodotto sul mercato deve rendere disponibile il passaporto anche quando i dati provengono dalla **catena di fornitura**: con fornitori esterni servono accordi su quali dati, in che formato e con quali tempi.
- ${CIRPASS}: progetti pilota europei sullo scambio di dati di filiera per il DPP.`,
    en: `- ${ESPR_EN}: whoever places the product on the market must make the passport available even when the data comes from the **supply chain**: with external suppliers you need agreements on which data, in which format and when.
- ${CIRPASS}: European pilot projects on supply-chain data exchange for the DPP.`,
  },
  sku_count: {
    it: `- ${ESPR_IT}: il passaporto è richiesto per **ogni prodotto immesso sul mercato** che rientra in un atto delegato. Il numero di SKU incide su volumi di dati, processi di aggiornamento e costi della piattaforma.
- Il livello del passaporto (modello, lotto o singolo articolo) è stabilito dall'atto delegato: vedi lo step sulla granularità.`,
    en: `- ${ESPR_EN}: a passport is required for **every product placed on the market** that falls under a delegated act. The number of SKUs drives data volumes, update processes and platform costs.
- The passport level (model, batch or item) is set by the delegated act: see the granularity step.`,
  },
  sample_product: {
    it: `- ${ESPR_IT}, Allegato III: categorie di informazioni che possono essere incluse nel passaporto (identificativi, conformità, documentazione, istruzioni, informazioni per riparazione e fine vita…). L'atto delegato del settore indica quali sono obbligatorie.
- **Batterie**: ${BATT_IT}, Allegato XIII (informazioni da includere nel passaporto delle batterie).`,
    en: `- ${ESPR_EN}, Annex III: categories of information that may be included in the passport (identifiers, compliance, documentation, instructions, repair and end-of-life information…). The sector's delegated act says which ones are mandatory.
- **Batteries**: ${BATT_EN}, Annex XIII (information to be included in the battery passport).`,
  },
  maintenance: {
    it: `- ${ESPR_IT}: tra i requisiti di progettazione ecocompatibile rientrano **durabilità, riparabilità e disponibilità di parti di ricambio**; le informazioni relative possono confluire nel passaporto.
- ${R2R_IT}: obblighi di riparazione per alcune categorie di prodotti.
- **Batterie**: ${BATT_IT}, art. 14 (informazioni sullo stato di salute e sulla durata prevista).`,
    en: `- ${ESPR_EN}: ecodesign requirements include **durability, reparability and spare parts availability**; the related information may be included in the passport.
- ${R2R_EN}: repair obligations for certain product categories.
- **Batteries**: ${BATT_EN}, Article 14 (information on state of health and expected lifetime).`,
  },
  data_dynamics: {
    it: `- ${ESPR_IT}: il passaporto deve restare **accessibile e aggiornato** per la durata prevista; l'atto delegato indica chi può aggiornare quali dati (es. riparatori, rigeneratori).
- **Batterie**: ${BATT_IT}, Allegato XIII: alcune informazioni del passaporto sono **dinamiche** (es. stato di salute) e vanno aggiornate durante la vita della batteria.`,
    en: `- ${ESPR_EN}: the passport must remain **accessible and up to date** for its expected lifetime; the delegated act sets who may update which data (e.g. repairers, remanufacturers).
- **Batteries**: ${BATT_EN}, Annex XIII: some passport information is **dynamic** (e.g. state of health) and must be updated during the battery's life.`,
  },
  data_sources: {
    it: `- ${ESPR_IT}: i requisiti di informazione comprendono anche la **tracciabilità delle sostanze preoccupanti** lungo il ciclo di vita, che richiede dati dai fornitori.
- ${CIRPASS}: casi d'uso e modelli di scambio dati tra sistemi aziendali (ERP, PLM, MES) e fornitori.`,
    en: `- ${ESPR_EN}: information requirements also cover **tracking substances of concern** throughout the life cycle, which requires supplier data.
- ${CIRPASS}: use cases and data exchange models between business systems (ERP, PLM, MES) and suppliers.`,
  },
  data_organization: {
    it: `- ${ESPR_IT}: il passaporto si basa su **standard aperti e interoperabili** e su un'architettura decentralizzata: i dati restano presso l'operatore economico o il suo fornitore di servizi.
- Dati distribuiti su più sistemi richiedono un modello dati comune prima di alimentare il passaporto.`,
    en: `- ${ESPR_EN}: the passport relies on **open, interoperable standards** and a decentralised architecture: data stays with the economic operator or its service provider.
- Data spread across several systems needs a common data model before feeding the passport.`,
  },
  data_model: {
    it: `- ${ESPR_IT}, Allegato III: categorie di informazioni del passaporto.
- ${ESPR_IT}: i **parametri di prodotto** (durabilità, contenuto riciclato, impronta ambientale e di carbonio, riciclabilità…) su cui gli atti delegati possono fissare requisiti.
- **Batterie**: ${BATT_IT}, Allegato XIII.
- **Tessile, acciaio, alluminio e altri gruppi**: gli atti delegati sono in preparazione; il modello dati definitivo dipenderà da questi.`,
    en: `- ${ESPR_EN}, Annex III: categories of passport information.
- ${ESPR_EN}: the **product parameters** (durability, recycled content, environmental and carbon footprint, recyclability…) on which delegated acts may set requirements.
- **Batteries**: ${BATT_EN}, Annex XIII.
- **Textiles, steel, aluminium and other groups**: delegated acts are being prepared; the final data model will depend on them.`,
  },
  qr_presence: {
    it: `- ${ESPR_IT}: il passaporto è collegato a un **identificativo univoco del prodotto** tramite un **data carrier** (es. QR code) presente sul prodotto, sull'imballaggio o sulla documentazione, come indicato dall'atto delegato.
- Il data carrier contiene solo l'identificativo, non i dati del passaporto.
- **Batterie**: ${BATT_IT}, art. 13 (etichettatura e QR code).`,
    en: `- ${ESPR_EN}: the passport is linked to a **unique product identifier** through a **data carrier** (e.g. a QR code) placed on the product, its packaging or documentation, as set by the delegated act.
- The data carrier only holds the identifier, not the passport data.
- **Batteries**: ${BATT_EN}, Article 13 (labelling and QR code).`,
  },
  qr_code_type: {
    it: `- **Prodotti ESPR**: tipo di data carrier e posizionamento sono fissati dall'atto delegato del gruppo di prodotto, sulla base di standard aperti (${ESPR_IT}).
- **Batterie**: ${BATT_IT}, art. 13 (QR code sulla batteria) e art. 77 (accesso al passaporto tramite QR code).
- Standard di riferimento: QR code ISO/IEC 18004; identificazione univoca ISO/IEC 15459.`,
    en: `- **ESPR products**: data carrier type and placement are set by the product group's delegated act, based on open standards (${ESPR_EN}).
- **Batteries**: ${BATT_EN}, Article 13 (QR code on the battery) and Article 77 (passport access through the QR code).
- Reference standards: QR code ISO/IEC 18004; unique identification ISO/IEC 15459.`,
  },
  dpp_granularity: {
    it: `- ${ESPR_IT}: l'atto delegato stabilisce se il passaporto si riferisce al **modello**, al **lotto** o al **singolo articolo**.
- **Batterie**: ${BATT_IT}, art. 77: il passaporto è **per singola batteria**.`,
    en: `- ${ESPR_EN}: the delegated act sets whether the passport relates to the **model**, the **batch** or the **individual item**.
- **Batteries**: ${BATT_EN}, Article 77: the passport is **per individual battery**.`,
  },
  url_scheme: {
    it: `- **EN 18219** (CEN/CENELEC JTC 24): norma sugli identificativi univoci per il DPP, parte del pacchetto di norme armonizzate richieste dalla Commissione. Verifica lo stato di pubblicazione.
- ${GS1_DL}: schema diffuso per codificare identificativi di prodotto in un URL risolvibile.
- ${ESPR_IT}: identificativi e data carrier devono basarsi su standard aperti e restare stabili nel tempo.`,
    en: `- **EN 18219** (CEN/CENELEC JTC 24): standard on unique identifiers for the DPP, part of the harmonised standards requested by the Commission. Check its publication status.
- ${GS1_DL}: a widespread scheme for encoding product identifiers in a resolvable URL.
- ${ESPR_EN}: identifiers and data carriers must be based on open standards and remain stable over time.`,
  },
  hosting: {
    it: `- ${ESPR_IT}: il passaporto può essere gestito dall'operatore economico o da un **fornitore di servizi del passaporto**; sono previsti requisiti di disponibilità nel tempo, inclusa una **copia di backup** presso un fornitore di servizi.
- La scelta tra piattaforma proprietaria, SaaS o PaaS deve garantire accesso ai dati anche in caso di cessazione dell'attività o del fornitore.`,
    en: `- ${ESPR_EN}: the passport may be managed by the economic operator or by a **passport service provider**; there are requirements on long-term availability, including a **backup copy** held by a service provider.
- Choosing between a proprietary platform, SaaS or PaaS must ensure data access even if the business or the provider ceases activity.`,
  },
  registry_integration: {
    it: `- ${ESPR_IT}, art. 13: **registro dei passaporti** istituito dalla Commissione, in cui vengono registrati almeno gli identificativi univoci di prodotto e collegati al passaporto.
- [DPP Registry — Commissione europea](${REGISTRY})
- Il registro è collegato anche ai controlli doganali sui prodotti importati.`,
    en: `- ${ESPR_EN}, Article 13: **digital product passport registry** set up by the Commission, storing at least the unique product identifiers and linking them to the passport.
- [DPP Registry — European Commission](${REGISTRY})
- The registry is also linked to customs checks on imported products.`,
  },
};
