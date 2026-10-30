import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { applyCategoryMatrix } from "./seed-data/apply-category-matrix";
import { applyGranularityMatrix } from "./seed-data/apply-granularity-matrix";
import { dataDynamicsMatrix } from "./seed-data/data-dynamics-matrix";
import { applyMaintenanceMatrix } from "./seed-data/apply-maintenance-matrix";
import { applyProductCategories } from "./seed-data/apply-product-categories";
import { pages } from "./seed-data/pages";
import { stepReferences } from "./seed-data/references";
import { areas, recommendations, scoringRules, steps } from "./seed-data/wizard";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const both = (t: { it: string; en: string }) => [
  { locale: "it" as const, value: t.it },
  { locale: "en" as const, value: t.en },
];

async function seedWizard() {
  if (await db.wizardVersion.count()) {
    console.log("Wizard: già presente, salto");
    return;
  }
  const version = await db.wizardVersion.create({
    data: { number: 1, status: "PUBLISHED", publishedAt: new Date(), notes: "Configurazione iniziale" },
  });

  for (const [position, s] of steps.entries()) {
    await db.step.create({
      data: {
        versionId: version.id,
        key: s.key,
        position,
        type: s.type,
        required: s.required ?? true,
        visibleIf: s.visibleIf,
        config: s.config,
        translations: {
          create: both(s.title).map(({ locale, value }) => ({
            locale,
            title: value,
            description: s.description?.[locale],
            help: s.help?.[locale],
          })),
        },
        options: {
          create: (s.options ?? []).map((o, i) => ({
            key: o.key,
            position: i,
            visibleIf: o.visibleIf,
            translations: {
              create: both(o.label).map(({ locale, value }) => ({
                locale,
                label: value,
                description: o.description?.[locale],
              })),
            },
          })),
        },
      },
    });
  }

  const areaIds = new Map<string, string>();
  for (const [position, a] of areas.entries()) {
    const area = await db.scoringArea.create({
      data: {
        versionId: version.id,
        key: a.key,
        position,
        weight: a.weight,
        maxPoints: a.maxPoints,
        translations: { create: both(a.label).map(({ locale, value }) => ({ locale, label: value })) },
      },
    });
    areaIds.set(a.key, area.id);
  }

  await db.scoringRule.createMany({
    data: scoringRules.map((r) => ({
      versionId: version.id,
      areaId: areaIds.get(r.area)!,
      points: r.points,
      condition: r.condition,
      note: r.note,
    })),
  });

  for (const r of recommendations) {
    await db.recommendation.create({
      data: {
        versionId: version.id,
        priority: r.priority,
        condition: r.condition,
        translations: {
          create: (["it", "en"] as const).map((locale) => ({ locale, title: r.title[locale], body: r.body[locale] })),
        },
      },
    });
  }
  await applyProductCategories(db, version.id);
  await applyGranularityMatrix(db, version.id);
  await applyMaintenanceMatrix(db, version.id);
  await applyCategoryMatrix(db, version.id, dataDynamicsMatrix);
  console.log(`Wizard: versione 1 pubblicata con ${steps.length + 1} step`);
}

async function seedPages() {
  for (const p of pages) {
    const exists = await db.page.findUnique({ where: { key: p.key } });
    if (exists) continue;
    await db.page.create({
      data: {
        key: p.key,
        status: "PUBLISHED",
        position: p.position,
        showInMenu: p.showInMenu,
        translations: {
          create: (["it", "en"] as const).map((locale) => ({ locale, ...p[locale] })),
        },
      },
    });
  }
  console.log(`Contenuti: ${pages.length} pagine`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("Admin: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD non impostati, salto");
    return;
  }
  if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD deve avere almeno 10 caratteri");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    console.log(`Admin: ${email} già presente, ruolo ADMIN confermato`);
    return;
  }
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email,
      name: "Admin",
      emailVerified: true,
      role: "ADMIN",
      accounts: {
        create: { id: randomUUID(), accountId: id, providerId: "credential", password: await hashPassword(password) },
      },
    },
  });
  console.log(`Admin: creato ${email}`);
}

/** Compila i riferimenti normativi mancanti in tutte le versioni, senza sovrascrivere quelli già scritti. */
async function seedStepReferences() {
  let filled = 0;
  for (const [key, refs] of Object.entries(stepReferences)) {
    for (const locale of ["it", "en"] as const) {
      const res = await db.stepTranslation.updateMany({
        where: { locale, references: null, step: { key } },
        data: { references: refs[locale] },
      });
      filled += res.count;
    }
  }
  console.log(`Riferimenti normativi: ${filled} traduzioni compilate`);
}

async function main() {
  await seedWizard();
  await seedStepReferences();
  await seedPages();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
