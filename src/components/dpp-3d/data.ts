export interface SupplyChainNode {
  id: string;
  name: string;
  city: string;
  country: string;
  role: "extraction" | "processing" | "manufacturing" | "distribution";
  roleLabel: string;
  lat: number;
  lon: number;
  co2: string;
  co2Value: number; // kg CO2 eq / unit
  distance: string;
  transportMode: string;
  certifications: string[];
  lotId: string;
  verifiedDppHash: string;
  description: string;
  highlights: { label: string; value: string }[];
}

export interface ProductPart {
  id: string;
  name: string;
  category: string;
  recycledPercent: number;
  recyclabilityRate: number;
  weight: string;
  materialComposition: string;
  repairLevel: "Livello 1 (Utente finale)" | "Livello 2 (Tecnico certificato)" | "Livello 3 (Centro autorizzato)";
  disassemblyTime: string;
  targetVector: [number, number, number];
  instructions: string[];
  dppDirectives: string[];
  description: string;
}

export interface CircularPhase {
  id: string;
  phaseNumber: number;
  name: string;
  stage: string;
  tagline: string;
  uParam: number; // 0 to 2*PI position along the loop
  color: string;
  description: string;
  kpis: { label: string; value: string; detail: string }[];
  esprStandard: string;
  dppDataPoints: string[];
}

