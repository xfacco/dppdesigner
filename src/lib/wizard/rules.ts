import { z } from "zod";

/**
 * Regole condizionali in JSON, valutate in modo identico su server e client.
 *
 *   { "step": "industry", "op": "eq", "value": "battery" }
 *   { "all": [ ...condizioni ] }   // AND
 *   { "any": [ ...condizioni ] }   // OR
 *   { "not": condizione }
 *
 * Per gli step di tipo FIELDS si può indicare `field` per confrontare un singolo campo.
 */

export const OPERATORS = [
  "eq",
  "neq",
  "in",
  "nin",
  "includes",
  "excludes",
  "gt",
  "gte",
  "lt",
  "lte",
  "answered",
  "empty",
] as const;
export type Operator = (typeof OPERATORS)[number];

export type Comparison = { step: string; field?: string; op: Operator; value?: unknown };
export type Condition =
  | Comparison
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export type AnswerValue = string | number | string[] | Record<string, string | number | string[]>;
export type Answers = Record<string, AnswerValue | undefined>;

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(conditionSchema) }).strict(),
    z.object({ any: z.array(conditionSchema) }).strict(),
    z.object({ not: conditionSchema }).strict(),
    z
      .object({
        step: z.string().min(1),
        field: z.string().min(1).optional(),
        op: z.enum(OPERATORS),
        value: z.unknown().optional(),
      })
      .strict(),
  ]),
);

/** Converte un valore JSON salvato su DB in condizione; null/undefined = nessuna condizione. */
export function parseCondition(raw: unknown): Condition | null {
  if (raw === null || raw === undefined) return null;
  return conditionSchema.parse(raw);
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.values(v).every(isEmpty);
  return false;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function compare(c: Comparison, answers: Answers): boolean {
  let actual: unknown = answers[c.step];
  if (actual && typeof actual === "object" && !Array.isArray(actual)) {
    const obj = actual as Record<string, unknown>;
    if (c.field) {
      actual = obj[c.field];
    } else if (Object.values(obj).every(Array.isArray)) {
      // Griglia senza riga indicata: si considerano i valori di tutte le righe insieme
      actual = [...new Set(Object.values(obj).flat())];
    }
  }

  // Per le scelte multiple la risposta è un elenco: "uguale a" e "uno tra" valgono
  // se almeno uno dei valori selezionati corrisponde.
  const selected = Array.isArray(actual) ? actual : null;
  const wantedList = Array.isArray(c.value) ? c.value : [c.value];

  switch (c.op) {
    case "answered":
      return !isEmpty(actual);
    case "empty":
      return isEmpty(actual);
    case "eq":
      return selected ? selected.includes(c.value) : actual === c.value;
    case "neq":
      return selected ? !selected.includes(c.value) : actual !== c.value;
    case "in":
      if (!Array.isArray(c.value)) return false;
      return selected ? selected.some((s) => wantedList.includes(s)) : c.value.includes(actual);
    case "nin":
      if (!Array.isArray(c.value)) return true;
      return selected ? !selected.some((s) => wantedList.includes(s)) : !c.value.includes(actual);
    case "includes": {
      if (!Array.isArray(actual)) return false;
      const wanted = Array.isArray(c.value) ? c.value : [c.value];
      return wanted.some((w) => actual.includes(w));
    }
    case "excludes": {
      if (!Array.isArray(actual)) return true;
      const unwanted = Array.isArray(c.value) ? c.value : [c.value];
      return !unwanted.some((w) => actual.includes(w));
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = asNumber(actual);
      const b = asNumber(c.value);
      if (a === null || b === null) return false;
      if (c.op === "gt") return a > b;
      if (c.op === "gte") return a >= b;
      if (c.op === "lt") return a < b;
      return a <= b;
    }
  }
}

export function evaluate(condition: Condition | null | undefined, answers: Answers): boolean {
  if (!condition) return true;
  if ("all" in condition) return condition.all.every((c) => evaluate(c, answers));
  if ("any" in condition) return condition.any.some((c) => evaluate(c, answers));
  if ("not" in condition) return !evaluate(condition.not, answers);
  return compare(condition, answers);
}

/** Chiavi degli step citati da una condizione (per tracciare le dipendenze). */
export function referencedSteps(condition: Condition | null | undefined): string[] {
  if (!condition) return [];
  if ("all" in condition) return [...new Set(condition.all.flatMap(referencedSteps))];
  if ("any" in condition) return [...new Set(condition.any.flatMap(referencedSteps))];
  if ("not" in condition) return referencedSteps(condition.not);
  return [condition.step];
}
