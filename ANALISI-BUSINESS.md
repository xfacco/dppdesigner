# Analisi di Business — Digital Product Passport (DPP) Designer

Questo documento descrive gli obiettivi commerciali, il contesto normativo ESPR, la struttura del prodotto dal lato utente e lo scope funzionale dell'MVP per il progetto Digital Product Passport Designer. Include roadmap di lead generation, profilo del mercato e punti critici di validazione normativa.

---

## 1. Obiettivo del Prodotto

L'esperto di Digital Product Passport richiede una piattaforma web che:

1. **Educa il mercato** sulla normativa ESPR e sul concetto di Digital Product Passport
2. **Showcase delle competenze** — posizionamento personale come guida affidabile nel settore del DPP
3. **Genera lead qualificati** tramite un percorso guidato e interattivo: "Progetta il tuo DPP"

### Punto Chiave: Il Progetto del wizard

L'obiettivo del wizard è quello di capire e fornire al cliente le indicazioni e gli step per implementare il digital product passport.
Indicando gli step da seguire e dando un punteggio alla sua consapevolezza e stato attuale per la realizzazione di un progetto DPP.
Gli step sono conseguenziali e dipendenti dagli step precedenti.
Gli step non sono fissi: sono definiti dinamicamente nel database e gestiti dalla dashboard admin (aggiunta di step, variabili e dipendenze).
Il wizard si compila senza account: tutti gli step e i dati inseriti vengono salvati durante il progetto. A fine progetto il cliente / prospect, se vuole mantenere i dati, si registra (email + password); da quel momento può accedere al proprio account per rivederli e modificarli. Anche i progetti non registrati restano salvati nel database (senza dati personali) e sono consultabili dalla dashboard admin.

L'elenco seguente è la configurazione iniziale del wizard:


Il progetto "Progetta" inizia da:

