/**
 * Nuova bozza del wizard copiata dalla versione pubblicata, come Admin → Wizard → "Nuova bozza".
 * Serve per applicare gli script di contenuto (es. versioning-step.ts) senza passare dall'admin.
 *
 *   npx tsx --conditions=react-server prisma/scripts/create-draft.ts
 */
import "dotenv/config";
import { db } from "@/lib/db";
import { cloneVersion } from "@/server/wizard-admin";

async function main() {
  const existing = await db.wizardVersion.findFirst({ where: { status: "DRAFT" } });
  if (existing) throw new Error(`Esiste già una bozza (versione ${existing.number}, ${existing.id})`);
  const published = await db.wizardVersion.findFirst({ where: { status: "PUBLISHED" } });
  const v = await cloneVersion(published?.id ?? null);
  console.log(`Bozza v${v.number} (${v.id}) copiata dalla versione ${published?.number ?? "—"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
