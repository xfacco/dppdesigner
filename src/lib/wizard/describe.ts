import type { Condition, Operator } from "./rules";

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: "è uguale a",
  neq: "è diverso da",
  in: "è uno tra",
  nin: "non è uno tra",
  includes: "contiene almeno uno tra",
  excludes: "non contiene nessuno tra",
  gt: "è maggiore di",
  gte: "è maggiore o uguale a",
  lt: "è minore di",
  lte: "è minore o uguale a",
  answered: "ha una risposta",
  empty: "è vuoto",
};

const fmt = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v));

/** Descrizione leggibile di una condizione, per le tabelle dell'admin. */
export function describeCondition(c: Condition | null | undefined): string {
  if (!c) return "sempre";
  if ("all" in c) return c.all.length ? c.all.map(describeCondition).join(" E ") : "sempre";
  if ("any" in c) return c.any.length ? `(${c.any.map(describeCondition).join(" O ")})` : "mai";
  if ("not" in c) return `NON (${describeCondition(c.not)})`;
  const target = c.field ? `${c.step}.${c.field}` : c.step;
  const needsValue = c.op !== "answered" && c.op !== "empty";
  return `${target} ${OPERATOR_LABELS[c.op]}${needsValue ? ` ${fmt(c.value)}` : ""}`;
}
