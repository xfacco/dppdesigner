/**
 * Aggiunge e pubblica una pagina dei dati iniziali (prisma/seed-data/pages.ts) se non esiste ancora.
 * Se la pagina c'è già non la tocca: il testo si modifica da Admin → Contenuti.
 *
 *   npx tsx prisma/scripts/add-page.ts marketing
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { pages } from "../seed-data/pages";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const key = process.argv[2];
  const seed = pages.find((p) => p.key === key);
  if (!seed) throw new Error(`Pagina «${key}» non trovata nei dati iniziali (chiavi: ${pages.map((p) => p.key).join(", ")})`);
  if (await db.page.findUnique({ where: { key } })) {
    console.log(`La pagina «${key}» esiste già: nessuna modifica.`);
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
  console.log(`Pagina «${seed.it.title}» creata e pubblicata: /it/${seed.it.slug}, /en/${seed.en.slug}`);
}

main().finally(() => db.$disconnect());
