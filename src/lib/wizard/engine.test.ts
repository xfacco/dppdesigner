import { describe, expect, it } from "vitest";
import {
  answerSchema,
  computeScore,
  dependentSteps,
  firstIncompleteStep,
  matchingRecommendations,
  matchingSuggestions,
  matrixAdvice,
  matrixRows,
  missingMandatory,
  visibleSteps,
  type StepDef,
  type WizardDef,
} from "./engine";
import { conditionSchema, evaluate, referencedSteps } from "./rules";

function step(key: string, extra: Partial<StepDef> = {}): StepDef {
  return {
    key,
    type: "SINGLE_CHOICE",
    required: true,
    visibleIf: null,
    config: {},
    title: key,
    options: [
      { key: "yes", label: "Sì", visibleIf: null },
      { key: "no", label: "No", visibleIf: null },
    ],
    ...extra,
  };
}

const def: WizardDef = {
  versionId: "v1",
  steps: [
    step("maintenance"),
    step("maintenance_plan", { visibleIf: { step: "maintenance", op: "eq", value: "yes" } }),
    step("sources", {
      type: "MULTI_CHOICE",
      options: [
        { key: "excel", label: "Excel", visibleIf: null },
        { key: "api", label: "API", visibleIf: null },
        { key: "erp", label: "ERP", visibleIf: null },
      ],
    }),
    step("skus", { type: "NUMBER", options: [], config: { min: 1 } }),
  ],
  areas: [
    { key: "data", label: "Dati", weight: 1, maxPoints: 10 },
    { key: "process", label: "Processo", weight: 3, maxPoints: 4 },
  ],
  scoringRules: [
    { areaKey: "data", condition: { step: "sources", op: "includes", value: ["api", "erp"] }, points: 8 },
    { areaKey: "data", condition: { step: "sources", op: "includes", value: "excel" }, points: 4 },
    { areaKey: "process", condition: { step: "maintenance_plan", op: "eq", value: "yes" }, points: 4 },
  ],
  recommendations: [
    { condition: { step: "sources", op: "includes", value: "excel" }, priority: 1, title: "A", body: "" },
    { condition: { step: "skus", op: "gt", value: 1000 }, priority: 5, title: "B", body: "" },
  ],
};

describe("rules", () => {
  it("valuta operatori e combinazioni", () => {
    const a = { x: "a", list: ["p", "q"], n: 5, f: { name: "Bike" } };
    expect(evaluate({ step: "x", op: "eq", value: "a" }, a)).toBe(true);
    expect(evaluate({ step: "x", op: "in", value: ["b", "c"] }, a)).toBe(false);
    expect(evaluate({ step: "list", op: "includes", value: "q" }, a)).toBe(true);
    expect(evaluate({ step: "list", op: "excludes", value: ["z"] }, a)).toBe(true);
    expect(evaluate({ step: "n", op: "gte", value: 5 }, a)).toBe(true);
    expect(evaluate({ step: "f", field: "name", op: "answered" }, a)).toBe(true);
    expect(evaluate({ step: "missing", op: "empty" }, a)).toBe(true);
    expect(
      evaluate({ all: [{ step: "x", op: "eq", value: "a" }, { not: { step: "n", op: "lt", value: 3 } }] }, a),
    ).toBe(true);
    expect(evaluate({ any: [] }, a)).toBe(false);
  });

  it("applica uguale / uno tra alle scelte multiple come 'almeno uno selezionato'", () => {
    const a = { company_type: ["manufacturer", "brand"] };
    expect(evaluate({ step: "company_type", op: "in", value: ["manufacturer", "other"] }, a)).toBe(true);
    expect(evaluate({ step: "company_type", op: "in", value: ["retailer", "other"] }, a)).toBe(false);
    expect(evaluate({ step: "company_type", op: "nin", value: ["retailer"] }, a)).toBe(true);
    expect(evaluate({ step: "company_type", op: "nin", value: ["brand"] }, a)).toBe(false);
    expect(evaluate({ step: "company_type", op: "eq", value: "brand" }, a)).toBe(true);
    expect(evaluate({ step: "company_type", op: "neq", value: "brand" }, a)).toBe(false);
    expect(evaluate({ step: "company_type", op: "in", value: ["manufacturer"] }, {})).toBe(false);
  });

  it("estrae gli step referenziati", () => {
    expect(
      referencedSteps({ any: [{ step: "a", op: "answered" }, { not: { step: "b", op: "empty" } }] }).sort(),
    ).toEqual(["a", "b"]);
  });

  it("rifiuta condizioni malformate", () => {
    expect(conditionSchema.safeParse({ step: "a", op: "boh" }).success).toBe(false);
    expect(conditionSchema.safeParse({ all: [{ step: "a", op: "eq", value: 1 }] }).success).toBe(true);
  });
});

