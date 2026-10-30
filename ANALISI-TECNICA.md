# Analisi Tecnica — Digital Product Passport (DPP) Designer

Questo documento descrive l'architettura tecnica, lo stack tecnologico, le decisioni confermate e la roadmap di sviluppo del progetto Digital Product Passport Designer. Include modello dati, motore del wizard, autenticazione, dashboard admin, roadmap a fasi e considerazioni su sicurezza, performance e accessibilità.

---

## 1. Decisioni Confermate

Il layout deve avere un aspetto minimal.

| Aspetto | Decisione |
|--------|-----------|
| **Scope** | Sito contenuti educativi + Wizard guidato ("Progetta il tuo DPP") + Dashboard admin |
| **Stack** | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 |
| **Database** | PostgreSQL via Prisma; provider consigliato Neon |
| **Secrets** | Variabili d'ambiente tramite riferimenti `op://` (1Password); nessun secret in chiaro |
| **Form & Validazione** | react-hook-form + zod; submit tramite Server Action |
| **UI** | shadcn/ui per componenti base |
| **Contenuti** | Gestiti da database e modificabili da dashboard admin (non MDX su file) |
| **Lingue** | Bilingue IT + EN; routing `/it`, `/en`; i18n con `next-intl` |
| **Autenticazione** | Login classico email + password, per utenti (clienti/prospect) e amministratori |
| **Wizard** | Step, opzioni e dipendenze dinamici, definiti nel database e gestiti da admin |
| **Scoring** | Motore configurabile; regole e pesi da validare in un secondo momento |
| **Dashboard Admin** | Inclusa in Fase 1 |

---

## 2. Architettura Tecnica

Il sistema è composto da frontend, backend e database, in un'unica applicazione Next.js:

- **Frontend:** pagine pubbliche (sito, wizard), area utente, area admin
- **Backend:** Server Actions e Route Handlers Next.js; logica di dominio in moduli server-only (`src/server/`)
- **Database:** PostgreSQL (Neon) tramite Prisma

### Stack Principale

- **Framework:** Next.js (App Router)
- **Linguaggio:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui
- **Autenticazione:** Better Auth (email + password, sessioni su DB, adapter Prisma) — alternativa: Auth.js
- **Email transazionali:** provider SMTP/API (es. Resend) solo per verifica email e reset password

### Routing e i18n

- **Routing i18n:** `next-intl` con prefissi di locale `/it` e `/en`
- **Testi di interfaccia** (bottoni, label, errori): file di messaggi `next-intl`
- **Contenuti e wizard** (pagine, step, opzioni): tabelle di traduzione su DB
- **Slug di pagine:** tradotti per lingua (`/it/cos-e-il-dpp`, `/en/what-is-dpp`), salvati su DB
- **SEO:** `hreflang` tra le versioni linguistiche, sitemap generata dal DB
- **Fallback:** riconoscimento della lingua del browser con scelta esplicita dell'utente

### Aree dell'applicazione

| Area | Percorso | Accesso |
|------|----------|---------|
| Sito pubblico | `/[locale]/...` | Tutti |
| Wizard | `/[locale]/progetta` (il vecchio `/readiness` reindirizza qui) | Tutti, anche anonimi; registrazione a fine progetto per salvare i dati (vedi §4.3) |
| Area utente | `/[locale]/account` | Utente registrato — elenco progetti, ripresa e modifica risposte |
| Dashboard admin | `/admin` | Ruoli `ADMIN` / `EDITOR` |

---

## 3. Autenticazione e Ruoli

- **Login:** email + password, con hash della password gestito dalla libreria di autenticazione
- **Registrazione:** con verifica email
- **Reset password:** tramite link via email
- **Sessioni:** salvate su DB, cookie `httpOnly`, `secure`, `sameSite=lax`
- **Ruoli:**
  - `USER` — compila il wizard, rivede e modifica i propri progetti
  - `EDITOR` — gestisce contenuti e configurazione del wizard
  - `ADMIN` — tutto quanto sopra + lead, utenti, export
- **Protezione:** controllo del ruolo lato server su ogni Server Action e pagina admin (non solo nel middleware)
- **Anti-abuso:** rate limit su login, registrazione e reset; CAPTCHA (es. Cloudflare Turnstile) sui form pubblici

---

## 4. Motore del Wizard

### 4.1 Principi

- Gli step **non sono definiti nel codice**: il frontend legge dal DB la definizione del wizard e la renderizza
- Ogni step ha un **tipo di domanda** (scelta singola, scelta multipla, numero, testo, gruppo di campi, **griglia per categorie**: una riga per ogni opzione scelta in uno step precedente, con una o più colonne per riga)
- Ogni step può avere **suggerimenti** (condizione → messaggio ed eventuale opzione consigliata o obbligatoria); nelle griglie sono valutati riga per riga
- Gli step sono **conseguenziali**: la visibilità di uno step o di un'opzione dipende dalle risposte precedenti
- Le dipendenze sono espresse come **regole in JSON** (`{ "step", "op", "value" }` combinabili con `all` / `any` / `not`, vedi `src/lib/wizard/rules.ts`), valutate in modo identico lato server e lato client

