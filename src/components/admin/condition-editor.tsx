"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { OPERATOR_LABELS } from "@/lib/wizard/describe";
import { conditionSchema, OPERATORS, type Comparison, type Condition, type Operator } from "@/lib/wizard/rules";

export type StepRef = {
  key: string;
  title: string;
  type: string;
  options: { key: string; label: string }[];
  /** Campi dei gruppi di campi, o righe delle griglie (type "row") */
  fields: { key: string; label: string; type: "text" | "number" | "row" }[];
};

type Row = { step: string; field: string; op: Operator; value: unknown };
type Simple = { mode: "all" | "any"; rows: Row[] };

const LIST_OPS: Operator[] = ["in", "nin", "includes", "excludes"];
const NUMERIC_OPS: Operator[] = ["gt", "gte", "lt", "lte"];
const PRESENCE_OPS: Operator[] = ["answered", "empty"];

/** Operatori sensati per il tipo di step (e, per i gruppi di campi, per il tipo di campo). */
function operatorsFor(step: StepRef | undefined, field: string): Operator[] {
  switch (step?.type) {
    case "SINGLE_CHOICE":
      return ["eq", "neq", "in", "nin", ...PRESENCE_OPS];
    case "MULTI_CHOICE":
      return ["includes", "excludes", ...PRESENCE_OPS];
    case "NUMBER":
      return ["eq", "neq", ...NUMERIC_OPS, ...PRESENCE_OPS];
    case "TEXT":
      return ["eq", "neq", ...PRESENCE_OPS];
    case "MATRIX":
      // Con una riga scelta si guarda quella; senza, tutte le righe insieme
      return ["includes", "excludes", ...PRESENCE_OPS];
    case "FIELDS": {
      const f = step.fields.find((x) => x.key === field);
      if (!f) return PRESENCE_OPS;
      return f.type === "number" ? ["eq", "neq", ...NUMERIC_OPS, ...PRESENCE_OPS] : ["eq", "neq", ...PRESENCE_OPS];
    }
    default:
      return [...OPERATORS];
  }
}

/** Una condizione è modificabile col form se è un confronto o un all/any di confronti. */
function toSimple(c: Condition | null): Simple | null {
  if (!c) return { mode: "all", rows: [] };
  const isComparison = (x: Condition): x is Comparison => "step" in x;
  const toRow = (x: Comparison): Row => ({ step: x.step, field: x.field ?? "", op: x.op, value: x.value });
  if (isComparison(c)) return { mode: "all", rows: [toRow(c)] };
  if ("all" in c && c.all.every(isComparison)) return { mode: "all", rows: c.all.map(toRow) };
  if ("any" in c && c.any.every(isComparison)) return { mode: "any", rows: c.any.map(toRow) };
  return null;
}

function fromSimple(s: Simple, steps: StepRef[]): Condition | null {
  if (!s.rows.length) return null;
  const rows = s.rows.map((r): Comparison => {
    const step = steps.find((x) => x.key === r.step);
    const out: Comparison = { step: r.step, op: r.op };
    if (r.field) out.field = r.field;
    if (r.op === "answered" || r.op === "empty") return out;
    let value = r.value;
    const numericField = step?.fields.find((f) => f.key === r.field)?.type === "number";
    if (NUMERIC_OPS.includes(r.op) || ((step?.type === "NUMBER" || numericField) && !LIST_OPS.includes(r.op))) value = Number(value);
    if (LIST_OPS.includes(r.op) && !Array.isArray(value)) value = value === undefined || value === "" ? [] : [value];
    if (!LIST_OPS.includes(r.op) && Array.isArray(value)) value = value[0];
    out.value = value;
    return out;
  });
  return rows.length === 1 ? rows[0] : s.mode === "all" ? { all: rows } : { any: rows };
}

