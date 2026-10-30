/**
 * Aggiunge lo step "Categorie di prodotto" e i suggerimenti sul livello del DPP
 * alla bozza del wizard (o alla versione indicata come argomento).
 *
 *   npx tsx prisma/scripts/add-product-categories.ts [versionId]
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { applyProductCategories } from "../seed-data/apply-product-categories";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const version = process.argv[2]
    ? await db.wizardVersion.findUniqueOrThrow({ where: { id: process.argv[2] } })
    : await db.wizardVersion.findFirst({ where: { status: "DRAFT" } });
  if (!version) throw new Error("Nessuna bozza: creane una dall'admin o indica l'id della versione");
  if (version.status !== "DRAFT") throw new Error(`La versione ${version.number} non è una bozza`);

  for (const line of await applyProductCategories(db, version.id)) console.log(`v${version.number}: ${line}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
