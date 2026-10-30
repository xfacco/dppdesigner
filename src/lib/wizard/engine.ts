import { z } from "zod";
import { evaluate, referencedSteps, type AnswerValue, type Answers, type Condition } from "./rules";

export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "NUMBER" | "TEXT" | "FIELDS" | "MATRIX";

export type FieldDef = {
  key: string;
  type: "text" | "number";
  required?: boolean;
  label: Record<string, string>;
};

export type StepConfig = {
  min?: number;
  max?: number;
  maxLength?: number;
  fields?: FieldDef[];
  /** MATRIX: step (a scelta) da cui prendere le righe: una riga per ogni opzione selezionata */
  rowsFrom?: string;
  /** MATRIX: false = una sola colonna per riga (default true, più colonne per riga) */
  multiple?: boolean;
};

export type OptionDef = {
  key: string;
  label: string;
  description?: string | null;
  visibleIf: Condition | null;
};

export type StepDef = {
  key: string;
  type: QuestionType;
  required: boolean;
  visibleIf: Condition | null;
  config: StepConfig;
  title: string;
  description?: string | null;
  help?: string | null;
  /** Riferimenti normativi (Markdown) */
  references?: string | null;
  options: OptionDef[];
  suggestions?: SuggestionDef[];
};

export type SuggestionDef = {
  condition: Condition;
  optionKey: string | null;
  /** L'opzione è obbligatoria (es. per legge): preselezionata e non deselezionabile */
  mandatory?: boolean;
  priority: number;
  message: string;
};

export type AreaDef = { key: string; label: string; weight: number; maxPoints: number };
export type ScoringRuleDef = { areaKey: string; condition: Condition; points: number };
export type RecommendationDef = { condition: Condition; priority: number; title: string; body: string };

export type WizardDef = {
  versionId: string;
  steps: StepDef[];
  areas: AreaDef[];
  scoringRules: ScoringRuleDef[];
  recommendations: RecommendationDef[];
};

export const DEFAULT_TEXT_MAX = 200;

/**
 * Step visibili, in ordine. Le condizioni vedono solo le risposte degli step
 * precedenti e visibili: una risposta a uno step nascosto non conta.
 */
export function visibleSteps(def: WizardDef, answers: Answers): StepDef[] {
  const effective: Answers = {};
  const result: StepDef[] = [];
  for (const step of def.steps) {
    if (!evaluate(step.visibleIf, effective)) continue;
    result.push(step);
    if (answers[step.key] !== undefined) effective[step.key] = answers[step.key];
  }
  return result;
}

/** Risposte limitate agli step visibili (quelle usate per scoring e raccomandazioni). */
export function effectiveAnswers(def: WizardDef, answers: Answers): Answers {
  const out: Answers = {};
  for (const step of visibleSteps(def, answers)) {
    if (answers[step.key] !== undefined) out[step.key] = answers[step.key];
  }
  return out;
}

export function visibleOptions(step: StepDef, answers: Answers): OptionDef[] {
  return step.options.filter((o) => evaluate(o.visibleIf, answers));
}

export function adjacentSteps(def: WizardDef, answers: Answers, key: string) {
  const steps = visibleSteps(def, answers);
  const i = steps.findIndex((s) => s.key === key);
  return {
    index: i,
    total: steps.length,
    prev: i > 0 ? steps[i - 1] : null,
    next: i >= 0 && i < steps.length - 1 ? steps[i + 1] : null,
  };
}

/** Primo step visibile senza risposta valida, o null se il progetto è completo. */
export function firstIncompleteStep(def: WizardDef, answers: Answers): StepDef | null {
  for (const step of visibleSteps(def, answers)) {
    const answer = answers[step.key];
    if (answer === undefined) return step;
    if (!answerSchema(step, answers).safeParse(answer).success) return step;
  }
  return null;
}

