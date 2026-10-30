"use server";

import { z } from "zod";
import type { PrismaPromise } from "@/generated/prisma/internal/prismaNamespace";
import { db } from "@/lib/db";
import { diagramConfigSchema } from "@/lib/diagrams/config";
import { requireStaff } from "@/lib/session";
import {
  asJson,
  assertDraft,
  cloneVersion,
  configSchema,
  jsonOrNull,
  keySchema,
  LOCALES,
  movePosition,
  parseConditionInput,
  publishVersion,
  versionOfStep,
} from "@/server/wizard-admin";
import { guarded } from "../guarded";

const QUESTION_TYPES = ["SINGLE_CHOICE", "MULTI_CHOICE", "NUMBER", "TEXT", "FIELDS", "MATRIX"] as const;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optional = (f: FormData, k: string) => str(f, k) || null;
const versionPath = (id: string) => `/admin/wizard/${id}`;
const stepPath = (versionId: string, stepId: string) => `/admin/wizard/${versionId}/steps/${stepId}`;

// ─── Versioni ───

export async function createDraft() {
  await requireStaff();
  await guarded("/admin/wizard", async () => {
    const existing = await db.wizardVersion.findFirst({ where: { status: "DRAFT" } });
    if (existing) throw new Error(`Esiste già una bozza (versione ${existing.number}).`);
    const published = await db.wizardVersion.findFirst({ where: { status: "PUBLISHED" } });
    const v = await cloneVersion(published?.id ?? null);
    return versionPath(v.id);
  });
}

export async function publishDraft(versionId: string) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await publishVersion(versionId);
    return "/admin/wizard";
  });
}

export async function deleteDraft(versionId: string) {
  await requireStaff();
  await guarded("/admin/wizard", async () => {
    await assertDraft(versionId);
    const real = await db.journey.count({ where: { versionId, isPreview: false } });
    if (real > 0) throw new Error("La bozza è usata da progetti reali e non può essere eliminata.");
    await db.$transaction([
      db.journey.deleteMany({ where: { versionId, isPreview: true } }),
      db.wizardVersion.delete({ where: { id: versionId } }),
    ]);
  });
}

/**
 * Avvia un progetto di prova su questa versione (anche bozza), intestato all'admin
 * ed escluso da statistiche ed elenchi. Si apre sul sito in una nuova scheda.
 */
export async function previewVersion(versionId: string, locale: "it" | "en") {
  const session = await requireStaff();
  await guarded(versionPath(versionId), async () => {
    const steps = await db.step.count({ where: { versionId } });
    if (steps === 0) throw new Error("La versione non ha step da provare.");
    const journey = await db.journey.create({
      data: { versionId, locale, userId: session.user.id, isPreview: true },
    });
    return `/${locale}/progetta/${journey.id}`;
  });
}

export async function updateVersionNotes(versionId: string, form: FormData) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    await db.wizardVersion.update({ where: { id: versionId }, data: { notes: optional(form, "notes") } });
  });
}

// ─── Schemi del riepilogo ───

export async function saveDiagramConfig(versionId: string, form: FormData) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    const text = str(form, "diagramConfig");
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error("Schemi: JSON non valido.");
    }
    const config = diagramConfigSchema.parse(json);
    // Ogni step indicato deve esistere in questa versione
    const keys = Object.values(config.steps ?? {});
    const existing = new Set((await db.step.findMany({ where: { versionId }, select: { key: true } })).map((s) => s.key));
    const missing = keys.filter((k) => !existing.has(k));
    if (missing.length) throw new Error(`Schemi: step inesistenti in questa versione: ${missing.join(", ")}`);
    await db.wizardVersion.update({ where: { id: versionId }, data: { diagramConfig: config } });
  });
}

export async function resetDiagramConfig(versionId: string) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    await db.wizardVersion.update({ where: { id: versionId }, data: { diagramConfig: jsonOrNull(null) } });
  });
}

// ─── Step ───

export async function addStep(versionId: string, form: FormData) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    const key = keySchema.parse(str(form, "key"));
    const type = z.enum(QUESTION_TYPES).parse(str(form, "type"));
    const last = await db.step.aggregate({ where: { versionId }, _max: { position: true } });
    const step = await db.step.create({
      data: {
        versionId,
        key,
        type,
        position: (last._max.position ?? -1) + 1,
        translations: { create: [{ locale: "it", title: str(form, "title") || key }] },
      },
    });
    return stepPath(versionId, step.id);
  });
}

export async function moveStep(stepId: string, dir: "up" | "down") {
  await requireStaff();
  const step = await db.step.findUniqueOrThrow({ where: { id: stepId } });
  await guarded(versionPath(step.versionId), async () => {
    await assertDraft(step.versionId);
    const items = await db.step.findMany({ where: { versionId: step.versionId }, select: { id: true, position: true } });
    await movePosition(items, stepId, dir, (id, position) => db.step.update({ where: { id }, data: { position } }));
  });
}