export const SUPPLY_CHAIN_NODES: SupplyChainNode[] = [
  {
    id: "node-atacama",
    name: "Salar de Atacama",
    city: "Antofagasta",
    country: "Cile",
    role: "extraction",
    roleLabel: "Estrazione Materie Prime",
    lat: -23.86,
    lon: -69.13,
    co2: "3.2 kg CO₂eq/kg Li",
    co2Value: 3.2,
    distance: "Origine (0 km)",
    transportMode: "Flotta mineraria elettrica a idrogeno",
    certifications: ["IRMA 75 (Responsible Mining)", "ISO 14001:2015", "OECD Due Diligence Compliance"],
    lotId: "LOT-CL-LI-2026-994A",
    verifiedDppHash: "0x8f2a...7c19eb4",
    description: "Estrazione da salamoia con tecnologia DLE (Direct Lithium Extraction) a circuito chiuso d'acqua, riducendo l'impatto idrico del 92% rispetto all'evaporazione tradizionale.",
    highlights: [
      { label: "Consumo Idrico", value: "0.18 m³/t Li (Riciclo 95%)" },
      { label: "Tracciabilità Geografica", value: "Coordinate GPS con sigillo crittografico" },
      { label: "Audit Diritti Umani", value: "Conforme ILO C169 Comunità Atacameñas" }
    ]
  },
  {
    id: "node-katanga",
    name: "Katanga Copper-Cobalt Belt",
    city: "Kolwezi",
    country: "Rep. Dem. del Congo",
    role: "extraction",
    roleLabel: "Cobalto Responsabile Certificato",
    lat: -10.72,
    lon: 25.47,
    co2: "4.6 kg CO₂eq/kg Co",
    co2Value: 4.6,
    distance: "1.450 km (verso porto Durban)",
    transportMode: "Ferrovia transcontinentale elettrificata",
    certifications: ["Fair Cobalt Alliance", "Responsible Minerals Initiative (RMI)", "Chain of Custody Standard"],
    lotId: "LOT-CD-CO-2026-140X",
    verifiedDppHash: "0x3d7b...4e91aa2",
    description: "Tracciamento a livello di singolo cantiere estrattivo con divieto assoluto di lavoro minorile verificato da ispettori indipendenti terzi e pesatura digitale istantanea.",
    highlights: [
      { label: "Fair Trade Premium", value: "+12% reinvestito in scuole locali" },
      { label: "Purezza Raffinata", value: "99.85% grado catodico" },
      { label: "Monitoraggio Satellite", value: "Sorveglianza deforestazione radar ESA" }
    ]
  },
  {
    id: "node-yibin",
    name: "Yibin Green Giga-Park",
    city: "Sichuan / Yibin",
    country: "Cina",
    role: "processing",
    roleLabel: "Raffinazione & Fabbricazione Celle",
    lat: 28.76,
    lon: 104.64,
    co2: "38.4 kg CO₂eq/kWh",
    co2Value: 38.4,
    distance: "16.800 km (rotta marittima)",
    transportMode: "Portacontainer ibrida alimentata a bio-metanolo",
    certifications: ["PAS 2060 Carbon Neutral Facility", "ISO 50001 Energy Management", "Zero Waste to Landfill Gold"],
    lotId: "CELL-YIB-LFP-084",
    verifiedDppHash: "0x11c9...88fa390",
    description: "Sintesi dei precursori catodici e assemblaggio celle con energia idroelettrica al 100% dal bacino del fiume Yangtze. Recupero termico totale e solventi NMP riciclati a ciclo chiuso.",
    highlights: [
      { label: "Energia Rinnovabile", value: "100% Idroelettrica certificata I-REC" },
      { label: "Chimica Cella", value: "LFP senza Nichel né Cobalto primario" },
      { label: "Densità Energetica", value: "215 Wh/kg a livello cella" }
    ]
  },
  {
    id: "node-stuttgart",
    name: "Stuttgart Tech Cluster & BMS Lab",
    city: "Stoccarda",
    country: "Germania",
    role: "manufacturing",
    roleLabel: "Ingegneria Elettronica & Assemblaggio",
    lat: 48.77,
    lon: 9.18,
    co2: "6.8 kg CO₂eq/modulo",
    co2Value: 6.8,
    distance: "9.200 km (ferrovia intercontinentale)",
    transportMode: "Treno merci transasiatico elettrificato",
    certifications: ["EMAS III Europa", "IATF 16949 Automotive Quality", "ISO 27001 Cybersecurity"],
    lotId: "BMS-MOD-STU-552",
    verifiedDppHash: "0xaa42...99ee104",
    description: "Progettazione dell'unità di controllo BMS con chip crittografico conforme alle specifiche EU Cyber Resilience Act e programmazione del chip NFC per il Passaporto Digitale.",
    highlights: [
      { label: "Architettura Modulare", value: "Predisposta per smontaggio robotico < 2 min" },
      { label: "Secure Element", value: "EAL6+ hardware wallet per identità DPP" },
      { label: "Algoritmo SOH", value: "Stima stato di salute con accuratezza 99.2%" }
    ]
  },
  {
    id: "node-milano",
    name: "Milano Circular Logistics Hub",
    city: "Milano / Rotterdam",
    country: "Italia / Paesi Bassi",
    role: "distribution",
    roleLabel: "Hub Distribuzione & Retail UE",
    lat: 45.46,
    lon: 9.19,
    co2: "1.1 kg CO₂eq/unità",
    co2Value: 1.1,
    distance: "680 km (da impianto di assemblaggio)",
    transportMode: "Camion elettrici pesanti e treno intermodale",
    certifications: ["Green Freight Europe Platinum", "EcoVadis Platinum 2026", "Lean & Green 4 Stars"],
    lotId: "DIST-EU-IT-7700",
    verifiedDppHash: "0x5501...14ca8b9",
    description: "Stoccaggio in magazzino automatizzato a energia solare e attivazione ufficiale del passaporto digitale nel portale centrale della Commissione Europea.",
    highlights: [
      { label: "Packaging Secondario", value: "100% Cartone riciclato FSC con inchiostri ad acqua" },
      { label: "Stato DPP", value: "Registrato & Verificato sul Ledger UE" },
      { label: "Garanzia Ricambi", value: "Disponibilità garantita per 10 anni" }
    ]
  }
];

export const SUPPLY_CHAIN_ARCS = [
  { from: "node-atacama", to: "node-yibin", label: "Rotta Pacifica Litio Grezzo", color: "#38bdf8" },
  { from: "node-katanga", to: "node-yibin", label: "Rotta Indiana Cobalto", color: "#60a5fa" },
  { from: "node-yibin", to: "node-stuttgart", label: "Corridoio Ferroviario Transasiatico Celle", color: "#34d399" },
  { from: "node-stuttgart", to: "node-milano", label: "Corridoio Intermodale Logistica UE", color: "#4ade80" }
];

