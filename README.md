# DPP Designer

Sito educativo sul Digital Product Passport con il wizard "Progetta" (`/it/progetta`) e dashboard admin.
Il testo introduttivo di `/progetta` si modifica da **Admin → Contenuti → Progetta il tuo DPP** (pagina di sistema `wizard_intro`); l'elenco degli step sotto il testo viene dal wizard pubblicato.
Analisi: [ANALISI-BUSINESS.md](ANALISI-BUSINESS.md), [ANALISI-TECNICA.md](ANALISI-TECNICA.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · componenti in stile shadcn/ui · Prisma 7 + PostgreSQL · Better Auth · next-intl · react-hook-form + zod · Vitest

## Avvio in locale

Requisiti: Node 24, un database PostgreSQL (es. Neon o Docker).

Per lo sviluppo c'è anche un PostgreSQL incorporato, senza installazioni: `npm run db` lo avvia sulla porta 54329 con i dati in `.data/pgdata` (cartella esclusa da git, che resta tra un riavvio e l'altro). Va lasciato acceso in un terminale a parte; Ctrl+C lo ferma in modo pulito. In `.env`: `DATABASE_URL="postgresql://postgres:postgres@localhost:54329/dppdesigner"`.

I backup locali stanno in `backups/<data-ora>/` (esclusa da git): un file JSON per tabella e `pgdata.tar.gz`, copia della cartella dati fatta a database fermo. Per ripristinare quest'ultima: fermare il database, sostituire `.data/pgdata` con il contenuto dell'archivio, riavviare `npm run db`.

```bash
npm install
cp .env.example .env          # compilare i valori
npx prisma migrate dev        # crea le tabelle
npm run db:seed               # wizard v1, pagine, utente admin (SEED_ADMIN_*)
npm run dev
```

Con 1Password, invece del file `.env`: `npm run dev:op` (legge i riferimenti `op://` da [.env.op](.env.op)).

- Sito: http://localhost:3000/it
- Admin: http://localhost:3000/admin

Senza `RESEND_API_KEY` le email (verifica, reset password) vengono stampate nel terminale.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run db` | PostgreSQL locale incorporato (dati in `.data/pgdata`) |
| `npm run db:backup` | Backup del database in `backups/<data-ora>/` (un JSON per tabella) |
| `npm run dev` | Server di sviluppo |
| `npm run build` | Genera il client Prisma e la build di produzione |
| `npm test` | Test del motore del wizard |
| `npm run typecheck` | Controllo dei tipi |
| `npm run db:migrate` | Nuova migrazione dopo modifiche a `prisma/schema.prisma` |
| `npm run db:seed` | Dati iniziali (idempotente: non sovrascrive wizard e pagine esistenti) |

## Struttura

```
prisma/
  schema.prisma          modello dati
  seed.ts, seed-data/    wizard iniziale (16 step), pagine IT/EN, admin
src/
  app/[locale]/          sito pubblico, wizard, login/registrazione, area personale
  app/admin/             dashboard admin (lead, progetti, editor wizard, contenuti, messaggi, utenti)
  app/api/               auth, export dati, export CSV lead, cambio lingua, job di conservazione
  lib/wizard/            motore del wizard: regole, visibilità, validazione, punteggio (puro, testato)
  server/                accesso ai dati lato server (progetti, contenuti, lead, versioni wizard)
  messages/              testi dell'interfaccia IT/EN
