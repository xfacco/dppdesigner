export interface SupplyHub {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  role: "extraction" | "processing" | "manufacturing" | "distribution" | "recycling";
  roleLabel: string;
}

export interface TransportRoute {
  id: string;
  code: string;
  title: string;
  product: string;
  fromHub: string;
  toHub: string;
  mode: "ship" | "train" | "electric_truck" | "loop";
  modeLabel: string;
  distanceKm: number;
  co2Rate: string; // e.g. "3.2 kg CO₂eq/kg"
  co2SavingsPercent: number; // e.g. 74%
  co2BasePerSec: number; // for live simulation ticking
  status: "In Transito" | "Verificato DPP" | "Completato" | "Loop Attivo";
  eta: string;
  certifications: string[];
  summary: string;
  dppHash: string;
}

export const SUPPLY_HUBS: Record<string, SupplyHub> = {
  atacama: {
    id: "atacama",
    name: "Salar de Atacama",
    city: "Antofagasta",
    country: "Cile",
    lat: -23.86,
    lon: -69.13,
    role: "extraction",
    roleLabel: "Estrazione Litio Sostenibile",
  },
  katanga: {
    id: "katanga",
    name: "Katanga Belt",
    city: "Kolwezi",
    country: "Rep. Dem. del Congo",
    lat: -10.72,
    lon: 25.47,
    role: "extraction",
    roleLabel: "Cobalto Etico Certificato",
  },
  ningde: {
    id: "ningde",
    name: "Giga-Park Ningde/Yibin",
    city: "Yibin",
    country: "Cina",
    lat: 28.76,
    lon: 104.64,
    role: "processing",
    roleLabel: "Raffinazione & Fabbricazione Celle LFP",
  },
  stuttgart: {
    id: "stuttgart",
    name: "Stuttgart Tech Cluster",
    city: "Stoccarda",
    country: "Germania",
    lat: 48.77,
    lon: 9.18,
    role: "manufacturing",
    roleLabel: "Assemblaggio Modulare BMS & Sicurezza",
  },
  milano: {
    id: "milano",
    name: "Milano Circular Hub",
    city: "Milano",
    country: "Italia",
    lat: 45.46,
    lon: 9.19,
    role: "distribution",
    roleLabel: "Hub Distribuzione UE & Registro DPP",
  },
  rotterdam: {
    id: "rotterdam",
    name: "Rotterdam Green Port",
    city: "Rotterdam",
    country: "Paesi Bassi",
    lat: 51.92,
    lon: 4.47,
    role: "recycling",
    roleLabel: "Centro Recupero & Riciclo Second-Life",
  },
};

export const TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: "route-lithium",
    code: "DPP-TR-01 · CL-CN-8849",
    title: "Salar de Atacama ➔ Ningde Giga-Park",
    product: "Litio Grezzo da Salamoia DLE",
    fromHub: "atacama",
    toHub: "ningde",
    mode: "ship",
    modeLabel: "Portacontainer Ibrida a Bio-Metanolo",
    distanceKm: 16800,
    co2Rate: "3.2 kg CO₂eq/kg Li",
    co2SavingsPercent: 74,
    co2BasePerSec: 0.082,
    status: "In Transito",
    eta: "4 giorni al porto di Shanghai",
    certifications: ["IRMA 75 Responsible Mining", "ISO 14001", "OECD Due Diligence"],
    summary: "Estrazione a basso consumo idrico (-92% vs evaporazione classica) con logistica marittima a carburante rinnovabile certificato ISCC.",
    dppHash: "0x8f2a...7c19eb4",
  },
  {
    id: "route-cells",
    code: "DPP-TR-02 · CN-DE-4410",
    title: "Ningde Giga-Park ➔ Stuttgart Tech Cluster",
    product: "Matrice 8 Celle Prismatiche LFP",
    fromHub: "ningde",
    toHub: "stuttgart",
    mode: "train",
    modeLabel: "Corridoio Ferroviario Transasiatico Elettrificato",
    distanceKm: 9200,
    co2Rate: "12.4 kg CO₂eq/modulo",
    co2SavingsPercent: 82,
    co2BasePerSec: 0.045,
    status: "In Transito",
    eta: "36 ore al terminal merci di Monaco",
    certifications: ["PAS 2060 Carbon Neutral", "100% Idroelettrico Yangtze", "Zero Waste"],
    summary: "Fabbricazione con energia 100% idroelettrica e trasporto ferroviario elettrificato, azzerando le emissioni del trasporto aereo merci.",
    dppHash: "0x11c9...88fa390",
  },
  {
    id: "route-bms",
    code: "DPP-TR-03 · DE-IT-2291",
    title: "Stuttgart Tech Cluster ➔ Milano Circular Hub",
    product: "Pacco Batteria Modulare DPP con Chip NFC",
    fromHub: "stuttgart",
    toHub: "milano",
    mode: "electric_truck",
    modeLabel: "Camion Elettrico Pesante a Zero Emissioni Locali",
    distanceKm: 650,
    co2Rate: "0.8 kg CO₂eq/unità",
    co2SavingsPercent: 91,
    co2BasePerSec: 0.012,
    status: "Verificato DPP",
    eta: "Arrivo previsto entro oggi",
    certifications: ["Cyber Resilience Act EAL6+", "EN 45554 Riparabilità 9.4/10", "RoHS Compliant"],
    summary: "Assemblaggio reversibile secondo criteri Ecodesign ESPR e trasferimento su flotta elettrica con ricarica da fonte solare certificata.",
    dppHash: "0xaa42...99ee104",
  },
  {
    id: "route-circular",
    code: "DPP-TR-04 · IT-NL-9904",
    title: "Milano Circular Hub ➔ Rotterdam Green Port",
    product: "Logistica Inversa & Flusso Circolare Second-Life",
    fromHub: "milano",
    toHub: "rotterdam",
    mode: "loop",
    modeLabel: "Treno Merci Intermodale Green Logistics",
    distanceKm: 1050,
    co2Rate: "-18.6 kg CO₂eq (Evitati)",
    co2SavingsPercent: 96,
    co2BasePerSec: 0.005,
    status: "Loop Attivo",
    eta: "Ciclo continuo sincronizzato sul Ledger UE",
    certifications: ["EU Battery Regulation 2026", "Closed-Loop Mineral Verification", "MCI 0.89"],
    summary: "Rientro a fine vita primario: riuso per accumulo stazionario (Second-Life) e recupero idrometallurgico dei metalli con resa superiore al 96%.",
    dppHash: "0x5501...14ca8b9",
  },
];