### 4.2 Versionamento

- La configurazione del wizard è organizzata in **versioni** (`DRAFT` → `PUBLISHED` → `ARCHIVED`)
- L'admin modifica sempre una versione in bozza; la pubblicazione la rende attiva per i nuovi progetti
- Ogni progetto utente resta legato alla **versione con cui è stato iniziato**, così le risposte già salvate restano coerenti anche se l'admin cambia gli step
- Funzione "migra alla versione corrente" per i progetti aperti (fase successiva)

### 4.3 Salvataggio e ripresa

- Il wizard è **accessibile senza account**: all'avvio viene creato un progetto anonimo, identificato da un token casuale salvato in un cookie `httpOnly` (sul DB se ne conserva solo l'hash)
- Le risposte sono salvate **a ogni step** sul progetto anonimo: l'utente può tornare indietro e modificarle, e riprendere dallo stesso browser finché il progetto non scade
- **A fine progetto**, nella pagina di riepilogo, l'utente può **registrarsi per mantenere i dati**: il progetto anonimo viene associato al nuovo account (o a un account esistente, tramite login)
- Dopo la registrazione l'utente ritrova i propri progetti nell'area personale, da qualsiasi dispositivo, e può rivederli e modificarli
- I progetti anonimi non associati a un account **restano registrati nel DB** (stato, step raggiunto, risposte) e sono consultabili dalla dashboard admin per statistiche e analisi; scade solo il cookie di ripresa
- **Nessun dato personale prima della registrazione:** il wizard raccoglie solo dati di prodotto e di contesto aziendale; i campi di contatto (nome, email, telefono) compaiono solo nel form di registrazione, dove si raccoglie il consenso
- I campi a testo libero sono ridotti al minimo, con lunghezza limitata e avviso "non inserire dati personali"; dove possibile si usano scelte guidate
- Lo step "nome e dati di un prodotto di esempio" chiede solo attributi del prodotto (nome commerciale, categoria, materiali principali), non dati di persone
- Se una risposta modificata invalida step successivi (per via delle dipendenze), quegli step vengono marcati come da rivedere

### 4.4 Scoring

- Il motore calcola un punteggio per **area di maturità** e un punteggio complessivo
- Pesi, aree e soglie sono **configurabili da admin** e legati alla versione del wizard
- **Le regole di scoring sono da validare in un secondo momento**: in Fase 1 il motore viene realizzato con regole di esempio sostituibili

### 4.5 Pagina di riepilogo

- Punteggio complessivo e per area
- Prossimi step consigliati (regole: condizione → raccomandazione, configurabili da admin)
- Due schemi generati dalle risposte e disegnati in SVG, scaricabili in PNG/SVG, con descrizione testuale accessibile:
  - **Flusso dei dati DPP**: fonti dati (fornitori via file/PDF/API, sistemi interni, inserimento manuale) → middle layer di ingestione e normalizzazione (solo se serve) → DPP platform (core engine) → Registro UE
  - **Blueprint del DPP**: tutti gli step raggruppati in aree, ciascuno con risposta e stato; le domande per categoria in un’unica tabella
- Il collegamento tra step e parti degli schemi è configurabile per versione dall'admin (JSON con valori predefiniti)

### 4.6 Domande sugli step

- In ogni step l'utente può chiedere un consiglio all'**assistente AI** (Claude, via Anthropic SDK) o all'**esperto del sito**
- L'AI riceve testo dello step, opzioni, riferimenti normativi e risposte già date (solo dati aziendali e di prodotto); risposta immediata, limite 10 domande per progetto nelle 24 ore
- Le domande all'esperto si gestiscono da **Admin → Domande**; la risposta compare nello step, senza email; limite 5 domande in attesa per progetto
- Tutte le domande sono salvate (tabella `step_questions`) e utili per migliorare testi e riferimenti degli step

---

## 5. Modello Dati (bozza)

### Utenti e accesso

- **`users`** — id, email, nome, cognome, azienda, ruolo aziendale, telefono, ruolo applicativo (`USER`/`EDITOR`/`ADMIN`), lingua preferita, creato il
- **`sessions`, `accounts`, `verifications`** — tabelle gestite dalla libreria di autenticazione
- **`consents`** — id, user_id, tipo (privacy, marketing), versione informativa, valore, data, IP

### Configurazione wizard

- **`wizard_versions`** — id, numero, stato, pubblicato il, pubblicato da
- **`steps`** — id, version_id, chiave, ordine, tipo domanda, obbligatorio, regola di visibilità (JSON)
- **`step_translations`** — step_id, locale, titolo, descrizione, testo di aiuto
- **`options`** — id, step_id, chiave, ordine, regola di visibilità (JSON)
- **`option_translations`** — option_id, locale, etichetta, descrizione
- **`scoring_rules`** — id, version_id, area, condizione (JSON), punti/peso
- **`recommendations`** — id, version_id, condizione (JSON), priorità, con traduzioni

### Progetti utente