```

## Come funziona il wizard

- Step, opzioni, dipendenze, aree di punteggio, regole e raccomandazioni sono nel database e si modificano da **Admin → Wizard**.
- Le modifiche si fanno su una **bozza**; alla pubblicazione la bozza diventa la versione attiva. I progetti già iniziati restano sulla loro versione.
- Le condizioni sono JSON (vedi [src/lib/wizard/rules.ts](src/lib/wizard/rules.ts)), con un editor visuale nell'admin:
  `{ "step": "industry", "op": "eq", "value": "battery" }`, combinabili con `all`, `any`, `not`.
- Il wizard si compila **senza account**. Un cookie (30 giorni) permette di riprenderlo dallo stesso browser. A fine progetto l'utente può registrarsi: il progetto viene associato all'account.
- Le **regole di punteggio del seed sono esempi** da validare.

## Schemi del riepilogo

Il riepilogo mostra due schemi generati dalle risposte, scaricabili in PNG e SVG:

- **Flusso dei dati DPP**: fonti dati → middle layer (se serve) → DPP platform → Registro UE, con frecce puntinate (integrazioni), continue e tratteggiate (da pianificare) e il percorso di caricamento manuale.
- **Blueprint del DPP**: tutti gli step raggruppati in aree (Azienda, Prodotto, Dati, Identificazione, Infrastruttura, Altro), una scheda per step con risposta e stato (definito, da definire, attenzione, non applicabile), le griglie per categoria in un’unica tabella, contatori e note. Schede cliccabili per modificare la risposta; su telefono le aree sono impilate.

Il generatore è in [src/lib/diagrams/generate.ts](src/lib/diagrams/generate.ts) (testato), il disegno in [src/components/diagrams/](src/components/diagrams/). Quali step alimentano ogni parte si configura per versione in **Admin → Wizard → versione → Schemi del riepilogo**.

## Domande sugli step (AI ed esperto)

In ogni step l'utente può aprire "Hai un dubbio su questa domanda?" e:

- **chiedere all'AI**: risposta immediata da Claude (`claude-opus-5-5`, [src/server/ai.ts](src/server/ai.ts)), con il contesto dello step (testo, opzioni, riferimenti normativi) e le risposte già date. Richiede `ANTHROPIC_API_KEY`; senza, la scheda è disattivata. Limite: 10 domande per progetto nelle 24 ore. È attivo il fallback lato server (`fallbacks: "default"`) in caso di rifiuto per policy.
- **chiedere all'esperto**: la domanda arriva in **Admin → Domande**; la risposta compare nello stesso step (nessuna email). Limite: 5 domande in attesa per progetto.

Domande e risposte sono salvate nella tabella `step_questions` e incluse nell'export dei dati dell'utente.

## Conservazione dati

Job giornaliero `GET /api/cron/retention` (Vercel Cron, header `Authorization: Bearer $CRON_SECRET`):
cancella gli utenti `USER` inattivi da 24 mesi (i progetti restano anonimi) e invalida i token di ripresa scaduti.

## Deploy (Vercel + Neon)

1. Database Neon, `DATABASE_URL` nelle variabili d'ambiente Vercel (integrazione 1Password↔Vercel o sincronizzazione dalla CI: Vercel non risolve i riferimenti `op://`).
2. Impostare `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.
3. Eseguire `npx prisma migrate deploy` e `npm run db:seed` sul database di produzione.

## Guida alle domande (SEO e GEO)

Ogni domanda della versione **pubblicata** del wizard è anche un articolo pubblico, senza contenuti aggiuntivi: titolo, descrizione, risposte possibili (con le loro descrizioni), indicazioni, nota e riferimenti normativi vengono dagli stessi campi di Admin → Wizard. Pubblicando una nuova versione, la guida si aggiorna da sola.

- Indice: `/it/guida`, `/en/guide`; articoli: `/it/guida/<chiave-step>` (es. `/it/guida/url-scheme`). Gli articoli sono raggruppati per area come nel Blueprint.
- SEO: title e description per pagina, canonical, hreflang (`it`, `en`, `x-default`), Open Graph, `sitemap.xml` (sito, pagine, guida) e `robots.txt` (esclusi admin, API, account e progetti degli utenti).
- Dati strutturati (JSON-LD): `TechArticle` con fonti citate, `FAQPage` (domanda e risposta), `BreadcrumbList`; sull'indice `CollectionPage` con `ItemList`.
- GEO (motori di risposta AI): `/llms.txt` (indice con un link per domanda) e `/llms-full.txt` (testo completo in Markdown, in tutte le lingue); i crawler AI sono citati in `robots.txt`.
- Gli URL assoluti usano `NEXT_PUBLIC_APP_URL`: in produzione deve essere l'indirizzo pubblico del sito.

## Articoli (blog)

Sezione pubblica `/it/articoli` e `/en/articles`, collegata nel menu in alto e nel footer. Gli articoli si scrivono da **Admin → Articoli**; le impostazioni comuni (organizzazione, logo, profili social, immagine di condivisione, account X, autore predefinito) da **Admin → SEO**.

Per ogni articolo, configurabile in admin:

- **Pubblicazione**: stato, data di pubblicazione, data di ultima revisione (diventa `dateModified`).
- **Autore** (E-E-A-T): nome, ruolo, profilo → schema.org `Person` con `jobTitle`, `sameAs`, `worksFor`.
- **Classificazione**: categoria (`articleSection`), tag (`keywords`, `about`, articoli correlati), immagine di copertina (Open Graph e `image`), `noindex`, canonical esterno.
- **Per lingua**: titolo, slug, sommario, meta title e meta description, testo alternativo della copertina, **In breve** (punti chiave in apertura, `abstract` e `speakable`), testo in Markdown (i titoli `##` diventano l'indice con ancore), **domande frequenti** (`FAQPage`), **fonti** (`citation`).

Dati strutturati: `Organization` e `WebSite` su tutto il sito; sugli articoli `BlogPosting` (con `wordCount`, `timeRequired`, `isPartOf`), `FAQPage`, `BreadcrumbList`; sull'elenco `Blog`.

GEO: versione Markdown di ogni articolo su `/md/<lingua>/<slug>.md` (indicata con `<link rel="alternate" type="text/markdown">`), articoli in `/llms.txt` e testo completo in `/llms-full.txt`. Gli articoli `noindex` o con canonical esterno sono esclusi da sitemap, `llms.txt` e articoli correlati.

## Cookie

Banner e preferenze in [cookie-consent.tsx](src/components/site/cookie-consent.tsx); categorie ed elenco dei cookie in [cookie-consent.ts](src/lib/cookie-consent.ts), fonte unica anche per la tabella della **Cookie policy** (pagina di contenuto con chiave `cookies`, creata con `npx tsx prisma/scripts/add-cookie-page.ts` o dal seed). La scelta è salvata nel cookie `dpp_consent` per 6 mesi; "Accetta tutti" e "Rifiuta" hanno la stessa evidenza e le preferenze si riaprono dal footer.

Per aggiungere uno strumento di statistiche o marketing: aggiungerlo all'elenco `COOKIES` nella sua categoria, aumentare `CONSENT_VERSION` (il banner viene riproposto) e caricare lo script solo con il consenso, ascoltando l'evento `cookie-consent-changed` o leggendo `parseConsent(document.cookie)`.