export const PRODUCT_PARTS: ProductPart[] = [
  {
    id: "part-housing",
    name: "Scocca Superiore in Alluminio Circolare",
    category: "Involucro & Protezione Termica",
    recycledPercent: 88,
    recyclabilityRate: 99.4,
    weight: "1.42 kg",
    materialComposition: "88% Alluminio secondario post-consumer (EN AW-6063), 12% alluminio primario a basso carbonio",
    repairLevel: "Livello 1 (Utente finale)",
    disassemblyTime: "45 secondi",
    targetVector: [0, 2.2, 0],
    instructions: [
      "Svitare le 4 viti standard Torx T20 sul perimetro superiore.",
      "Sollevare delicatamente la scocca svincolando la guarnizione in elastomero termoplastico riciclabile (TPE).",
      "La scocca può essere reimpiegata direttamente o fusa a circuito chiuso senza perdita di purezza metallurgica."
    ],
    dppDirectives: ["ESPR Regolamento (UE) 2024/1781", "EN 45554 Requisiti Riparabilità"],
    description: "Alloggiamento monoblocco estruso con finitura anodizzata naturale, privo di vernici inquinanti o colle strutturali irreversibili. Alloggia il codice QR con chip NFC protetto da vetro minerale temprato."
  },
  {
    id: "part-bms",
    name: "Scheda BMS & Secure Element DPP",
    category: "Elettronica di Controllo & Crittografia",
    recycledPercent: 42,
    recyclabilityRate: 91.8,
    weight: "0.28 kg",
    materialComposition: "PCB privo di alogeni (FR-4 halogen-free), 100% rame e stagno conflict-free, placcatura contatti oro riciclato",
    repairLevel: "Livello 2 (Tecnico certificato)",
    disassemblyTime: "90 secondi",
    targetVector: [0, 1.1, 0.4],
    instructions: [
      "Scollegare il connettore bus dati flessibile sollevando la levetta a zero forza d'inserzione (ZIF).",
      "Rimuovere i 3 fermi a scatto in poliammide bio-based senza attrezzi.",
      "Il modulo include memoria flash crittografica sostituibile in caso di upgrade firmware secondo Cyber Resilience Act."
    ],
    dppDirectives: ["Direttiva RAEE 2012/19/UE", "Cyber Resilience Act (UE) 2024"],
    description: "Cervello digitale del passaporto: memorizza in tempo reale il numero di cicli di carica, la resistenza interna, i picchi di temperatura e firma crittograficamente i log di utilizzo per il mercato second-life."
  },
  {
    id: "part-cells",
    name: "Matrice di 8 Celle Prismatiche LFP",
    category: "Stoccaggio Elettrochimico",
    recycledPercent: 95,
    recyclabilityRate: 96.5,
    weight: "5.80 kg",
    materialComposition: "Litio rigenerato idrometallurgico, fosfato di ferro, grafite sintetica da scarti, alluminio e rame di grado elettrodo",
    repairLevel: "Livello 2 (Tecnico certificato)",
    disassemblyTime: "2 minuti e 30 secondi",
    targetVector: [0, 0, 0],
    instructions: [
      "Disattivare l'interruttore manuale di disconnessione di servizio prima di procedere.",
      "Svitare i dadi M6 isolati sulle busbar di interconnessione delle celle.",
      "Estrarre singolarmente le celle testando il voltaggio a vuoto: le celle con SOH > 80% vanno al programma Second-Life stazionario."
    ],
    dppDirectives: ["Regolamento Batterie (UE) 2023/1542", "Obblighi Recupero Litio & Cobalto 2026-2031"],
    description: "Celle ad alta stabilità termica e chimica priva di cobalto/nichel. Progettate con tecnologia 'Pack-to-Cell' reversibile che consente la sostituzione di un singolo elemento difettoso invece dell'intero pacco."
  },
  {
    id: "part-cooling",
    name: "Piastra di Raffreddamento & Aerogel",
    category: "Gestione Termica & Isolamento",
    recycledPercent: 78,
    recyclabilityRate: 97.2,
    weight: "0.95 kg",
    materialComposition: "Lega alluminio riciclato a canali microestrusi, isolante aerogel a base silice da scarti di lolla di riso",
    repairLevel: "Livello 3 (Centro autorizzato)",
    disassemblyTime: "60 secondi",
    targetVector: [0, -1.1, -0.3],
    instructions: [
      "Drenare il liquido dielettrico a base di glicole vegetale biodegradabile tramite il raccordo a tenuta rapida.",
      "Scollegare i giunti flessibili a innesto rapido con clip di sicurezza.",
      "Separare lo strato aerogel asportabile a secco senza residui chimici o solventi."
    ],
    dppDirectives: ["Regolamento Sostanze Chimiche REACH", "Direttiva Ecodesign ESPR"],
    description: "Garantisce il mantenimento della temperatura operativa ottimale (20-30°C) massimizzando la durata della batteria fino a 3.500 cicli utili prima della degradazione all'80%."
  },
  {
    id: "part-busbars",
    name: "Busbar in Rame Secondario & Morsetti",
    category: "Distribuzione di Potenza",
    recycledPercent: 90,
    recyclabilityRate: 100,
    weight: "0.45 kg",
    materialComposition: "90% Rame raffinato secondario Cu-ETP (CW004A) ad altissima conducibilità elettrica (100% IACS)",
    repairLevel: "Livello 1 (Utente finale)",
    disassemblyTime: "30 secondi",
    targetVector: [0, -2.1, 0],
    instructions: [
      "Allentare le clip di bloccaggio ad apertura rapida.",
      "Rimuovere le sbarre di distribuzione in rame puro: materiale metallurgico al 100% riutilizzabile a ciclo chiuso.",
      "Nessuna saldatura a stagno permanente: tutti i punti di contatto sfruttano pressione meccanica controllata."
    ],
    dppDirectives: ["Direttiva RoHS 2011/65/UE", "Critical Raw Materials Act (CRMA) 2024"],
    description: "Elementi conduttivi ad altissima efficienza con perdite ohmiche ridotte al minimo. Codificati per lega metallica con marcatura laser indelebile per il riciclo automatizzato con spettrometria ottica."
  }
];

