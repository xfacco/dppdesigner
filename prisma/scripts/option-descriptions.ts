/**
 * Descrizioni (con esempio, dove possibile) per le opzioni del wizard che non ne hanno.
 * Scrive solo dove la descrizione manca: i testi già inseriti dall'admin non vengono toccati.
 * Gli esempi tecnici sono tra apici inversi, così appaiono come testo e non come link.
 *
 *   npx tsx prisma/scripts/option-descriptions.ts [numero-versione]   (predefinita: 6)
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const VERSION_NUMBER = Number(process.argv[2] ?? 6);
type T = { it: string; en: string };

const D: Record<string, Record<string, T>> = {
  industry: {
    battery: {
      it: "Batterie e accumulatori di ogni tipo, anche integrati in altri prodotti.\nEs.: pacchi batteria per e-bike, batterie per auto elettriche, sistemi di accumulo.",
      en: "Batteries and accumulators of any kind, including those built into other products.\nE.g. e-bike battery packs, electric car batteries, energy storage systems.",
    },
    textile: {
      it: "Abbigliamento, calzature, tessili per la casa e accessori.\nEs.: magliette, jeans, scarpe, lenzuola, borse.",
      en: "Apparel, footwear, home textiles and accessories.\nE.g. T-shirts, jeans, shoes, bed linen, bags.",
    },
    electronics: {
      it: "Apparecchi elettrici ed elettronici per consumatori e aziende.\nEs.: smartphone, computer, lavatrici, televisori.",
      en: "Electrical and electronic equipment for consumers and businesses.\nE.g. smartphones, computers, washing machines, TVs.",
    },
    furniture: {
      it: "Mobili per casa, ufficio e contract, inclusi i materassi.\nEs.: sedie, tavoli, armadi, materassi.",
      en: "Furniture for home, office and contract use, including mattresses.\nE.g. chairs, tables, wardrobes, mattresses.",
    },
    steel_aluminium: {
      it: "Semilavorati e prodotti in ferro, acciaio e alluminio, tra i primi gruppi indicati dal piano di lavoro ESPR.\nEs.: lamiere, profilati, tubi, laminati.",
      en: "Iron, steel and aluminium semi-finished and finished products, among the first groups in the ESPR working plan.\nE.g. sheets, sections, tubes, rolled products.",
    },
    tyres: {
      it: "Pneumatici per auto, veicoli commerciali e industriali.\nEs.: pneumatici estivi, invernali, per autocarri.",
      en: "Tyres for cars, commercial and industrial vehicles.\nE.g. summer and winter tyres, truck tyres.",
    },
    construction: {
      it: "Prodotti e materiali da costruzione, che avranno un passaporto digitale previsto dal nuovo Regolamento prodotti da costruzione.\nEs.: cemento, pannelli isolanti, finestre.",
      en: "Construction products and materials, which will get a digital passport under the new Construction Products Regulation.\nE.g. cement, insulation panels, windows.",
    },
    other: {
      it: "Un settore non in elenco: nel prossimo passo potrai indicarlo.\nEs.: giocattoli, cosmetici, detergenti.",
      en: "A sector not listed: you can specify it in the next step.\nE.g. toys, cosmetics, detergents.",
    },
  },

  product_categories: {
    battery_portable: {
      it: "Batterie sigillate fino a 5 kg, non destinate a usi industriali o alla trazione.\nEs.: batterie stilo, batterie di laptop e utensili elettrici.",
      en: "Sealed batteries up to 5 kg, not designed for industrial use or traction.\nE.g. AA cells, laptop and power tool batteries.",
    },
    battery_lmt: {
      it: "Batterie che alimentano veicoli leggeri a trazione elettrica. Il passaporto è obbligatorio dal 18 febbraio 2027.\nEs.: batteria di una e-bike o di un monopattino elettrico.",
      en: "Batteries powering light electric vehicles. The passport is mandatory from 18 February 2027.\nE.g. e-bike or e-scooter battery.",
    },
    battery_ev: {
      it: "Batterie di trazione per veicoli elettrici e ibridi. Il passaporto è obbligatorio dal 18 febbraio 2027.\nEs.: pacco batteria di un'auto elettrica.",
      en: "Traction batteries for electric and hybrid vehicles. The passport is mandatory from 18 February 2027.\nE.g. electric car battery pack.",
    },
    battery_industrial: {
      it: "Batterie per usi industriali o accumulo con capacità oltre 2 kWh. Il passaporto è obbligatorio dal 18 febbraio 2027.\nEs.: sistemi di accumulo per impianti fotovoltaici, batterie per carrelli elevatori.",
      en: "Batteries for industrial use or storage above 2 kWh. The passport is mandatory from 18 February 2027.\nE.g. storage systems for solar plants, forklift batteries.",
    },
    battery_sli: {
      it: "Batterie per l'avviamento, le luci e l'accensione dei veicoli.\nEs.: batteria al piombo da 12 V di un'auto.",
      en: "Batteries for vehicle starting, lighting and ignition.\nE.g. 12 V lead-acid car battery.",
    },
    textile_apparel: {
      it: "Capi d'abbigliamento per uomo, donna e bambino.\nEs.: magliette, pantaloni, giacche.",
      en: "Clothing for men, women and children.\nE.g. T-shirts, trousers, jackets.",
    },
    textile_footwear: {
      it: "Scarpe e calzature di ogni tipo.\nEs.: sneaker, scarpe da lavoro, stivali.",
      en: "Shoes and footwear of any kind.\nE.g. sneakers, work shoes, boots.",
    },
    textile_home: {
      it: "Tessili per l'arredo e l'uso domestico.\nEs.: lenzuola, asciugamani, tende.",
      en: "Textiles for furnishing and household use.\nE.g. bed linen, towels, curtains.",
    },
    textile_accessories: {
      it: "Accessori in tessuto, pelle o materiali misti.\nEs.: borse, cinture, cappelli.",
      en: "Accessories in fabric, leather or mixed materials.\nE.g. bags, belts, hats.",
    },
    elec_mobile: {
      it: "Dispositivi mobili, interessati anche dalle regole UE su riparabilità e ricambi.\nEs.: smartphone, tablet.",
      en: "Mobile devices, also covered by EU rules on repairability and spare parts.\nE.g. smartphones, tablets.",
    },
    elec_computers: {
      it: "Computer per casa e ufficio e apparati per data center.\nEs.: notebook, desktop, server.",
      en: "Home and office computers and data centre equipment.\nE.g. laptops, desktops, servers.",
    },
    elec_appliances: {
      it: "Grandi e piccoli elettrodomestici.\nEs.: lavatrici, frigoriferi, aspirapolvere.",
      en: "Large and small household appliances.\nE.g. washing machines, fridges, vacuum cleaners.",
    },
    elec_displays: {
      it: "Schermi elettronici per casa e ufficio.\nEs.: televisori, monitor, display per segnaletica.",
      en: "Electronic displays for home and office.\nE.g. TVs, monitors, signage displays.",
    },
    elec_other: {
      it: "Altri apparecchi elettrici o elettronici non compresi nelle voci precedenti.\nEs.: stampanti, utensili elettrici, apparecchi di illuminazione.",
      en: "Other electrical or electronic equipment not covered above.\nE.g. printers, power tools, luminaires.",
    },
    furn_furniture: {
      it: "Mobili per abitazione, ufficio e contract.\nEs.: sedie, tavoli, armadi, divani.",
      en: "Furniture for home, office and contract use.\nE.g. chairs, tables, wardrobes, sofas.",
    },
    furn_mattresses: {
      it: "Materassi e prodotti per il riposo, tra i gruppi indicati dal piano di lavoro ESPR.\nEs.: materassi a molle, in memory foam, in lattice.",
      en: "Mattresses and sleep products, among the groups in the ESPR working plan.\nE.g. spring, memory foam, latex mattresses.",
    },
    metal_steel: {
      it: "Semilavorati e prodotti in ferro e acciaio.\nEs.: coils, lamiere, tondo per cemento armato, tubi.",
      en: "Iron and steel semi-finished and finished products.\nE.g. coils, sheets, rebar, tubes.",
    },
    metal_aluminium: {
      it: "Semilavorati e prodotti in alluminio.\nEs.: profilati estrusi, laminati, fogli.",
      en: "Aluminium semi-finished and finished products.\nE.g. extruded profiles, rolled products, foil.",
    },
    tyres_car: {
      it: "Pneumatici per autovetture.\nEs.: pneumatici estivi, invernali, quattro stagioni.",
      en: "Passenger car tyres.\nE.g. summer, winter, all-season tyres.",
    },
    tyres_commercial: {
      it: "Pneumatici per furgoni, autocarri, autobus e mezzi da lavoro.\nEs.: pneumatici per camion, per macchine agricole.",
      en: "Tyres for vans, trucks, buses and work vehicles.\nE.g. truck tyres, agricultural machinery tyres.",
    },
    constr_materials: {
      it: "Materiali di base per l'edilizia.\nEs.: cemento, calcestruzzo, pannelli isolanti, mattoni.",
      en: "Basic building materials.\nE.g. cement, concrete, insulation panels, bricks.",
    },
    constr_components: {
      it: "Componenti e sistemi pronti da installare.\nEs.: finestre, porte, travi prefabbricate, impianti.",
      en: "Components and systems ready to install.\nE.g. windows, doors, prefabricated beams, building services.",
    },
    other_category: {
      it: "Una categoria non compresa nell'elenco del settore scelto: puoi descriverla all'esperto con \"Chiedi un aiuto\" in fondo alla pagina.",
      en: "A category not in the list for your sector: you can describe it to the expert with \"Ask for help\" at the bottom of the page.",
    },
  },

  company_type: {
    manufacturer: {
      it: "Fabbricate il prodotto, o lo fate fabbricare, e lo immettete sul mercato con il vostro nome.\nEs.: un'azienda che produce batterie nel proprio stabilimento.",
      en: "You make the product, or have it made, and place it on the market under your name.\nE.g. a company making batteries in its own plant.",
    },
    brand: {
      it: "Vendete con il vostro marchio prodotti realizzati da terzi: per la normativa, di solito siete il fabbricante.\nEs.: un marchio di moda che produce tramite laboratori esterni.",
      en: "You sell products made by others under your brand: in regulatory terms you are usually the manufacturer.\nE.g. a fashion brand producing through external workshops.",
    },
    importer: {
      it: "Immettete sul mercato UE prodotti fabbricati fuori dall'Unione.\nEs.: un'azienda che importa elettronica dall'Asia.",
      en: "You place products made outside the EU on the EU market.\nE.g. a company importing electronics from Asia.",
    },
    distributor: {
      it: "Rivendete ad altre aziende prodotti già immessi sul mercato da altri.\nEs.: un grossista di materiale elettrico.",
      en: "You resell to other businesses products already placed on the market by others.\nE.g. an electrical wholesaler.",
    },
    retailer: {
      it: "Vendete al consumatore finale, in negozio oppure online.\nEs.: una catena di negozi o un e-commerce.",
      en: "You sell to end consumers, in store or online.\nE.g. a retail chain or an online shop.",
    },
    other: {
      it: "Un ruolo diverso da quelli elencati.\nEs.: rigeneratore, riparatore, piattaforma di vendita online.",
      en: "A role other than those listed.\nE.g. remanufacturer, repairer, online marketplace.",
    },
  },

  production_model: {
    in_house: {
      it: "Il prodotto è realizzato nei vostri stabilimenti: gran parte dei dati è già in casa.\nEs.: lotti, materiali e consumi registrati dal vostro MES.",
      en: "The product is made in your own plants: most data is already in-house.\nE.g. batches, materials and consumption recorded by your MES.",
    },
    suppliers: {
      it: "La produzione è affidata a terzi: molti dati andranno raccolti dai fornitori.\nEs.: composizione dei tessuti fornita dal laboratorio di confezione.",
      en: "Production is outsourced: much of the data will have to be collected from suppliers.\nE.g. fabric composition provided by the garment maker.",
    },
    both: {
      it: "Una parte è prodotta internamente, un'altra da fornitori.\nEs.: assemblaggio in casa con componenti acquistati.",
      en: "Some is made in-house, some by suppliers.\nE.g. in-house assembly with purchased components.",
    },
  },

  dpp_owner: {
    sustainability: {
      it: "Il progetto è guidato dall'area sostenibilità, che conosce già metriche e rendicontazione ambientale.\nEs.: il team che redige il report ESG.",
      en: "The project is led by sustainability, which already knows environmental metrics and reporting.\nE.g. the team writing the ESG report.",
    },
    quality: {
      it: "Il progetto è guidato da qualità o compliance, che gestiscono certificazioni e dichiarazioni di conformità.\nEs.: l'ufficio che prepara il fascicolo tecnico.",
      en: "The project is led by quality or compliance, who manage certifications and declarations of conformity.\nE.g. the office preparing the technical file.",
    },
    it: {
      it: "Il progetto è guidato dai sistemi informativi, che governano integrazioni e piattaforme.\nEs.: il team che gestisce ERP e sito web.",
      en: "The project is led by IT, who run integrations and platforms.\nE.g. the team managing the ERP and website.",
    },
    product: {
      it: "Il progetto è guidato da chi progetta il prodotto e ne conosce materiali e componenti.\nEs.: l'ufficio tecnico o R&D.",
      en: "The project is led by those who design the product and know its materials and components.\nE.g. engineering or R&D.",
    },
    undefined: {
      it: "Non c'è ancora un responsabile: individuarlo è uno dei primi passi consigliati.",
      en: "There is no owner yet: appointing one is among the first recommended steps.",
    },
  },

  dpp_granularity: {
    model: {
      it: "Un passaporto per ogni modello: tutti i prodotti dello stesso modello condividono gli stessi dati.\nEs.: tutte le sedie del modello \"Aria\".",
      en: "One passport per model: all products of the same model share the same data.\nE.g. every chair of the \"Aria\" model.",
    },
    batch: {
      it: "Un passaporto per ogni lotto di produzione, con i dati di quel lotto.\nEs.: le 500 magliette prodotte il 3 marzo con lo stesso cotone.",
      en: "One passport per production batch, with that batch's data.\nE.g. the 500 T-shirts made on 3 March from the same cotton.",
    },
    item: {
      it: "Un passaporto per ogni singolo pezzo, identificato dal numero di serie.\nEs.: ogni batteria di auto elettrica, con il suo stato di salute.",
      en: "One passport per individual item, identified by its serial number.\nE.g. each electric car battery, with its state of health.",
    },
    unsure: {
      it: "Non sapete ancora quale livello serve: ve lo indicheremo nei risultati.",
      en: "You don't know yet which level applies: the results will tell you.",
    },
  },

  maintenance: {
    yes: {
      it: "Il prodotto viene riparato o mantenuto durante la sua vita.\nEs.: sostituzione delle celle di una batteria, risuolatura di una scarpa.",
      en: "The product is repaired or maintained during its life.\nE.g. replacing battery cells, resoling a shoe.",
    },
    no: {
      it: "Il prodotto non prevede riparazioni o manutenzione.\nEs.: un isolante posato in un muro.",
      en: "The product is not repaired or maintained.\nE.g. insulation installed in a wall.",
    },
    depends: {
      it: "Dipende dal prodotto della categoria.\nEs.: un divano riparabile e una sedia monoblocco nella stessa linea.",
      en: "It depends on the product within the category.\nE.g. a repairable sofa and a one-piece chair in the same range.",
    },
  },

  data_dynamics: {
    static: {
      it: "Dati fissati alla produzione, che non cambiano più.\nEs.: composizione, paese di origine.",
      en: "Data fixed at production that never changes.\nE.g. composition, country of origin.",
    },
    dynamic: {
      it: "Dati che cambiano durante la vita del prodotto.\nEs.: riparazioni eseguite, stato di salute, proprietario.",
      en: "Data that changes during the product's life.\nE.g. repairs carried out, state of health, owner.",
    },
    mixed: {
      it: "Una parte dei dati è statica, una parte cambia nel tempo.\nEs.: composizione fissa e storico delle riparazioni.",
      en: "Some data is static, some changes over time.\nE.g. fixed composition and repair history.",
    },
  },

  data_sources: {
    suppliers_excel: {
      it: "I fornitori mandano i dati in fogli di calcolo o per email.\nEs.: un file Excel con la composizione di ogni articolo.",
      en: "Suppliers send data in spreadsheets or by email.\nE.g. an Excel file with each item's composition.",
    },
    suppliers_pdf: {
      it: "I dati arrivano in documenti PDF, da leggere e trascrivere.\nEs.: schede tecniche, certificati, dichiarazioni di conformità.",
      en: "Data arrives in PDF documents that must be read and transcribed.\nE.g. data sheets, certificates, declarations of conformity.",
    },
    manual: {
      it: "Qualcuno inserisce i dati a mano, in un sistema o in un file.\nEs.: un operatore che compila le schede prodotto.",
      en: "Someone enters data by hand, in a system or a file.\nE.g. an operator filling in product sheets.",
    },
  },

  supplier_count: {
    none: {
      it: "Tutti i dati necessari sono prodotti internamente.",
      en: "All the data needed is produced in-house.",
    },
    "1_10": {
      it: "Pochi fornitori: la raccolta dati si può organizzare caso per caso.\nEs.: un fornitore di tessuti e due di accessori.",
      en: "A few suppliers: data collection can be arranged one by one.\nE.g. one fabric and two trims suppliers.",
    },
    "11_50": {
      it: "Un numero medio di fornitori: serve un modello di raccolta dati comune.\nEs.: un questionario standard per tutti.",
      en: "A medium number of suppliers: a common data collection template is needed.\nE.g. one standard questionnaire for all.",
    },
    over_50: {
      it: "Molti fornitori: conviene un portale o uno scambio dati automatico.\nEs.: un portale dove ogni fornitore carica i propri dati.",
      en: "Many suppliers: a portal or automated data exchange pays off.\nE.g. a portal where each supplier uploads its data.",
    },
  },

  data_organization: {
    centralized: {
      it: "I dati di prodotto stanno in un unico sistema di riferimento.\nEs.: un PIM o l'ERP con tutte le schede prodotto.",
      en: "Product data lives in a single reference system.\nE.g. a PIM or the ERP holding every product sheet.",
    },
    decentralized: {
      it: "I dati sono divisi tra più sistemi che vanno collegati.\nEs.: distinte nel PLM, lotti nel MES, certificati in una cartella condivisa.",
      en: "Data is split across several systems that need connecting.\nE.g. BOMs in the PLM, batches in the MES, certificates in a shared folder.",
    },
    unorganized: {
      it: "I dati sono sparsi tra file, email e persone, senza un sistema di riferimento.\nEs.: fogli Excel salvati sui singoli computer.",
      en: "Data is scattered across files, emails and people, with no reference system.\nE.g. Excel sheets saved on individual computers.",
    },
  },

  data_model: {
    materials: {
      it: "Materiali e componenti del prodotto, con le relative percentuali.\nEs.: 80% cotone, 20% poliestere.",
      en: "The product's materials and components, with percentages.\nE.g. 80% cotton, 20% polyester.",
    },
    origin: {
      it: "Dove è stato fabbricato il prodotto e da dove vengono i materiali.\nEs.: confezionato in Italia, cotone dalla Turchia.",
      en: "Where the product was made and where the materials come from.\nE.g. made in Italy, cotton from Turkey.",
    },
    sustainability: {
      it: "Indicatori ambientali calcolati sul prodotto.\nEs.: impronta di carbonio di 12 kg CO₂e per unità.",
      en: "Environmental indicators calculated for the product.\nE.g. carbon footprint of 12 kg CO₂e per unit.",
    },
    end_of_life: {
      it: "Come smontare, riciclare o smaltire il prodotto a fine vita.\nEs.: separare la batteria prima del conferimento.",
      en: "How to dismantle, recycle or dispose of the product at end of life.\nE.g. remove the battery before disposal.",
    },
    compliance_docs: {
      it: "Documenti che attestano la conformità alle norme.\nEs.: dichiarazione di conformità UE, certificati, rapporti di prova.",
      en: "Documents proving compliance with the rules.\nE.g. EU declaration of conformity, certificates, test reports.",
    },
    repair_info: {
      it: "Come riparare il prodotto e dove trovare i ricambi.\nEs.: manuale di riparazione e codici dei pezzi di ricambio.",
      en: "How to repair the product and where to find spare parts.\nE.g. repair manual and spare part codes.",
    },
    substances: {
      it: "Sostanze preoccupanti presenti nel prodotto, con la loro concentrazione.\nEs.: sostanze dell'elenco REACH (SVHC) oltre lo 0,1%.",
      en: "Substances of concern in the product, with their concentration.\nE.g. REACH candidate list substances (SVHC) above 0.1%.",
    },
    recycled_content: {
      it: "Quota di materiale riciclato presente nel prodotto.\nEs.: 30% di alluminio riciclato.",
      en: "Share of recycled material in the product.\nE.g. 30% recycled aluminium.",
    },
    durability: {
      it: "Quanto dura il prodotto e come si comporta nell'uso.\nEs.: 1.000 cicli di ricarica, garanzia di 5 anni.",
      en: "How long the product lasts and how it performs in use.\nE.g. 1,000 charge cycles, 5-year warranty.",
    },
    instructions: {
      it: "Come usare il prodotto in modo corretto e sicuro.\nEs.: istruzioni di lavaggio, avvertenze di sicurezza.",
      en: "How to use the product correctly and safely.\nE.g. washing instructions, safety warnings.",
    },
    state_of_health: {
      it: "Capacità residua e condizioni della batteria, aggiornate nel tempo.\nEs.: capacità residua all'85% dopo 3 anni.",
      en: "Remaining capacity and condition of the battery, updated over time.\nE.g. 85% remaining capacity after 3 years.",
    },
  },

  qr_presence: {
    qr: {
      it: "Sul prodotto o sull'etichetta c'è già un QR code.\nEs.: un QR che porta alla scheda prodotto sul sito.",
      en: "There is already a QR code on the product or label.\nE.g. a QR code linking to the product page on your website.",
    },
    other_carrier: {
      it: "Usate già un altro supporto leggibile da dispositivo.\nEs.: tag RFID nelle etichette, chip NFC, codice Data Matrix.",
      en: "You already use another machine-readable carrier.\nE.g. RFID tags in labels, NFC chips, Data Matrix codes.",
    },
    none: {
      it: "Oggi sul prodotto non c'è alcun codice leggibile da dispositivo, oppure c'è solo il codice a barre.",
      en: "Today there is no machine-readable code on the product, or only a barcode.",
    },
  },

  carrier_placement: {
    product: {
      it: "Il codice è stampato, inciso o applicato sul prodotto stesso: è la soluzione preferita dall'ESPR.\nEs.: QR inciso al laser su un profilato, etichetta cucita in un capo.",
      en: "The code is printed, engraved or affixed on the product itself: the option ESPR prefers.\nE.g. laser-engraved QR on a profile, label sewn into a garment.",
    },
    packaging: {
      it: "Il codice è sulla confezione, quando non è possibile metterlo sul prodotto.\nEs.: QR sulla scatola di un piccolo elettrodomestico.",
      en: "The code is on the packaging, where it cannot go on the product.\nE.g. QR on the box of a small appliance.",
    },
    documentation: {
      it: "Il codice è nei documenti che accompagnano il prodotto.\nEs.: QR sul documento di trasporto o nel manuale.",
      en: "The code is in the documents accompanying the product.\nE.g. QR on the delivery note or in the manual.",
    },
    unsure: {
      it: "Non sapete ancora dove posizionarlo: ve lo indicheremo nei risultati.",
      en: "You don't know yet where to place it: the results will tell you.",
    },
  },

  url_scheme: {
    self_digital_link: {
      it: "Link di identificazione secondo la norma IEC 61406: un indirizzo web univoco e stabile sul dominio del fabbricante.\nEs.: `https://id.azienda.it/MOD123/SN000123`",
      en: "Identification link under IEC 61406: a unique, stable web address on the manufacturer's domain.\nE.g. `https://id.company.com/MOD123/SN000123`",
    },
    iso_digital_link: {
      it: "Identificativo univoco secondo ISO/IEC 15459, con i data identifier ASC MH10 (es. `1P` = codice articolo), risolto da un resolver web.\nEs.: `https://resolver.org/1P/PART1234/S`",
      en: "Unique identifier under ISO/IEC 15459, with ASC MH10 data identifiers (e.g. `1P` = part number), resolved by a web resolver.\nE.g. `https://resolver.org/1P/PART1234/S`",
    },
    decentralized_digital_link: {
      it: "Identificativi decentralizzati (standard W3C) verificabili senza un'autorità centrale.\nEs.: `did:web:id.azienda.it:prodotti:MOD123`",
      en: "Decentralized identifiers (W3C standard) verifiable without a central authority.\nE.g. `did:web:id.company.com:products:MOD123`",
    },
    doi_digital_link: {
      it: "Identificativo persistente, nato per pubblicazioni e dati, risolto tramite doi.org.\nEs.: `https://doi.org/10.1234/azienda.mod123`",
      en: "Persistent identifier, born for publications and data, resolved through doi.org.\nE.g. `https://doi.org/10.1234/company.mod123`",
    },
    unsure: {
      it: "Non avete ancora scelto lo schema: ve lo indicheremo nei risultati.",
      en: "You haven't chosen a scheme yet: the results will tell you.",
    },
  },

  hosting: {
    undecided: {
      it: "Non avete ancora scelto come ospitare i passaporti: ne parleremo nei risultati.",
      en: "You haven't chosen how to host the passports yet: the results will cover it.",
    },
  },

  data_access: {
    consumers: {
      it: "Chi acquista e usa il prodotto: vede le informazioni pubbliche.\nEs.: composizione, istruzioni d'uso e di riciclo.",
      en: "Whoever buys and uses the product: sees the public information.\nE.g. composition, use and recycling instructions.",
    },
    b2b: {
      it: "Clienti professionali e partner della filiera, che possono avere accesso a dati riservati.\nEs.: dati tecnici per un costruttore che integra il vostro componente.",
      en: "Business customers and supply chain partners, who may access restricted data.\nE.g. technical data for a manufacturer integrating your component.",
    },
    repairers: {
      it: "Tecnici che riparano o mantengono il prodotto.\nEs.: schemi di smontaggio e codici dei ricambi.",
      en: "Technicians who repair or maintain the product.\nE.g. disassembly diagrams and spare part codes.",
    },
    recyclers: {
      it: "Chi gestisce il prodotto a fine vita.\nEs.: materiali presenti, sostanze pericolose, istruzioni di smontaggio.",
      en: "Those who handle the product at end of life.\nE.g. materials present, hazardous substances, dismantling instructions.",
    },
    authorities: {
      it: "Autorità di vigilanza del mercato e dogane, che controllano la conformità.\nEs.: dichiarazione di conformità e documentazione tecnica.",
      en: "Market surveillance authorities and customs, who check compliance.\nE.g. declaration of conformity and technical documentation.",
    },
  },

  registry_integration: {
    direct: {
      it: "Vi collegherete voi al registro UE dei passaporti tramite le sue interfacce.\nEs.: il vostro sistema invia l'identificativo di ogni passaporto al registro.",
      en: "You will connect to the EU passport registry yourselves through its interfaces.\nE.g. your system sends each passport identifier to the registry.",
    },
    via_provider: {
      it: "Se ne occuperà il fornitore della piattaforma DPP.\nEs.: la piattaforma SaaS registra i passaporti per vostro conto.",
      en: "Your DPP platform provider will handle it.\nE.g. the SaaS platform registers passports on your behalf.",
    },
    not_planned: {
      it: "Sapete che serve, ma non l'avete ancora pianificato.",
      en: "You know it's needed but haven't planned it yet.",
    },
    unknown: {
      it: "Il registro UE raccoglie gli identificativi di tutti i passaporti: ne parleremo nei risultati.",
      en: "The EU registry collects the identifiers of all passports: the results will cover it.",
    },
  },
};

async function main() {
  const version = await db.wizardVersion.findFirstOrThrow({ where: { number: VERSION_NUMBER } });
  const steps = await db.step.findMany({
    where: { versionId: version.id },
    include: { options: { include: { translations: true } } },
  });
  let written = 0;
  const missing: string[] = [];

  for (const step of steps) {
    for (const option of step.options) {
      const text = D[step.key]?.[option.key];
      for (const locale of ["it", "en"] as const) {
        const tr = option.translations.find((t) => t.locale === locale);
        if (!tr || tr.description?.trim()) continue;
        if (!text) {
          missing.push(`${step.key}.${option.key} (${locale})`);
          continue;
        }
        await db.optionTranslation.update({ where: { id: tr.id }, data: { description: text[locale] } });
        written++;
      }
    }
  }

  console.log(`v${VERSION_NUMBER} (${version.status}): ${written} descrizioni scritte`);
  if (missing.length) console.log(`Senza testo predefinito: ${missing.join(", ")}`);
}

main().finally(() => db.$disconnect());