export async function deleteStep(stepId: string) {
  await requireStaff();
  const step = await db.step.findUniqueOrThrow({ where: { id: stepId } });
  await guarded(versionPath(step.versionId), async () => {
    await assertDraft(step.versionId);
    await db.step.delete({ where: { id: stepId } });
  });
}

export async function updateStep(stepId: string, form: FormData) {
  await requireStaff();
  const current = await db.step.findUniqueOrThrow({ where: { id: stepId } });
  await guarded(stepPath(current.versionId, stepId), async () => {
    await versionOfStep(stepId);
    const configText = str(form, "config");
    const config = configText ? configSchema.parse(JSON.parse(configText)) : null;
    const type = z.enum(QUESTION_TYPES).parse(str(form, "type"));
    if (type === "FIELDS" && !config?.fields?.length) throw new Error("Gli step FIELDS richiedono `fields` nella configurazione.");
    if (type === "MATRIX") {
      if (!config?.rowsFrom) throw new Error('Le griglie richiedono `rowsFrom` nella configurazione, es. { "rowsFrom": "product_categories" }.');
      const source = await db.step.findUnique({ where: { versionId_key: { versionId: current.versionId, key: config.rowsFrom } } });
      if (!source || source.position >= current.position || !["SINGLE_CHOICE", "MULTI_CHOICE"].includes(source.type))
        throw new Error("`rowsFrom` deve indicare uno step a scelta singola o multipla che viene prima di questo.");
    }

    await db.$transaction([
      db.step.update({
        where: { id: stepId },
        data: {
          key: keySchema.parse(str(form, "key")),
          type,
          required: form.get("required") === "on",
          visibleIf: jsonOrNull(parseConditionInput(form.get("visibleIf"))),
          config: jsonOrNull(config),
        },
      }),
      ...LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
        const title = str(form, `title_${locale}`);
        if (!title) return [db.stepTranslation.deleteMany({ where: { stepId, locale } })];
        const data = {
          title,
          description: optional(form, `description_${locale}`),
          help: optional(form, `help_${locale}`),
          references: optional(form, `references_${locale}`),
        };
        return [
          db.stepTranslation.upsert({
            where: { stepId_locale: { stepId, locale } },
            create: { stepId, locale, ...data },
            update: data,
          }),
        ];
      }),
    ]);
  });
}

// ─── Opzioni ───

function optionTranslations(optionId: string, form: FormData) {
  return LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
    const label = str(form, `label_${locale}`);
    if (!label) return [db.optionTranslation.deleteMany({ where: { optionId, locale } })];
    const data = { label, description: optional(form, `description_${locale}`) };
    return [
      db.optionTranslation.upsert({
        where: { optionId_locale: { optionId, locale } },
        create: { optionId, locale, ...data },
        update: data,
      }),
    ];
  });
}

export async function addOption(stepId: string, form: FormData) {
  await requireStaff();
  const step = await db.step.findUniqueOrThrow({ where: { id: stepId } });
  await guarded(stepPath(step.versionId, stepId), async () => {
    await versionOfStep(stepId);
    const last = await db.option.aggregate({ where: { stepId }, _max: { position: true } });
    const option = await db.option.create({
      data: { stepId, key: keySchema.parse(str(form, "key")), position: (last._max.position ?? -1) + 1 },
    });
    await db.$transaction(optionTranslations(option.id, form));
  });
}

export async function updateOption(optionId: string, form: FormData) {
  await requireStaff();
  const option = await db.option.findUniqueOrThrow({ where: { id: optionId }, include: { step: true } });
  await guarded(stepPath(option.step.versionId, option.stepId), async () => {
    await versionOfStep(option.stepId);
    await db.$transaction([
      db.option.update({
        where: { id: optionId },
        data: { key: keySchema.parse(str(form, "key")), visibleIf: jsonOrNull(parseConditionInput(form.get("visibleIf"))) },
      }),
      ...optionTranslations(optionId, form),
    ]);
  });
}

export async function moveOption(optionId: string, dir: "up" | "down") {
  await requireStaff();
  const option = await db.option.findUniqueOrThrow({ where: { id: optionId }, include: { step: true } });
  await guarded(stepPath(option.step.versionId, option.stepId), async () => {
    await versionOfStep(option.stepId);
    const items = await db.option.findMany({ where: { stepId: option.stepId }, select: { id: true, position: true } });
    await movePosition(items, optionId, dir, (id, position) => db.option.update({ where: { id }, data: { position } }));
  });
}

export async function deleteOption(optionId: string) {
  await requireStaff();
  const option = await db.option.findUniqueOrThrow({ where: { id: optionId }, include: { step: true } });
  await guarded(stepPath(option.step.versionId, option.stepId), async () => {
    await versionOfStep(option.stepId);
    await db.option.delete({ where: { id: optionId } });
  });
}

// ─── Suggerimenti dello step ───