describe("engine", () => {
  it("mostra gli step condizionali solo quando servono", () => {
    expect(visibleSteps(def, {}).map((s) => s.key)).toEqual(["maintenance", "sources", "skus"]);
    expect(visibleSteps(def, { maintenance: "yes" }).map((s) => s.key)).toContain("maintenance_plan");
  });

  it("trova il primo step incompleto", () => {
    expect(firstIncompleteStep(def, {})?.key).toBe("maintenance");
    expect(firstIncompleteStep(def, { maintenance: "no", sources: [], skus: 3 })?.key).toBe("sources");
    expect(firstIncompleteStep(def, { maintenance: "no", sources: ["api"], skus: 3 })).toBeNull();
  });

  it("individua le dipendenze", () => {
    expect(dependentSteps(def, "maintenance")).toEqual(["maintenance_plan"]);
    expect(dependentSteps(def, "skus")).toEqual([]);
  });

  it("valida le risposte per tipo", () => {
    const [, , sources, skus] = def.steps;
    expect(answerSchema(sources).safeParse(["api"]).success).toBe(true);
    expect(answerSchema(sources).safeParse(["nope"]).success).toBe(false);
    expect(answerSchema(sources).safeParse([]).success).toBe(false);
    expect(answerSchema(skus).safeParse(0).success).toBe(false);
  });

  it("calcola il punteggio ignorando gli step nascosti", () => {
    const hidden = computeScore(def, { maintenance: "no", maintenance_plan: "yes", sources: ["api", "excel"] });
    expect(hidden.areas.map((a) => a.points)).toEqual([10, 0]);
    expect(hidden.total).toBe(25);

    const visible = computeScore(def, { maintenance: "yes", maintenance_plan: "yes", sources: ["excel"] });
    expect(visible.areas.map((a) => a.percent)).toEqual([40, 100]);
    expect(visible.total).toBe(85);
  });

  it("propone i suggerimenti dello step in base alle risposte", () => {
    const granularity = step("granularity", {
      options: [
        { key: "model", label: "Modello", visibleIf: null },
        { key: "item", label: "Singolo", visibleIf: null },
      ],
      suggestions: [
        { condition: { step: "sources", op: "includes", value: "excel" }, optionKey: "model", priority: 1, message: "M" },
        { condition: { step: "sources", op: "includes", value: "api" }, optionKey: "item", priority: 5, message: "I" },
        { condition: { step: "sources", op: "includes", value: "erp" }, optionKey: "missing", priority: 9, message: "X" },
        { condition: { step: "maintenance_plan", op: "answered" }, optionKey: null, priority: 0, message: "N" },
      ],
    });
    const d = { ...def, steps: [...def.steps, granularity] };
    const msgs = (a: Record<string, unknown>) =>
      matchingSuggestions(d, granularity, a as never).map((s) => s.message);
    expect(msgs({ sources: ["excel", "api", "erp"] })).toEqual(["I", "M"]);
    // risposta a uno step nascosto (maintenance=no) ignorata
    expect(msgs({ maintenance: "no", maintenance_plan: "yes", sources: ["excel"] })).toEqual(["M"]);
    expect(msgs({ maintenance: "yes", maintenance_plan: "yes", sources: [] })).toEqual(["N"]);
  });

  describe("griglia per categorie (MATRIX)", () => {
    const categories = step("cats", {
      type: "MULTI_CHOICE",
      options: [
        { key: "ev", label: "Batterie EV", visibleIf: null },
        { key: "apparel", label: "Abbigliamento", visibleIf: null },
      ],
    });
    const level = step("level", {
      type: "MATRIX",
      config: { rowsFrom: "cats" },
      options: [
        { key: "model", label: "Modello", visibleIf: null },
        { key: "item", label: "Singolo", visibleIf: null },
        { key: "unsure", label: "Non so", visibleIf: null },
      ],
      suggestions: [
        { condition: { step: "cats", op: "includes", value: "ev" }, optionKey: "item", mandatory: true, priority: 10, message: "EV" },
        { condition: { step: "cats", op: "includes", value: "apparel" }, optionKey: "model", priority: 3, message: "APP" },
        { condition: { step: "cats", op: "answered" }, optionKey: null, priority: 0, message: "GEN" },
      ],
    });
    const d: WizardDef = { ...def, steps: [categories, level] };

    it("ha una riga per categoria selezionata e la valida", () => {
      const a = { cats: ["ev", "apparel"] };
      expect(matrixRows(d, level, a).map((r) => r.label)).toEqual(["Batterie EV", "Abbigliamento"]);
      expect(answerSchema(level, a).safeParse({ ev: ["item"], apparel: ["model", "item"] }).success).toBe(true);
      expect(answerSchema(level, a).safeParse({ ev: ["item"] }).success).toBe(false); // riga mancante
      expect(answerSchema(level, a).safeParse({ ev: ["item"], apparel: [] }).success).toBe(false); // riga vuota
      expect(answerSchema(level, a).safeParse({ ev: ["batch"], apparel: ["model"] }).success).toBe(false); // opzione inesistente
    });

    it("se cambiano le categorie la griglia va rivista", () => {
      expect(dependentSteps(d, "cats")).toEqual(["level"]);
      const answers = { cats: ["ev", "apparel"], level: { ev: ["item"] } };
      expect(firstIncompleteStep(d, answers)?.key).toBe("level");
    });

    it("dà consigli riga per riga e individua gli obblighi", () => {
      const advice = matrixAdvice(d, level, { cats: ["ev", "apparel"] });
      expect(advice.general.map((s) => s.message)).toEqual(["GEN"]);
      expect(advice.rows.ev.map((s) => s.message)).toEqual(["EV"]);
      expect(advice.rows.apparel.map((s) => s.message)).toEqual(["APP"]);
      expect(advice.mandatory).toEqual({ ev: ["item"], apparel: [] });
      const a = { cats: ["ev", "apparel"] };
      expect(missingMandatory(d, level, a, { ev: ["model"], apparel: ["model"] })).toEqual(["ev:item"]);
      expect(missingMandatory(d, level, a, { ev: ["item", "model"], apparel: ["model"] })).toEqual([]);
    });

    it("con multiple=false accetta una sola colonna per riga", () => {
      const single = { ...level, config: { rowsFrom: "cats", multiple: false } };
      const a = { cats: ["ev"] };
      expect(answerSchema(single, a).safeParse({ ev: ["item"] }).success).toBe(true);
      expect(answerSchema(single, a).safeParse({ ev: ["item", "model"] }).success).toBe(false);
    });

    it("le condizioni funzionano su una riga o su tutte le righe", () => {
      const a = { level: { ev: ["item"], apparel: ["model"] } };
      expect(evaluate({ step: "level", field: "apparel", op: "includes", value: "item" }, a)).toBe(false);
      expect(evaluate({ step: "level", field: "ev", op: "includes", value: "item" }, a)).toBe(true);
      expect(evaluate({ step: "level", op: "includes", value: "item" }, a)).toBe(true);
      expect(evaluate({ step: "level", op: "in", value: ["model", "batch"] }, a)).toBe(true);
      expect(evaluate({ step: "level", op: "excludes", value: "unsure" }, a)).toBe(true);
    });
  });

  it("ordina le raccomandazioni per priorità", () => {
    const recs = matchingRecommendations(def, { maintenance: "no", sources: ["excel"], skus: 5000 });
    expect(recs.map((r) => r.title)).toEqual(["B", "A"]);
  });
});
