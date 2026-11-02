# Immagini del sito per Google Cloud Run (vedi cloudbuild.yaml e DEPLOY.md).
#   - runner   (predefinita): il sito, solo l'output "standalone" di Next.js
#   - migrator (--target migrator): esegue `prisma migrate deploy` come Cloud Run Job

# ─── Dipendenze ──────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── Build ───────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Indirizzo pubblico del sito: le variabili NEXT_PUBLIC_* sono incorporate nella build
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma vuole un DATABASE_URL anche se in build non si collega al database
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

# ─── Migrazioni del database (Cloud Run Job) ─────────────────────────────────
FROM builder AS migrator
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

# ─── Sito ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 8080
CMD ["node", "server.js"]
