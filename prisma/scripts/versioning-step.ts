/**
 * Aggiunge lo step "Come gestirete le versioni del passaporto?" (griglia per categorie) dopo
 * "maintenance", nella bozza del wizard (o nella versione indicata, che deve essere una bozza).
 *
 *   npx tsx prisma/scripts/versioning-step.ts [versionId]
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { applyVersioningStep } from "../seed-data/versioning-step";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const version = process.argv[2]
    ? await db.wizardVersion.findUniqueOrThrow({ where: { id: process.argv[2] } })
    : await db.wizardVersion.findFirst({ where: { status: "DRAFT" } });
  if (!version) throw new Error("Nessuna bozza: creane una dall'admin o indica l'id della versione");
  if (version.status !== "DRAFT") throw new Error(`La versione ${version.number} non è una bozza`);

  for (const line of await applyVersioningStep(db, version.id)) console.log(`v${version.number}: ${line}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
