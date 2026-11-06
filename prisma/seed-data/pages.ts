/**
 * Contenuti iniziali del sito. Date e riferimenti normativi vanno validati
 * con le fonti ufficiali della Commissione europea prima della pubblicazione.
 */

type Tr = { slug: string; title: string; description: string; body: string };
type PageSeed = { key: string; position: number; showInMenu: boolean; it: Tr; en: Tr };

const DISCLAIMER_IT =
  "> Le date indicate sono orientative e soggette a evoluzione normativa. Verifica sempre le fonti ufficiali della Commissione europea.";
const DISCLAIMER_EN =
  "> Dates are indicative and subject to regulatory change. Always check the European Commission's official sources.";

export const pages: PageSeed[] = [
  {
    key: "home",
    position: 0,
    showInMenu: false,
    it: {
      slug: "home-it",
      title: "Home",
      description: "Scopri cos'è il Digital Product Passport e quanto è pronta la tua azienda.",
      body: `# Preparati al Digital Product Passport

Il Regolamento ESPR introduce il **Digital Product Passport (DPP)**: un passaporto digitale che accompagna il prodotto lungo tutto il ciclo di vita, con dati su materiali, origine, sostenibilità e fine vita.

Capire cosa serve alla tua azienda — dati, processi, tecnologia — è il primo passo.

## Come funziona "Progetta"

1. Rispondi a qualche domanda su settore, prodotto e dati
2. Ottieni un **punteggio di maturità** per area
3. Ricevi uno **schema di architettura** e i **prossimi passi consigliati**

Non serve registrarsi per iniziare.`,
    },
    en: {
      slug: "home-en",
      title: "Home",
      description: "Learn what the Digital Product Passport is and how ready your company is.",
      body: `# Get ready for the Digital Product Passport

The ESPR Regulation introduces the **Digital Product Passport (DPP)**: a digital passport that follows the product throughout its life cycle, with data on materials, origin, sustainability and end of life.

Understanding what your company needs — data, processes, technology — is the first step.

## How "Design" works

1. Answer a few questions about your industry, product and data
2. Get a **maturity score** by area
3. Receive an **architecture sketch** and **recommended next steps**

No sign-up needed to start.`,
    },
  },
  {
    key: "wizard_intro",
    position: 0,
    showInMenu: false,
    it: {
      slug: "wizard-intro-it",
      title: "Progetta il tuo DPP",
      description: "Progetta il Digital Product Passport della tua azienda: punteggio di maturità, architettura e prossimi passi.",
      body: `# Progetta il tuo Digital Product Passport

Rispondi a qualche domanda sulla tua azienda e sul tuo prodotto. Alla fine otterrai:

- un **punteggio di maturità** per dati, processi e tecnologia
- uno **schema di architettura** del tuo DPP
- i **prossimi passi consigliati**

Per iniziare basta un account gratuito, con email e password: il progetto resta salvato e lo ritrovi da qualsiasi dispositivo.`,
    },
    en: {
      slug: "wizard-intro-en",
      title: "Design your DPP",
      description: "Design your company's Digital Product Passport: maturity score, architecture and next steps.",
      body: `# Design your Digital Product Passport

Answer a few questions about your company and product. At the end you will get:

- a **maturity score** for data, processes and technology
- an **architecture sketch** of your DPP
- **recommended next steps**

All you need to start is a free account with an email and a password: your project is saved and you can open it from any device.`,
    },
  },
  {
    key: "what_is_dpp",
    position: 1,
    showInMenu: true,
    it: {
      slug: "cos-e-il-dpp",
      title: "Cos'è il DPP",
      description: "Il Digital Product Passport spiegato in modo semplice.",
      body: `# Cos'è il Digital Product Passport

Il Digital Product Passport è un insieme di dati sul prodotto, accessibile in formato digitale tramite un **data carrier** applicato al prodotto (ad esempio un QR code).

## Come è fatto

- **Data carrier** — reca un identificativo univoco e persistente del prodotto. Non contiene i dati del passaporto.
- **Data host** — il sistema che ospita il passaporto vero e proprio, aggiornabile nel tempo.
- **Registry UE** — il registro centrale che collega l'identificativo al data host.

## Quali dati contiene

I dati richiesti sono definiti dagli atti delegati per ciascuna categoria di prodotto. In generale riguardano:

- identificativo univoco del prodotto
- composizione, materiali e loro origine
- metriche di sostenibilità (es. impronta di carbonio, riciclabilità)
- informazioni per riparazione, riuso e fine vita

## Domande frequenti

**Il QR code contiene tutti i dati?**
No: contiene un identificativo che rimanda al passaporto ospitato dal data host.

**Serve una piattaforma specifica?**
No, i formati devono essere aperti e interoperabili: puoi scegliere tra soluzione proprietaria, SaaS o PaaS.`,
    },
    en: {
      slug: "what-is-dpp",
      title: "What is the DPP",
      description: "The Digital Product Passport explained simply.",
      body: `# What is the Digital Product Passport

The Digital Product Passport is a set of product data, accessible digitally through a **data carrier** applied to the product (for example a QR code).

## How it works

- **Data carrier** — carries a unique, persistent product identifier. It does not contain the passport data.
- **Data host** — the system hosting the actual passport, which can be updated over time.
- **EU Registry** — the central registry linking the identifier to the data host.

## What data it contains

Required data is defined by delegated acts for each product category. In general it covers:

- unique product identifier
- composition, materials and their origin
- sustainability metrics (e.g. carbon footprint, recyclability)
- information for repair, reuse and end of life

## FAQ

**Does the QR code contain all the data?**
No: it carries an identifier pointing to the passport served by the data host.

**Do I need a specific platform?**
No, formats must be open and interoperable: you can choose a proprietary, SaaS or PaaS solution.`,
    },
  },
  {
    key: "espr",
    position: 2,
    showInMenu: true,
    it: {
      slug: "normativa-espr",
      title: "Normativa ESPR",
      description: "Il Regolamento ESPR, il Registry UE e le tempistiche per settore.",
      body: `# Normativa ESPR e tempistiche

Il **Regolamento (UE) 2024/1781 sulla progettazione ecocompatibile dei prodotti sostenibili (ESPR)** introduce il Digital Product Passport come strumento per comunicare dati di sostenibilità e ciclo di vita.

## Registry UE

Il registro centrale dei DPP è previsto dall'art. 13 ESPR, con istituzione entro il **19 luglio 2026**. Collega l'identificativo presente sul data carrier al data host del passaporto.

## Tempistiche indicative per settore

| Settore | Riferimento | Tempistica indicativa |
|---|---|---|
| Batterie | Regolamento (UE) 2023/1542 | Passaporto batterie da febbraio 2027 |
| Tessile | ESPR, atto delegato | Tra le prime categorie del piano di lavoro |
| Ferro, acciaio, alluminio | ESPR, atto delegato | Tra le prime categorie del piano di lavoro |
| Elettronica | ESPR, atti delegati | Fasi successive |
| Prodotti da costruzione | Regolamento (UE) 2024/3110 (CPR) | Secondo le specifiche tecniche CPR |

${DISCLAIMER_IT}

## Fonti

- [DPP Registry — Commissione europea](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/dpp-registry_en)
- [CIRPASS-2](https://cirpass2.eu/)`,
    },
    en: {
      slug: "espr-regulation",
      title: "ESPR Regulation",
      description: "The ESPR Regulation, the EU Registry and sector timelines.",
      body: `# ESPR Regulation and timelines

The **Ecodesign for Sustainable Products Regulation (EU) 2024/1781 (ESPR)** introduces the Digital Product Passport as the tool to communicate sustainability and life-cycle data.

## EU Registry

The central DPP registry is set out in Article 13 ESPR, to be established by **19 July 2026**. It links the identifier on the data carrier to the passport's data host.

## Indicative timelines by sector

| Sector | Reference | Indicative timeline |
|---|---|---|
| Batteries | Regulation (EU) 2023/1542 | Battery passport from February 2027 |
| Textiles | ESPR, delegated act | Among the first working plan categories |
| Iron, steel, aluminium | ESPR, delegated act | Among the first working plan categories |
| Electronics | ESPR, delegated acts | Later phases |
| Construction products | Regulation (EU) 2024/3110 (CPR) | According to CPR technical specifications |

${DISCLAIMER_EN}

## Sources

- [DPP Registry — European Commission](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/dpp-registry_en)
- [CIRPASS-2](https://cirpass2.eu/)`,
    },
  },
  {
    key: "sectors",
    position: 3,
    showInMenu: true,
    it: {
      slug: "settori",
      title: "Settori",
      description: "Il DPP nei settori tessile, elettronica, batterie e costruzioni.",
      body: `# Settori

## Batterie
Il Regolamento Batterie prevede un passaporto dedicato per batterie industriali, per veicoli elettrici e per mezzi di trasporto leggeri sopra determinate soglie.

## Tessile e moda
Tra le prime categorie ESPR. Dati chiave: composizione delle fibre, origine, riciclabilità, sostanze, istruzioni di cura e fine vita.

## Elettronica
Riparabilità, disponibilità di ricambi e aggiornamenti software sono al centro dei requisiti attesi.

## Costruzioni
I prodotti da costruzione seguono il nuovo Regolamento Prodotti da Costruzione (CPR), che prevede anch'esso un passaporto digitale.

${DISCLAIMER_IT}`,
    },
    en: {
      slug: "sectors",
      title: "Sectors",
      description: "The DPP in textiles, electronics, batteries and construction.",
      body: `# Sectors

## Batteries
The Battery Regulation sets out a dedicated passport for industrial batteries, electric vehicle batteries and light means of transport batteries above certain thresholds.

## Textiles and fashion
Among the first ESPR categories. Key data: fibre composition, origin, recyclability, substances, care and end-of-life instructions.

## Electronics
Reparability, spare parts availability and software updates are at the core of expected requirements.

## Construction
Construction products follow the new Construction Products Regulation (CPR), which also provides for a digital passport.

${DISCLAIMER_EN}`,
    },
  },
  {
    key: "about",
    position: 4,
    showInMenu: true,
    it: {
      slug: "chi-sono",
      title: "Chi sono",
      description: "Esperienza e competenze sul Digital Product Passport.",
      body: `# Chi sono

*Testo da completare: profilo, esperienza, progetti e competenze sul Digital Product Passport.*`,
    },
    en: {
      slug: "about",
      title: "About",
      description: "Experience and expertise on the Digital Product Passport.",
      body: `# About

*Text to be completed: profile, experience, projects and expertise on the Digital Product Passport.*`,
    },
  },
  {
    key: "contacts",
    position: 5,
    showInMenu: true,
    it: {
      slug: "contatti",
      title: "Contatti",
      description: "Scrivici per un confronto sul tuo progetto DPP.",
      body: `# Contatti

Vuoi approfondire il tuo progetto di Digital Product Passport? Scrivici.`,
    },
    en: {
      slug: "contact",
      title: "Contact",
      description: "Get in touch to discuss your DPP project.",
      body: `# Contact

Want to discuss your Digital Product Passport project? Get in touch.`,
    },
  },
  {
    key: "privacy",
    position: 6,
    showInMenu: false,
    it: {
      slug: "privacy",
      title: "Informativa privacy",
      description: "Come trattiamo i tuoi dati.",
      body: `# Informativa privacy

*Bozza da validare con il consulente privacy.*

## Progetti DPP (Progetta)
Per compilare il wizard serve un account. Le risposte (dati aziendali e di prodotto) sono salvate nel tuo account e conservate anche per finalità statistiche.

## Domande sugli step
In ogni step puoi fare una domanda all'assistente AI o all'esperto del sito. Domande e risposte sono conservate insieme al progetto. Le domande all'assistente AI, con il contesto dello step e le risposte già date nel progetto, vengono inviate ad Anthropic (fornitore del modello Claude) per generare la risposta. Non inserire dati personali nelle domande.

## Account
Registrandoti fornisci email e password e, facoltativamente, nome, azienda, ruolo e telefono. I dati sono conservati per **24 mesi dall'ultimo accesso**, poi cancellati; i progetti restano in forma anonima.

## I tuoi diritti
Dall'area personale puoi scaricare i tuoi dati ed eliminare l'account in qualsiasi momento.`,
    },
    en: {
      slug: "privacy",
      title: "Privacy notice",
      description: "How we process your data.",
      body: `# Privacy notice

*Draft to be validated with the privacy consultant.*

## DPP projects (Design)
You need an account to fill in the wizard. Answers (company and product data) are saved in your account and also kept for statistical purposes.

## Questions on steps
In each step you can ask the AI assistant or the site's expert a question. Questions and answers are stored with the journey. Questions to the AI assistant, together with the step context and the answers already given in the journey, are sent to Anthropic (provider of the Claude model) to generate the reply. Do not include personal data in your questions.

## Account
When you sign up you provide your email and password and, optionally, your name, company, role and phone. Data is kept for **24 months after your last sign-in**, then deleted; journeys are kept anonymously.

## Your rights
From your account you can download your data and delete your account at any time.`,
    },
  },
  {
    key: "cookies",
    position: 7,
    showInMenu: false,
    it: {
      slug: "cookie-policy",
      title: "Cookie policy",
      description: "Quali cookie usa DPP Designer e come gestire le tue preferenze.",
      body: `# Cookie policy

Questa pagina spiega quali cookie e strumenti simili usa il sito DPP Designer e come puoi gestire le tue scelte.

*Bozza da validare con il consulente privacy.*

## Cosa sono i cookie
I cookie sono piccoli file di testo che un sito salva nel tuo browser per ricordare informazioni tra una pagina e l'altra o tra una visita e l'altra. Strumenti simili, come la memoria del browser (localStorage), funzionano in modo analogo.

## Cookie tecnici
Il sito usa solo cookie tecnici, necessari al suo funzionamento: mantenere l'accesso all'account, riprendere un progetto, ricordare lingua e tema e registrare le tue scelte sui cookie. Per questi cookie non serve il consenso.

## Cookie per statistiche e marketing
Al momento il sito non usa cookie per statistiche o marketing né strumenti di terze parti. Se li attiveremo, saranno elencati qui e verranno usati solo con il tuo consenso.

## Come gestire le tue scelte
Puoi cambiare le preferenze in qualsiasi momento dal pulsante qui sotto o dal link «Preferenze cookie» in fondo a ogni pagina. La scelta vale 6 mesi, poi te la richiederemo. Puoi anche cancellare i cookie dalle impostazioni del browser: in quel caso dovrai accedere di nuovo e il progetto non salvato non potrà essere ripreso.

## Altre informazioni
Per il trattamento dei dati personali vedi l'[Informativa privacy](/it/privacy). Per qualsiasi domanda puoi [contattarci](/it/contatti).`,
    },
    en: {
      slug: "cookie-policy",
      title: "Cookie policy",
      description: "Which cookies DPP Designer uses and how to manage your preferences.",
      body: `# Cookie policy

This page explains which cookies and similar tools the DPP Designer website uses and how you can manage your choices.

*Draft to be validated with the privacy consultant.*

## What cookies are
Cookies are small text files that a website stores in your browser to remember information between pages or visits. Similar tools, such as browser storage (localStorage), work in the same way.

## Technical cookies
The site only uses technical cookies that it needs to work: keeping you signed in, resuming a project, remembering language and theme and storing your cookie choices. These cookies do not require consent.

## Statistics and marketing cookies
At the moment the site does not use statistics or marketing cookies or third-party tools. If we enable them, they will be listed here and used only with your consent.

## How to manage your choices
You can change your preferences at any time with the button below or the «Cookie preferences» link at the bottom of every page. Your choice lasts 6 months, after which we will ask again. You can also delete cookies in your browser settings: you will then need to sign in again and an unsaved project cannot be resumed.

## More information
For the processing of personal data see the [Privacy notice](/en/privacy). For any questions you can [contact us](/en/contact).`,
    },
  },
  {
    key: "marketing",
    position: 8,
    showInMenu: false,
    it: {
      slug: "informazioni-commerciali",
      title: "Informazioni e proposte commerciali",
      description: "Cosa ricevi se acconsenti alle comunicazioni commerciali e come revocare il consenso.",
      body: `# Informazioni e proposte commerciali

*Bozza da validare con il consulente privacy.*

Al momento della registrazione puoi scegliere, in modo facoltativo, di ricevere informazioni e proposte commerciali. Senza questo consenso l'account e il wizard funzionano esattamente allo stesso modo.

## Cosa ricevi
Se acconsenti, possiamo contattarti via email (o per telefono, se ci hai lasciato il numero) per:

- novità su DPP Designer e sulle normative del Digital Product Passport;
- inviti a eventi, webinar e incontri di approfondimento;
- proposte di consulenza e servizi per progettare e realizzare il tuo DPP.

## Quali dati usiamo
Email e, se li hai indicati, nome, azienda, ruolo e telefono. Possiamo tenere conto anche del settore e delle categorie di prodotto dei tuoi progetti, per proporti solo contenuti pertinenti. Non cediamo i tuoi dati a terzi per finalità di marketing.

## Come revocare il consenso
Puoi revocare il consenso in qualsiasi momento, senza alcun costo, [scrivendoci](/it/contatti) o usando il link di disiscrizione presente in ogni email. La revoca non cancella l'account. Se elimini l'account dall'area personale il consenso decade.

## Per quanto tempo
Usiamo i dati per questa finalità finché il consenso è attivo e comunque non oltre la conservazione dell'account (24 mesi dall'ultimo accesso).

Per tutte le altre informazioni sul trattamento dei dati vedi l'[Informativa privacy](/it/privacy).`,
    },
    en: {
      slug: "commercial-communications",
      title: "Information and commercial offers",
      description: "What you receive if you agree to commercial communications and how to withdraw your consent.",
      body: `# Information and commercial offers

*Draft to be validated with the privacy consultant.*

When you sign up you can choose, optionally, to receive information and commercial offers. Without this consent your account and the wizard work exactly the same.

## What you receive
If you agree, we may contact you by email (or by phone, if you gave us your number) about:

- news about DPP Designer and Digital Product Passport regulations;
- invitations to events, webinars and in-depth sessions;
- consulting and service offers to design and build your DPP.

## Which data we use
Your email and, if provided, your name, company, role and phone. We may also take into account the sector and product categories of your projects, so that we only send you relevant content. We do not pass your data on to third parties for marketing purposes.

## How to withdraw your consent
You can withdraw your consent at any time, free of charge, by [contacting us](/en/contact) or using the unsubscribe link in every email. Withdrawing does not delete your account. If you delete your account from your personal area, the consent lapses.

## How long
We use your data for this purpose while your consent is active and in any case no longer than your account is kept (24 months after your last sign-in).

For all other information on how we process your data see the [Privacy notice](/en/privacy).`,
    },
  },
];
