import "server-only";
import type { StepRef } from "@/components/admin/condition-editor";
import type { StepConfig } from "@/lib/wizard/engine";
import { pickTranslation } from "./wizard";

type StepWithTranslations = {
  key: string;
  type: string;
  config: unknown;
  translations: { locale: string; title: string }[];
  options: { key: string; translations: { locale: string; label: string }[] }[];
};

/** Riferimenti agli step per il costruttore di condizioni (etichette in italiano). */
export function toStepRefs(steps: StepWithTranslations[]): StepRef[] {
  const optionsOf = (s: StepWithTranslations) =>
    s.options.map((o) => ({ key: o.key, label: pickTranslation(o.translations, "it")?.label ?? o.key }));
  return steps.map((s) => {
    const cfg = (s.config as StepConfig | null) ?? {};
    // Nelle griglie le "righe" (campi) sono le opzioni dello step sorgente
    const source = s.type === "MATRIX" ? steps.find((x) => x.key === cfg.rowsFrom) : undefined;
    return {
      key: s.key,
      title: pickTranslation(s.translations, "it")?.title ?? s.key,
      type: s.type,
      options: optionsOf(s),
      fields: source
        ? optionsOf(source).map((o) => ({ ...o, type: "row" as const }))
        : (cfg.fields ?? []).map((f) => ({ key: f.key, label: f.label.it ?? f.key, type: f.type })),
    };
  });
}