- **`journeys`** — id, user_id (nullable finché anonimo), hash del token anonimo, scadenza del token di ripresa, ultimo step raggiunto, locale, version_id, stato (`IN_PROGRESS`/`COMPLETED`), punteggio, punteggio per area (JSON), creato il, aggiornato il, completato il
- **`answers`** — id, journey_id, step_key, valore (JSON), da rivedere (bool), aggiornato il
- **`step_questions`** — id, journey_id, step_key, canale (`AI`/`EXPERT`), stato (`OPEN`/`ANSWERED`), lingua, domanda, risposta, risposto da, date

### Contenuti del sito

- **`pages`** — id, chiave, stato (bozza/pubblicato), ordine nel menu
- **`page_translations`** — page_id, locale, slug, titolo, meta description, corpo (rich text in JSON o Markdown)
- **`contact_messages`** — messaggi dal modulo contatti
- Le liste gestite da admin (industry, tipologie azienda, modelli dati per settore, ecc.) sono le **opzioni degli step** del wizard: non serve una tabella separata

### Lead

Un lead è un **utente registrato** con i suoi progetti: la dashboard lead è una vista su `users` + `journeys` + `consents`, senza una tabella separata. I progetti anonimi non sono lead, ma restano nel DB e alimentano le statistiche di completamento e abbandono.

---

## 6. Dashboard Admin (Fase 1)

| Modulo | Funzioni |
|--------|----------|
| **Lead** | Elenco, filtri (industry, punteggio, stato progetto, data), dettaglio risposte, export CSV |
| **Progetti** | Tutti i progetti, anonimi e registrati; visualizzazione delle risposte per step, statistiche di completamento e abbandono per step |
| **Editor wizard** | Creazione e modifica di step, opzioni, tipi domanda, dipendenze, regole di scoring e raccomandazioni; anteprima; pubblicazione versione |
| **Contenuti** | Gestione pagine e liste in IT/EN, slug, SEO, bozza/pubblicato |
| **Utenti** | Gestione ruoli, disattivazione, cancellazione (diritto all'oblio) |

L'editor delle dipendenze è il componente più complesso: in Fase 1 si propone un editor a form ("mostra questo step se *step X* è *uguale a / contiene* *valore*"), che genera la regola JSON.

---

## 7. Form & Validazione

- **Form State Management:** `react-hook-form`
- **Validazione Schema:** `zod`; per il wizard gli schemi zod sono **generati dinamicamente** dalla definizione degli step
- **Invio:** Server Action con validazione ripetuta lato server

---

## 8. Secrets e Deploy

- **Hosting:** Vercel; database Neon (branch separati per preview e produzione)
- **Secrets:** riferimenti `op://vault-name/...` in `.env.example`; in locale `op run -- npm run dev`
- **Vercel:** non risolve i riferimenti `op://` da solo — usare l'integrazione 1Password↔Vercel oppure sincronizzare i valori dalla CI
- **CI (GitHub Actions):** lint, type-check, test, `prisma migrate deploy` sul deploy di produzione

---

## 9. Privacy, Sicurezza, Accessibilità

- **GDPR:** consenso privacy obbligatorio in registrazione, consenso marketing separato e facoltativo; informativa versionata; export e cancellazione dati utente; progetti anonimi senza dati personali, conservati per finalità statistiche (dichiarato nell'informativa); nessun IP o fingerprint salvato sui progetti anonimi; informativa breve sul cookie tecnico del wizard
- **Conservazione:**
  - Cookie di ripresa dei progetti anonimi: **30 giorni**
  - Dati degli utenti registrati: **24 mesi dall'ultimo accesso**; alla scadenza account e dati personali vengono cancellati da un job schedulato (Vercel Cron); i progetti restano nel DB scollegati dall'utente, come progetti anonimi
  - Avviso email all'utente prima della cancellazione (da valutare)
- **Sicurezza:** controlli di ruolo lato server, rate limit, CAPTCHA, header di sicurezza, nessun dato sensibile nei log
- **Accessibilità:** target WCAG 2.1 AA; wizard navigabile da tastiera
- **Performance:** pagine pubbliche con rendering statico e revalidazione alla pubblicazione dei contenuti

---

## 10. Roadmap a Fasi

### Fase 1 — MVP

1. Setup progetto, CI, DB, secrets, i18n
2. Autenticazione e ruoli
3. Modello dati + motore wizard (rendering dinamico, dipendenze, salvataggio, ripresa)
4. Area utente
5. Scoring con regole di esempio + pagina di riepilogo
6. Dashboard admin: lead, progetti, editor wizard, contenuti, utenti
7. Sito pubblico con contenuti da DB
8. Privacy, accessibilità, test end-to-end, go-live

### Fase 2+

- Regole di scoring validate
- Report PDF personalizzato
- Email di follow-up / marketing
- Integrazione CRM / webhooks
- Integrazione reale API Registry UE

---

## 11. Punti Aperti

- Regole di scoring (pesi, aree, soglie) — da validare

---

**Documento redatto:** 30 ottobre 2026  
**Status:** In revisione  
**Autore:** DPP Design Team  
**Derivato da:** PROJECT-ANALYSIS.md
