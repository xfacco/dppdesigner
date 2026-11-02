# Pubblicazione su Google Cloud

Progetto `dpp-designer` (numero 471028444452), regione `europe-west1` (Belgio).

| Pezzo | Risorsa |
|---|---|
| Sito | Cloud Run, servizio `dpp-designer` (account di servizio `dpp-designer-run`) |
| Migrazioni del database | Cloud Run Job `dpp-designer-migrate` |
| Database | Cloud SQL PostgreSQL 18, istanza `dpp-designer-db` (`db-f1-micro`), database e utente `dppdesigner`; backup automatici alle 02:00, 7 conservati |
| Immagini | Artifact Registry `europe-west1-docker.pkg.dev/dpp-designer/dpp-designer` (`web`, `migrator`) |
| Segreti | Secret Manager: `database-url`, `better-auth-secret`, `cron-secret`, `admin-password` |

Indirizzo: https://www.dppdesigner.com (anche https://dppdesigner.com, reindirizzato a www; l'indirizzo tecnico è https://dpp-designer-471028444452.europe-west1.run.app)

## Pubblicare una nuova versione

Dalla cartella del progetto, con la configurazione gcloud dedicata:

```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=dpp-designer gcloud builds submit --config cloudbuild.yaml
```

Cloud Build crea le immagini (vedi `Dockerfile`), esegue le migrazioni del database con il job `dpp-designer-migrate` e pubblica la nuova versione del sito. I file caricati sono filtrati da `.gcloudignore` (niente `.env`, database locale o backup).

La configurazione gcloud `dpp-designer` (account, progetto, progetto di quota) si crea una volta con:

```bash
gcloud config configurations create dpp-designer --no-activate
CLOUDSDK_ACTIVE_CONFIG_NAME=dpp-designer gcloud config set account <email>
CLOUDSDK_ACTIVE_CONFIG_NAME=dpp-designer gcloud config set project dpp-designer
CLOUDSDK_ACTIVE_CONFIG_NAME=dpp-designer gcloud config set billing/quota_project dpp-designer
```

## Applicazione locale sul database di produzione

L'app in locale può usare il database Cloud SQL invece di quello incorporato:

1. `npm run db:remote`: avvia Cloud SQL Auth Proxy su `127.0.0.1:5433` con l'account gcloud della configurazione `dpp-designer` (lasciarlo acceso in un terminale).
2. `.env.local` (escluso da git, letto da Next.js prima di `.env`) contiene `DATABASE_URL` verso il proxy.
3. `npm run dev` oppure `npm run build && npm run start`.

È il database di produzione: quello che si fa in locale (progetti, utenti, modifiche al wizard) è subito online. Per tornare al database locale: eliminare `.env.local` e usare `npm run db`. I comandi Prisma e `npm run db:backup` leggono `.env`, quindi restano sul database locale.

## Variabili e segreti del servizio

- `DATABASE_URL` ← segreto `database-url` (connessione via socket Cloud SQL: `?host=/cloudsql/dpp-designer:europe-west1:dpp-designer-db`)
- `BETTER_AUTH_SECRET` ← segreto `better-auth-secret`
- `CRON_SECRET` ← segreto `cron-secret`
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`: `https://www.dppdesigner.com`. `NEXT_PUBLIC_APP_URL` è incorporato nella build (`_APP_URL` in `cloudbuild.yaml`).
- `TRUSTED_ORIGINS`: altri indirizzi da cui il login è accettato (dominio senza www e indirizzo run.app).
- `EMAIL_FROM`; `RESEND_API_KEY` e `ANTHROPIC_API_KEY` non sono ancora impostati (email stampate nei log, assistente AI disattivato). Per aggiungerli: creare il segreto e collegarlo con `gcloud run services update dpp-designer --update-secrets=RESEND_API_KEY=resend-api-key:latest`.

Password dell'admin di produzione:

```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=dpp-designer gcloud secrets versions access latest --secret=admin-password
```

## Da completare

- Job notturno di conservazione dati: Cloud Scheduler che chiama `GET /api/cron/retention` con `Authorization: Bearer <cron-secret>` alle 03:00 (serve l'API `cloudscheduler.googleapis.com`).
- Search Console per www.dppdesigner.com e invio della sitemap.
- Avviso di budget sul progetto.