/** Step successivi a `changedKey` le cui condizioni dipendono da esso. */
export function dependentSteps(def: WizardDef, changedKey: string): string[] {
  const i = def.steps.findIndex((s) => s.key === changedKey);
  return def.steps
    .slice(i + 1)
    .filter((s) => {
      const refs = [
        ...referencedSteps(s.visibleIf),
        ...s.options.flatMap((o) => referencedSteps(o.visibleIf)),
        // una griglia dipende dallo step da cui prende le righe
        ...(s.type === "MATRIX" && s.config.rowsFrom ? [s.config.rowsFrom] : []),
      ];
      return refs.includes(changedKey);
    })
    .map((s) => s.key);
}

/** Schema zod della risposta a uno step, usato sia nel form (client) sia nella Server Action. */
export function answerSchema(step: StepDef, answers: Answers = {}): z.ZodType<AnswerValue> {
  const optionKeys = visibleOptions(step, answers).map((o) => o.key);
  const cfg = step.config;

  switch (step.type) {
    case "SINGLE_CHOICE": {
      const s = z.string().refine((v) => optionKeys.includes(v), "invalid_option");
      return step.required ? s : s.or(z.literal(""));
    }
    case "MULTI_CHOICE": {
      const s = z.array(z.string().refine((v) => optionKeys.includes(v), "invalid_option"));
      return step.required ? s.min(1, "required") : s;
    }
    case "NUMBER": {
      let n = z.number({ error: "required" });
      if (cfg.min !== undefined) n = n.min(cfg.min);
      if (cfg.max !== undefined) n = n.max(cfg.max);
      return n;
    }
    case "TEXT": {
      const s = z.string().trim().max(cfg.maxLength ?? DEFAULT_TEXT_MAX);
      return step.required ? s.min(1, "required") : s;
    }
    case "FIELDS": {
      const shape: Record<string, z.ZodType<string | number>> = {};
      for (const f of cfg.fields ?? []) {
        if (f.type === "number") {
          shape[f.key] = f.required ? z.number({ error: "required" }) : z.number().or(z.literal(""));
        } else {
          const s = z.string().trim().max(cfg.maxLength ?? DEFAULT_TEXT_MAX);
          shape[f.key] = f.required ? s.min(1, "required") : s;
        }
      }
      return z.object(shape) as unknown as z.ZodType<AnswerValue>;
    }
    case "MATRIX": {
      // Una chiave per riga; righe di categorie non più selezionate vengono scartate
      // Le celle sono sempre elenchi; con multiple=false al massimo un valore per riga
      const base = z.array(z.string().refine((v) => optionKeys.includes(v), "invalid_option"));
      const cell = cfg.multiple === false ? base.max(1) : base;
      const shape: Record<string, z.ZodType<string[]>> = {};
      for (const row of matrixRowKeys(step, answers)) shape[row] = step.required ? cell.min(1, "required") : cell;
      return z.object(shape) as unknown as z.ZodType<AnswerValue>;
    }
  }
}

/** Righe di una griglia: le opzioni selezionate nello step indicato da `config.rowsFrom`. */
export function matrixRowKeys(step: StepDef, answers: Answers): string[] {
  const source = step.config.rowsFrom ? answers[step.config.rowsFrom] : undefined;
  if (Array.isArray(source)) return source;
  return typeof source === "string" && source ? [source] : [];
}

/** Righe di una griglia con l'etichetta presa dalle opzioni dello step sorgente. */
export function matrixRows(def: WizardDef, step: StepDef, answers: Answers) {
  const source = def.steps.find((s) => s.key === step.config.rowsFrom);
  return matrixRowKeys(step, answers).map((key) => ({
    key,
    label: source?.options.find((o) => o.key === key)?.label ?? key,
  }));
}

export type RowAdvice = { general: SuggestionDef[]; rows: Record<string, SuggestionDef[]>; mandatory: Record<string, string[]> };

/**
 * Suggerimenti di una griglia, riga per riga: ogni suggerimento viene valutato come se
 * nello step sorgente fosse selezionata solo quella riga. Quelli senza opzione validi
 * per tutte le righe sono "generali" e si mostrano una volta sola.
 */