export async function saveSuggestion(stepId: string, suggestionId: string | null, form: FormData) {
  await requireStaff();
  const step = await db.step.findUniqueOrThrow({ where: { id: stepId }, include: { options: true } });
  await guarded(stepPath(step.versionId, stepId), async () => {
    await versionOfStep(stepId);
    const condition = parseConditionInput(form.get("condition"));
    if (!condition) throw new Error("Il suggerimento richiede una condizione.");
    const optionKey = optional(form, "optionKey");
    if (optionKey && !step.options.some((o) => o.key === optionKey)) throw new Error("Opzione consigliata non valida.");
    const mandatory = form.get("mandatory") === "on";
    if (mandatory && !optionKey) throw new Error("Un suggerimento obbligatorio deve indicare l'opzione da rendere obbligatoria.");
    const data = {
      condition: asJson(condition),
      optionKey,
      mandatory,
      priority: z.coerce.number().int().parse(str(form, "priority") || "0"),
    };
    const sg = suggestionId
      ? await db.stepSuggestion.update({ where: { id: suggestionId, stepId }, data })
      : await db.stepSuggestion.create({ data: { ...data, stepId } });
    await db.$transaction(
      LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
        const message = str(form, `message_${locale}`);
        if (!message) return [db.stepSuggestionTranslation.deleteMany({ where: { suggestionId: sg.id, locale } })];
        return [
          db.stepSuggestionTranslation.upsert({
            where: { suggestionId_locale: { suggestionId: sg.id, locale } },
            create: { suggestionId: sg.id, locale, message },
            update: { message },
          }),
        ];
      }),
    );
  });
}

export async function deleteSuggestion(suggestionId: string) {
  await requireStaff();
  const sg = await db.stepSuggestion.findUniqueOrThrow({ where: { id: suggestionId }, include: { step: true } });
  await guarded(stepPath(sg.step.versionId, sg.stepId), async () => {
    await versionOfStep(sg.stepId);
    await db.stepSuggestion.delete({ where: { id: suggestionId } });
  });
}

// ─── Scoring ───

export async function saveArea(versionId: string, areaId: string | null, form: FormData) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    const data = {
      key: keySchema.parse(str(form, "key")),
      weight: z.coerce.number().positive().parse(str(form, "weight") || "1"),
      maxPoints: z.coerce.number().int().positive().parse(str(form, "maxPoints")),
    };
    const area = areaId
      ? await db.scoringArea.update({ where: { id: areaId, versionId }, data })
      : await db.scoringArea.create({
          data: { ...data, versionId, position: await db.scoringArea.count({ where: { versionId } }) },
        });
    await db.$transaction(
      LOCALES.map((locale) => {
        const label = str(form, `label_${locale}`) || data.key;
        return db.scoringAreaTranslation.upsert({
          where: { areaId_locale: { areaId: area.id, locale } },
          create: { areaId: area.id, locale, label },
          update: { label },
        });
      }),
    );
  });
}

export async function deleteArea(versionId: string, areaId: string) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    await db.scoringArea.delete({ where: { id: areaId, versionId } });
  });
}

export async function saveRule(versionId: string, ruleId: string | null, form: FormData) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    const condition = parseConditionInput(form.get("condition"));
    if (!condition) throw new Error("La regola richiede una condizione.");
    const data = {
      areaId: z.string().min(1).parse(str(form, "areaId")),
      points: z.coerce.number().int().parse(str(form, "points")),
      condition: asJson(condition),
      note: optional(form, "note"),
    };
    if (ruleId) await db.scoringRule.update({ where: { id: ruleId, versionId }, data });
    else await db.scoringRule.create({ data: { ...data, versionId } });
  });
}

export async function deleteRule(versionId: string, ruleId: string) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    await db.scoringRule.delete({ where: { id: ruleId, versionId } });
  });
}

// ─── Raccomandazioni ───

export async function saveRecommendation(versionId: string, recId: string | null, form: FormData) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    const condition = parseConditionInput(form.get("condition"));
    if (!condition) throw new Error("La raccomandazione richiede una condizione.");
    const priority = z.coerce.number().int().parse(str(form, "priority") || "0");
    const rec = recId
      ? await db.recommendation.update({ where: { id: recId, versionId }, data: { condition: asJson(condition), priority } })
      : await db.recommendation.create({ data: { versionId, condition: asJson(condition), priority } });
    await db.$transaction(
      LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
        const title = str(form, `title_${locale}`);
        if (!title) return [db.recommendationTranslation.deleteMany({ where: { recommendationId: rec.id, locale } })];
        const data = { title, body: str(form, `body_${locale}`) };
        return [
          db.recommendationTranslation.upsert({
            where: { recommendationId_locale: { recommendationId: rec.id, locale } },
            create: { recommendationId: rec.id, locale, ...data },
            update: data,
          }),
        ];
      }),
    );
  });
}

export async function deleteRecommendation(versionId: string, recId: string) {
  await requireStaff();
  await guarded(versionPath(versionId), async () => {
    await assertDraft(versionId);
    await db.recommendation.delete({ where: { id: recId, versionId } });
  });
}
