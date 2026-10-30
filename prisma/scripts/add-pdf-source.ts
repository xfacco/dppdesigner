/**
 * Aggiunge l'opzione "Fornitori — documenti PDF" allo step data_sources della bozza
 * (subito dopo "Fornitori — file Excel o email"). Idempotente.
 *
 *   npx tsx prisma/scripts/add-pdf-source.ts [versionId]
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const version = process.argv[2]
    ? await db.wizardVersion.findUniqueOrThrow({ where: { id: process.argv[2] } })
    : await db.wizardVersion.findFirst({ where: { status: "DRAFT" } });
  if (!version) throw new Error("Nessuna bozza: creane una dall'admin o indica l'id della versione");
  if (version.status !== "DRAFT") throw new Error(`La versione ${version.number} non è una bozza`);

  const step = await db.step.findUniqueOrThrow({
    where: { versionId_key: { versionId: version.id, key: "data_sources" } },
    include: { options: { orderBy: { position: "asc" } } },
  });
  if (step.options.some((o) => o.key === "suppliers_pdf")) {
    console.log(`v${version.number}: opzione PDF già presente`);
    return;
  }
  const after = step.options.find((o) => o.key === "suppliers_excel")?.position ?? step.options.length - 1;
  await db.$transaction([
    db.option.updateMany({ where: { stepId: step.id, position: { gt: after } }, data: { position: { increment: 1 } } }),
    db.option.create({
      data: {
        stepId: step.id,
        key: "suppliers_pdf",
        position: after + 1,
        translations: {
          create: [
            { locale: "it", label: "Fornitori — documenti PDF" },
            { locale: "en", label: "Suppliers — PDF documents" },
          ],
        },
      },
    }),
  ]);
  console.log(`v${version.number}: aggiunta l'opzione "Fornitori — documenti PDF"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