export function matrixAdvice(def: WizardDef, step: StepDef, answers: Answers): RowAdvice {
  const eff = effectiveAnswers(def, answers);
  const rowKeys = matrixRowKeys(step, eff);
  const available = new Set(visibleOptions(step, eff).map((o) => o.key));
  const source = step.config.rowsFrom!;
  const matches = (s: SuggestionDef, row: string) =>
    evaluate(s.condition, { ...eff, [source]: [row] }) && (s.optionKey === null || available.has(s.optionKey));

  const all = [...(step.suggestions ?? [])].sort((a, b) => b.priority - a.priority);
  const general = rowKeys.length ? all.filter((s) => s.optionKey === null && rowKeys.every((r) => matches(s, r))) : [];
  const rows: Record<string, SuggestionDef[]> = {};
  const mandatory: Record<string, string[]> = {};
  for (const row of rowKeys) {
    rows[row] = all.filter((s) => !general.includes(s) && matches(s, row));
    mandatory[row] = rows[row].flatMap((s) => (s.mandatory && s.optionKey ? [s.optionKey] : []));
  }
  return { general, rows, mandatory };
}

/** Opzioni obbligatorie mancanti nella risposta (per scelta singola/multipla e griglie). */
export function missingMandatory(def: WizardDef, step: StepDef, answers: Answers, value: AnswerValue): string[] {
  if (step.type === "MATRIX") {
    const { mandatory } = matrixAdvice(def, step, answers);
    const v = value as Record<string, string[]>;
    return Object.entries(mandatory).flatMap(([row, keys]) => keys.filter((k) => !v[row]?.includes(k)).map((k) => `${row}:${k}`));
  }
  const required = matchingSuggestions(def, step, answers).flatMap((s) => (s.mandatory && s.optionKey ? [s.optionKey] : []));
  const selected = Array.isArray(value) ? value : [value];
  return required.filter((k) => !selected.includes(k));
}

export type AreaScore = { key: string; label: string; points: number; maxPoints: number; percent: number };
export type ScoreResult = { total: number; areas: AreaScore[] };

/**
 * Punteggio per area = somma dei punti delle regole soddisfatte, limitata a [0, maxPoints],
 * espressa in percentuale. Totale = media pesata delle percentuali.
 */
export function computeScore(def: WizardDef, answers: Answers): ScoreResult {
  const eff = effectiveAnswers(def, answers);
  const areas = def.areas.map((area) => {
    const raw = def.scoringRules
      .filter((r) => r.areaKey === area.key && evaluate(r.condition, eff))
      .reduce((sum, r) => sum + r.points, 0);
    const points = Math.max(0, Math.min(area.maxPoints, raw));
    const percent = area.maxPoints > 0 ? Math.round((points / area.maxPoints) * 100) : 0;
    return { key: area.key, label: area.label, points, maxPoints: area.maxPoints, percent };
  });

  const weightSum = def.areas.reduce((s, a) => s + a.weight, 0);
  const total =
    weightSum > 0
      ? Math.round(areas.reduce((s, a, i) => s + a.percent * def.areas[i].weight, 0) / weightSum)
      : 0;

  return { total, areas };
}

/**
 * Suggerimenti di uno step validi per le risposte date, dalla priorità più alta.
 * Si considerano solo le risposte degli step visibili; un suggerimento che punta
 * a un'opzione non disponibile viene ignorato.
 */
export function matchingSuggestions(def: WizardDef, step: StepDef, answers: Answers): SuggestionDef[] {
  const eff = effectiveAnswers(def, answers);
  const available = new Set(visibleOptions(step, eff).map((o) => o.key));
  return (step.suggestions ?? [])
    .filter((s) => evaluate(s.condition, eff) && (s.optionKey === null || available.has(s.optionKey)))
    .sort((a, b) => b.priority - a.priority);
}

export function matchingRecommendations(def: WizardDef, answers: Answers): RecommendationDef[] {
  const eff = effectiveAnswers(def, answers);
  return def.recommendations
    .filter((r) => evaluate(r.condition, eff))
    .sort((a, b) => b.priority - a.priority);
}
