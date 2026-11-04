import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { conditionSchema, type Condition } from "@/lib/wizard/rules";

export const LOCALES = ["it", "en"] as const;

export const keySchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]{0,49}$/, "Usa solo lettere minuscole, numeri e _ (max 50, inizia con una lettera)")
  .refine((k) => k !== "summary", "La chiave 'summary' è riservata");

export const configSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    maxLength: z.number().int().positive().max(2000).optional(),
    rowsFrom: keySchema.optional(),
    multiple: z.boolean().optional(),
    fields: z
      .array(
        z.object({
          key: keySchema,
          type: z.enum(["text", "number"]),
          required: z.boolean().optional(),
          label: z.record(z.string(), z.string()),
        }),
      )
      .optional(),
  })
  .strict();

/** Converte il testo JSON di un form in condizione validata; stringa vuota = nessuna condizione. */
export function parseConditionInput(raw: FormDataEntryValue | null): Condition | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Condizione: JSON non valido");
  }
  const parsed = conditionSchema.safeParse(json);
  if (!parsed.success) throw new Error("Condizione non valida: " + parsed.error.issues[0]?.message);
  return parsed.data;
}

export const asJson = (v: Condition) => v as unknown as Prisma.InputJsonValue;
export const jsonOrNull =(v: unknown) => (v === null || v === undefined ? Prisma.JsonNull : (v as Prisma.InputJsonValue));

export async function assertDraft(versionId: string) {
  const v = await db.wizardVersion.findUniqueOrThrow({ where: { id: versionId } });
  if (v.status !== "DRAFT") throw new Error("Solo le versioni in bozza sono modificabili");
  return v;
}

export async function versionOfStep(stepId: string) {
  const step = await db.step.findUniqueOrThrow({ where: { id: stepId } });
  await assertDraft(step.versionId);
  return step;
}

/** Nuova bozza: copia completa della versione indicata (o vuota). */
export async function cloneVersion(fromId: string | null) {
  const last = await db.wizardVersion.aggregate({ _max: { number: true } });
  const number = (last._max.number ?? 0) + 1;

  if (!fromId) return db.wizardVersion.create({ data: { number } });

  const src = await db.wizardVersion.findUniqueOrThrow({
    where: { id: fromId },
    include: {
      steps: {
        include: {
          translations: true,
          options: { include: { translations: true } },
          suggestions: { include: { translations: true } },
        },
      },
      areas: { include: { translations: true, rules: true } },
      recommendations: { include: { translations: true } },
    },
  });

  // Una scrittura per step, opzione e regola: con il wizard completo i 5 secondi predefiniti non bastano
  return db.$transaction(async (tx) => {
    const version = await tx.wizardVersion.create({
      data: { number, notes: `Copia della versione ${src.number}`, diagramConfig: jsonOrNull(src.diagramConfig) },
    });
    for (const s of src.steps) {
      await tx.step.create({
        data: {
          versionId: version.id,
          key: s.key,
          position: s.position,
          type: s.type,
          required: s.required,
          visibleIf: jsonOrNull(s.visibleIf),
          config: jsonOrNull(s.config),
          translations: {
            create: s.translations.map(({ locale, title, description, help, references }) => ({ locale, title, description, help, references })),
          },
          options: {
            create: s.options.map((o) => ({
              key: o.key,
              position: o.position,
              visibleIf: jsonOrNull(o.visibleIf),
              translations: { create: o.translations.map(({ locale, label, description }) => ({ locale, label, description })) },
            })),
          },
          suggestions: {
            create: s.suggestions.map((sg) => ({
              condition: sg.condition as Prisma.InputJsonValue,
              optionKey: sg.optionKey,
              mandatory: sg.mandatory,
              priority: sg.priority,
              translations: { create: sg.translations.map(({ locale, message }) => ({ locale, message })) },
            })),
          },
        },
      });
    }
    for (const a of src.areas) {
      await tx.scoringArea.create({
        data: {
          versionId: version.id,
          key: a.key,
          position: a.position,
          weight: a.weight,
          maxPoints: a.maxPoints,
          translations: { create: a.translations.map(({ locale, label }) => ({ locale, label })) },
          rules: {
            create: a.rules.map((r) => ({
              versionId: version.id,
              condition: r.condition as Prisma.InputJsonValue,
              points: r.points,
              note: r.note,
            })),
          },
        },
      });
    }
    for (const r of src.recommendations) {
      await tx.recommendation.create({
        data: {
          versionId: version.id,
          condition: r.condition as Prisma.InputJsonValue,
          priority: r.priority,
          translations: { create: r.translations.map(({ locale, title, body }) => ({ locale, title, body })) },
        },
      });
    }
    return version;
  }, { timeout: 60_000 });
}

export async function publishVersion(versionId: string) {
  await assertDraft(versionId);
  const steps = await db.step.count({ where: { versionId } });
  if (steps === 0) throw new Error("La versione non ha step");

  await db.$transaction([
    db.wizardVersion.updateMany({ where: { status: "PUBLISHED" }, data: { status: "ARCHIVED" } }),
    db.wizardVersion.update({ where: { id: versionId }, data: { status: "PUBLISHED", publishedAt: new Date() } }),
  ]);
}

/** Sposta un elemento di una posizione e rinumera tutti gli elementi (0, 1, 2, …). */
export async function movePosition(
  items: { id: string; position: number }[],
  id: string,
  dir: "up" | "down",
  update: (id: string, position: number) => Prisma.PrismaPromise<unknown>,
) {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const i = sorted.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= sorted.length) return;
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  await db.$transaction(sorted.map((x, position) => update(x.id, position)));
}