export function ConditionEditor({
  name,
  initial,
  steps,
  emptyLabel = "Nessuna condizione (sempre vera)",
}: {
  name: string;
  initial: Condition | null;
  steps: StepRef[];
  emptyLabel?: string;
}) {
  const startSimple = useMemo(() => toSimple(initial), [initial]);
  const [mode, setMode] = useState<"form" | "json">(startSimple ? "form" : "json");
  const [simple, setSimple] = useState<Simple>(startSimple ?? { mode: "all", rows: [] });
  const [json, setJson] = useState(initial ? JSON.stringify(initial, null, 2) : "");

  const serialized = mode === "form" ? (simple.rows.length ? JSON.stringify(fromSimple(simple, steps)) : "") : json;
  const jsonError = useMemo(() => {
    if (mode !== "json" || !json.trim()) return null;
    try {
      return conditionSchema.safeParse(JSON.parse(json)).success ? null : "Struttura non valida";
    } catch {
      return "JSON non valido";
    }
  }, [mode, json]);

  const update = (i: number, patch: Partial<Row>) =>
    setSimple((s) => ({ ...s, rows: s.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <input type="hidden" name={name} value={serialized} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {mode === "form" ? (
          <div className="flex items-center gap-2 text-sm">
            <span>Vera se</span>
            <Select
              className="h-8 w-auto"
              value={simple.mode}
              onChange={(e) => setSimple((s) => ({ ...s, mode: e.target.value as "all" | "any" }))}
              aria-label="Combinazione"
            >
              <option value="all">tutte</option>
              <option value="any">almeno una</option>
            </Select>
            <span>le condizioni sono soddisfatte</span>
          </div>
        ) : (
          <span className="text-sm">Condizione in JSON</span>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            if (mode === "form") {
              const c = fromSimple(simple, steps);
              setJson(c ? JSON.stringify(c, null, 2) : "");
              setMode("json");
            } else {
              try {
                const s = toSimple(json.trim() ? conditionSchema.parse(JSON.parse(json)) : null);
                if (s) {
                  setSimple(s);
                  setMode("form");
                }
              } catch {
                /* resta in JSON finché non è valido */
              }
            }
          }}
        >
          {mode === "form" ? "Modifica JSON" : "Torna al form"}
        </Button>
      </div>

      {mode === "json" ? (
        <>
          <Textarea
            className="font-mono text-xs"
            rows={6}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"step": "industry", "op": "eq", "value": "battery"}'
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
        </>
      ) : (
        <>
          {simple.rows.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
          {simple.rows.map((row, i) => {
            const step = steps.find((s) => s.key === row.step);
            const isList = LIST_OPS.includes(row.op);
            const noValue = row.op === "answered" || row.op === "empty";
            const selected = Array.isArray(row.value) ? (row.value as string[]) : row.value ? [String(row.value)] : [];
            return (
              <div key={i} className="grid gap-2 rounded-md bg-muted/50 p-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
                <Select
                  className="h-9"
                  value={row.step}
                  onChange={(e) => {
                    const next = steps.find((s) => s.key === e.target.value);
                    update(i, { step: e.target.value, field: "", value: undefined, op: operatorsFor(next, "")[0] });
                  }}
                  aria-label="Step"
                >
                  {steps.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.title} ({s.key})
                    </option>
                  ))}
                </Select>
                <div className="grid gap-2">
                  {step && step.fields.length > 0 && (
                    <Select
                      className="h-9"
                      value={row.field}
                      onChange={(e) => update(i, { field: e.target.value, op: operatorsFor(step, e.target.value)[0], value: undefined })}
                      aria-label="Campo"
                    >
                      <option value="">{step.type === "MATRIX" ? "— qualsiasi riga —" : "— campo —"}</option>
                      {step.fields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Select className="h-9" value={row.op} onChange={(e) => update(i, { op: e.target.value as Operator })} aria-label="Operatore">
                    {operatorsFor(step, row.field).map((op) => (
                      <option key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </option>
                    ))}
                    {/* Operatore salvato in passato e non più proposto per questo tipo: resta selezionato */}
                    {!operatorsFor(step, row.field).includes(row.op) && (
                      <option value={row.op}>{OPERATOR_LABELS[row.op]} (sconsigliato)</option>
                    )}
                  </Select>
                </div>
                <div>
                  {noValue ? null : step && step.options.length > 0 ? (
                    isList ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                        {step.options.map((o) => (
                          <label key={o.key} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={selected.includes(o.key)}
                              onChange={(e) =>
                                update(i, {
                                  value: e.target.checked ? [...selected, o.key] : selected.filter((k) => k !== o.key),
                                })
                              }
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Select className="h-9" value={selected[0] ?? ""} onChange={(e) => update(i, { value: e.target.value })} aria-label="Valore">
                        <option value="">— scegli —</option>
                        {step.options.map((o) => (
                          <option key={o.key} value={o.key}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    )
                  ) : (
                    <input
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={isList ? selected.join(",") : String(row.value ?? "")}
                      onChange={(e) =>
                        update(i, { value: isList ? e.target.value.split(",").map((x) => x.trim()).filter(Boolean) : e.target.value })
                      }
                      placeholder={isList ? "valori separati da virgola" : "valore"}
                      aria-label="Valore"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSimple((s) => ({ ...s, rows: s.rows.filter((_, j) => j !== i) }))}
                  aria-label="Rimuovi condizione"
                >
                  ✕
                </Button>
              </div>
            );
          })}
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={steps.length === 0}
              onClick={() =>
                setSimple((s) => ({
                  ...s,
                  rows: [...s.rows, { step: steps[0].key, field: "", op: operatorsFor(steps[0], "")[0], value: undefined }],
                }))
              }
            >
              + Aggiungi condizione
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