- **Scelta industry di riferimento**  (Battery, Fashion ... — elenco gestito da admin e aggiornato secondo la normativa)
- **Scelta tipologia di azienda**  (Produttori, rivenditori, brand ... tutti)
- **Siamo produttori o abbiamo fornitori**  (Produttore, Fornitore, Entrambi)
- **Quanti prodotti diversi (SKU) all'anno?**
- **Nome e dati di un prodotto di esempio**
- **Il prodotto richiede manutenzione**
- **Il prodotto ha dati dinamici o statici**
- **Come recuperare i dati** che finiranno nel DPP? (Da Fornitori (Excel, API ..), Dal processo produttivo (sistemi gestionali, MES, PLM; ...))
- **Come sono organizzati** (Centralizzati, decentralizzati in diversi sistemi o disorganizzati)?
- **Quale modello dati in base alla industry** occorre costruire (materiali, origine, sostenibilità, guida fine-vita — elenco gestito da admin e aggiornato secondo la normativa)?
- **Presenza del QR code sul prodotto** 
- **Come deve essere il QRCode art. 13 o art. 77 della normativa** *(da verificare: gli art. 13 e 77 sembrano riferiti al Regolamento Batterie 2023/1542, non all'ESPR — specificare il regolamento)*  
- **Scelta DPP per modello, lotto o singolo prodotto**
- **Scelta schema url EN 18219**
- **Dove ospitare** Piattaforma proprietaria, Licenza SaaS, Licenza PaaS ..
- **Come integrarsi** con il Registry UE centrale?

Il progetto **avanza progressivamente** arriva ad una pagina di riassunto con **punteggio di maturità personalizzato** (regole di scoring da validare in un secondo momento) + schema architettura + consigli per i prossimi step + **lead capture qualificato** (registrazione per salvare il progetto).

---

## 2. Contesto Normativo (ESPR) — Fondamenti

### Regolamento ESPR

Il **Regolamento Ecodesign for Sustainable Products (ESPR)** introduce il Digital Product Passport come mezzo obbligatorio per comunicare i dati di sostenibilità e ciclo di vita dei prodotti.

### Registry UE Centrale

- **Operativo dal 19 luglio 2026** (Art. 13 ESPR)
- Funge da **risolutore centralizzato**: risolve un identificativo statico (presente sul data carrier) verso il "data host" approvato del produttore
- Il data host è il server dell'azienda che ospita il passaporto live e aggiornabile

### Data Carrier (Art. 10 ESPR)

Il data carrier (QR code, RFID, NFC) reca **solo un identificativo univoco e statico**:
- Non contiene i dati del passaporto (il passaporto risiede nel data host)
- È il ponte tra il prodotto fisico e il Registry UE
- Formati aperti e interoperabili — **niente vendor lock-in**

### Dati Core

I dati obbligatori del DPP includono:
- Identificativo univoco del prodotto
- Origine e provenienza dei materiali
- Metriche di sostenibilità (impronta di carbonio, riciclabilità, etc.)
- Guida completa per fine-vita e circolarità

### Timeline Indicativa per Settore

| Settore | Scadenza Indicativa | Note |
|---------|---------------------|------|
| Batterie | Feb 2027 (passaporto batterie) | Regolamento (UE) 2023/1542 |
| Tessile | ~2027 | Primissima ondata ESPR |
| Elettronica | ~2028 | Segue tessile |
| Costruzioni | ~2028-2029 | Regolamento Prodotti da Costruzione (CPR), non ESPR |

> Timeline da verificare sul working plan ESPR della Commissione (priorità attuali: tessile, acciaio/alluminio, mobili, pneumatici, materassi).

### Fonti

- https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/dpp-registry_en
- https://cirpass2.eu/

---

## 3. Struttura del Prodotto

### 3.1 Sito di Marketing e Contenuti (Bilingue Italiano e Inglese)

Sezioni principali:
- **Home / Landing Page** — Introduzione, value proposition, CTA verso Wizard
- **Cos'è il DPP** — Guida educativa, illustrazioni, FAQ
- **Normativa ESPR & Timeline** — Contesto regolatorio, scadenze per settore, obblighi
- **Settori** — Deep-dive per tessile, elettronica, batterie, costruzioni
- **About / Competenze** — Profilo esperto, track record, clienti (se applicabile)
- **Contatti** — Email, modulo rapido

### 3.2 Progetta il tuo DPP (Motore di Lead Generation) Rif. "Punto Chiave: Il Progetto del wizard"

Un **wizard multi-step ordinato** che guida l'utente da una diagnosi iniziale a un punteggio di maturità personalizzato.

---

## 4. Scope MVP

### Incluso

✅ Sito bilingue (IT/EN) con contenuti educativi  
✅ Wizard "Progetta il tuo DPP" con step dinamici definiti su DB e motore di scoring configurabile (regole da validare)  
✅ Wizard compilabile senza account; registrazione a fine progetto (email + password) per salvare i dati  
✅ Login utente con area personale per rivedere e modificare i progetti  
✅ Lead capture su PostgreSQL (form + Server Action)  
✅ Email transazionali minime: verifica email e reset password  
✅ Design system con shadcn/ui e Tailwind  
✅ Deploy config (Vercel, GitHub Actions per build/test)  
✅ i18n routing con next-intl  
✅ Dashboard admin per visualizzazione/esportazione lead  
✅ Dashboard admin per raccolta step wizard ed informazioni 
✅ Dashboard admin per interagire e cambiare gli step del wizard aggiungendo variabili, dipendenze e step.
✅ Dashboard admin per gestire tutti i contenuti del sito in multilingua

### Escluso (Fase 2+)

❌ Email automatiche di follow-up / marketing  
❌ Generazione PDF con report personalizzato  
❌ Integrazione reale API Registry UE  
❌ Sistema CRM o webhooks verso servizi esterni  
❌ Payment / licensing (se previsto)  

---

## 5. Rischi e Note

### Validazione Contenuti Normativi

- **Fonti evolvono:** Le date e le timeline ESPR sono soggette a cambiamenti normativi. Prima della pubblicazione in produzione, validare i contenuti con le fonti ufficiali ESPR della Commissione Europea.
- **Settori non al passo:** Non tutti i settori hanno timeline pubbliche; includere disclaimer dove incertezza.

### Regole di Scoring

- **Da validare:** pesi, aree di maturità e soglie del punteggio saranno definiti in un secondo momento. Il motore viene sviluppato configurabile da admin, con regole di esempio.

### API Registry UE

- **Non integrata nell'MVP:** La vera integrazione con il Registry UE avviene in fase 2+. L'MVP rimane **educativo**: il wizard simula il percorso, ma non sincronizza dati reali con il Registry.

### Data Privacy & Compliance

- **GDPR:** Form lead deve includere consenso esplicito (opt-in) e informativa sulla privacy.
- **Conservazione:** progetti anonimi riprendibili per 30 giorni; dati degli utenti registrati conservati per 24 mesi dall'ultimo accesso, poi cancellati (i progetti restano in forma anonima per le statistiche).
- **Tracciamento:** Se si usa analytics (Vercel Analytics, Segment), dichiarare in privacy policy.

---

**Documento redatto:** 30 ottobre 2026  
**Status:** In revisione  
**Autore:** DPP Design Team  
**Derivato da:** PROJECT-ANALYSIS.md
