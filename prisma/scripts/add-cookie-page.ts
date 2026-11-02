/**
 * Aggiunge la pagina "Cookie policy" (chiave "cookies") se non esiste, con il testo dei dati iniziali.
 * Se la pagina c'è già non la tocca: il testo si modifica da Admin → Contenuti.
 *
 *   npx tsx prisma/scripts/add-cookie-page.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { pages } from "../seed-data/pages";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const seed = pages.find((p) => p.key === "cookies");
  if (!seed) throw new Error("Pagina cookies non trovata nei dati iniziali");
  if (await db.page.findUnique({ where: { key: "cookies" } })) {
    console.log("La pagina «cookies» esiste già: nessuna modifica.");
    return;
  }
  await db.page.create({
    data: {
      key: seed.key,
      status: "PUBLISHED",
      showInMenu: seed.showInMenu,
      position: seed.position,
      translations: { create: (["it", "en"] as const).map((locale) => ({ locale, ...seed[locale] })) },
    },
  });
  console.log("Pagina «Cookie policy» creata e pubblicata: /it/cookie-policy, /en/cookie-policy");
}

main().finally(() => db.$disconnect());