export const CIRCULAR_PHASES: CircularPhase[] = [
  {
    id: "phase-materials",
    phaseNumber: 1,
    name: "Materie Prime & Origine",
    stage: "Estrazione & Approvvigionamento Responsabile",
    tagline: "Due diligence etica, minerali conflict-free e quota minima riciclata",
    uParam: 0,
    color: "#10b981",
    description: "Ogni materia prima viene geolocalizzata all'origine con tracciamento notarile su registro digitale: audit di filiera per diritti dei lavoratori, impatto idrico e salvaguardia della biodiversità.",
    kpis: [
      { label: "Quota Riciclato Minima", value: "88%", detail: "Conforme a standard ESPR Art. 7" },
      { label: "Tracciabilità Origine", value: "100%", detail: "Coordinate georeferenziate dei siti" },
      { label: "Conflict-Free", value: "Certificato", detail: "RMI & OECD Due Diligence 2026" }
    ],
    esprStandard: "Regolamento (UE) 2024/1781 Allegato I - Requisiti di prestazione e informazione sulle materie prime",
    dppDataPoints: [
      "ID Geografico del sito estrattivo o di riciclo",
      "Percentuale certificata di contenuto riciclato pre/post-consumer",
      "Dichiarazione sulle sostanze estremamente preoccupanti (SVHC REACH)"
    ]
  },
  {
    id: "phase-production",
    phaseNumber: 2,
    name: "Produzione & Eco-Design",
    stage: "Manifattura Circolare a Zero Scarti",
    tagline: "Energia 100% rinnovabile, chimica sicura e progettazione modulare reversibile",
    uParam: (2 * Math.PI) / 5,
    color: "#06b6d4",
    description: "Linee di produzione alimentate da fonti energetiche rinnovabili con bilancio carbonio certificato PAS 2060. Progettazione secondo i criteri Ecodesign per lo smontaggio facile e la riparabilità.",
    kpis: [
      { label: "Carbon Footprint", value: "48.2 kg", detail: "CO₂eq per unità di prodotto finito" },
      { label: "Rifiuti di Processo", value: "< 0.4%", detail: "Zero waste to landfill certificato" },
      { label: "Energia Rinnovabile", value: "100%", detail: "Garanzie di Origine (GO) europee" }
    ],
    esprStandard: "Direttiva ESPR Art. 5 - Requisiti di ecodesign e impronta di carbonio di prodotto (PEF)",
    dppDataPoints: [
      "Metodologia di calcolo dell'impronta di carbonio (PEF/LCA)",
      "Diagramma di disassemblaggio e lista componenti critici",
      "Assenza di sostanze tossiche o inquinanti persistenti"
    ]
  },
  {
    id: "phase-distribution",
    phaseNumber: 3,
    name: "Distribuzione & Logistica",
    stage: "Trasporto a Basse Emissioni & Imballaggi Smart",
    tagline: "Flotte elettrificate, imballaggi riutilizzabili e passaporto registrato",
    uParam: (4 * Math.PI) / 5,
    color: "#3b82f6",
    description: "Ottimizzazione delle rotte con logistica intermodale ferro-gomma elettrica. L'imballaggio è concepito come risorsa riutilizzabile a rendere con QR univoco connesso al portale DPP UE.",
    kpis: [
      { label: "Efficienza Trasporto", value: "A+", detail: "Norma europea EN 16258" },
      { label: "Packaging Circolare", value: "100%", detail: "Monocarta FSC priva di plastiche monouso" },
      { label: "Stato DPP Registro", value: "Attivo", detail: "Sincronizzato con EU DPP Registry" }
    ],
    esprStandard: "Regolamento Imballaggi e Rifiuti d'Imballaggio (PPWR) (UE) 2024",
    dppDataPoints: [
      "Codice univoco del vettore logistico e modalità di trasporto",
      "Istruzioni di stoccaggio e sicurezza per operatori logistici",
      "ID Registro Centrale Europeo per la conformità doganale"
    ]
  },
  {
    id: "phase-use-repair",
    phaseNumber: 4,
    name: "Uso, Manutenzione & Riparazione",
    stage: "Estensione del Ciclo di Vita",
    tagline: "Telemetria stato di salute (SOH), manuali liberi e ricambi garantiti 10 anni",
    uParam: (6 * Math.PI) / 5,
    color: "#8b5cf6",
    description: "Il Passaporto Digitale consente all'utente e ai centri di riparazione indipendenti di consultare lo storico di manutenzione, lo stato di usura residuo e ordinare componenti di ricambio originali.",
    kpis: [
      { label: "Indice di Riparabilità", value: "9.4 / 10", detail: "Standard europeo EN 45554" },
      { label: "Disponibilità Ricambi", value: "10 Anni", detail: "Spedizione entro 48h garantita" },
      { label: "Cicli di Vita Utili", value: "+45%", detail: "Rispetto a modelli non modulari" }
    ],
    esprStandard: "Direttiva sul Diritto alla Riparazione (Right to Repair) (UE) 2024/1799",
    dppDataPoints: [
      "Accesso aperto ai manuali tecnici di riparazione e schemi elettrici",
      "Elenco dei riparatori autorizzati e indipendenti qualificati",
      "Registro digitale certificato degli interventi e upgrade effettuati"
    ]
  },
  {
    id: "phase-recycle",
    phaseNumber: 5,
    name: "Riciclo & Second-Life",
    stage: "Rigenerazione Industriale & Closed-Loop",
    tagline: "Recupero idrometallurgico 96%+ e ri-immissione nel ciclo produttivo",
    uParam: (8 * Math.PI) / 5,
    color: "#ec4899",
    description: "A fine vita primario, la scansione del DPP orienta automaticamente l'operatore tra riutilizzo in impianti stazionari (Second-Life) o recupero ad alta resa dei minerali e metalli preziosi a ciclo chiuso.",
    kpis: [
      { label: "Efficienza Riciclo Metalli", value: "98.5%", detail: "Alluminio, rame, litio e cobalto" },
      { label: "Riuso Second-Life", value: "Idoneo", detail: "Storage stazionario rinnovabile per 8+ anni" },
      { label: "Material Circularity (MCI)", value: "0.89", detail: "Indice Ellen MacArthur Foundation" }
    ],
    esprStandard: "Regolamento UE Batterie & Materie Prime Critiche (CRMA 2024)",
    dppDataPoints: [
      "Istruzioni di disattivazione sicura e scarica controllata",
      "Composizione chimica dettagliata per il riciclatore finale",
      "Certificato digitale di avvenuto smantellamento e riciclo"
    ]
  }
];
