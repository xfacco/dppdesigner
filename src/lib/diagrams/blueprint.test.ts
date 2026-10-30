import { describe, expect, it } from "vitest";
import type { StepDef, WizardDef } from "@/lib/wizard/engine";
import { generateBlueprint } from "./blueprint";
import { resolveDiagramConfig } from "./config";
import type { Translate } from "./generate";

// Traduttore di prova: le chiavi "short" e "sections" esistono solo per alcuni step
const KNOWN = new Set(["blueprint.short.industry", "blueprint.sections.company", "blueprint.sections.product"]);
const t: Translate = Object.assign(
  (key: string, vars?: Record<string, string | number>) => (vars ? `${key}(${Object.values(vars).join("|")})` : key),
  { has: (key: string) => KNOWN.has(key) },
);

const opt = (key: string) => ({ key, label: key.toUpperCase(), visibleIf: null });
function step(key: string, type: StepDef["type"], options: string[] = [], extra: Partial<StepDef> = {}): StepDef {
  return { key, type, required: true, visibleIf: null, config: {}, title: `Domanda ${key}?`, options: options.map(opt), ...extra };
}

const def: WizardDef = {
  versionId: "v",
  areas: [],
  scoringRules: [],
  recommendations: [],
  steps: [
    step("industry", "SINGLE_CHOICE", ["battery"]),
    step("product_categories", "MULTI_CHOICE", ["battery_ev", "battery_portable"]),
    step("company_type", "MULTI_CHOICE", ["manufacturer", "brand"]),
    step("production_model", "SINGLE_CHOICE", ["both"], { visibleIf: { step: "company_type", op: "includes", value: "manufacturer" } }),
    step("sample_product", "FIELDS", [], { config: { fields: [{ key: "name", type: "text", label: { it: "Nome" } }] } }),
    step("sku_count", "NUMBER"),
    step("dpp_granularity", "MATRIX", ["model", "item", "unsure"], {
      config: { rowsFrom: "product_categories" },
      suggestions: [
        { condition: { step: "product_categories", op: "includes", value: "battery_ev" }, optionKey: "item", mandatory: true, priority: 10, message: "**EV**" },
      ],
    }),
    step("maintenance", "MATRIX", ["yes", "no"], { config: { rowsFrom: "product_categories", multiple: false } }),
    step("hosting", "SINGLE_CHOICE", ["saas", "undecided"]),
    step("registry_integration", "SINGLE_CHOICE", ["direct", "not_planned"]),
    step("qr_presence", "SINGLE_CHOICE", ["qr", "none"]),
    step("custom_extra", "TEXT"),
  ],
};
const cfg = resolveDiagramConfig(null);

const answers = {
  industry: "battery",
  product_categories: ["battery_ev", "battery_portable"],
  company_type: ["brand"],
  sample_product: { name: "Pacco X" },
  sku_count: 2500,
  dpp_granularity: { battery_ev: ["model"], battery_portable: ["unsure"] },
  maintenance: { battery_ev: ["yes"] },
  hosting: "undecided",
  registry_integration: "not_planned",
  qr_presence: "qr",
};

const bp = generateBlueprint(def, answers, cfg, t, "it");
const card = (k: string) => bp.sections.flatMap((s) => s.cards).find((c) => c.stepKey === k);

describe("Blueprint del DPP", () => {
  it("include tutti gli step: schede nelle aree, griglie nella tabella, step non assegnati in 'Altro'", () => {
    expect(bp.sections.map((s) => s.key)).toEqual(["company", "product", "identification", "infrastructure", "other"]);
    const cardKeys = bp.sections.flatMap((s) => s.cards.map((c) => c.stepKey));
    const tableKeys = bp.sections.find((s) => s.table)!.table!.columns.map((c) => c.stepKey);
    expect([...cardKeys, ...tableKeys].sort()).toEqual(def.steps.map((s) => s.key).sort());
    expect(bp.sections.at(-1)!.cards.map((c) => c.stepKey)).toEqual(["custom_extra"]);
  });

  it("usa i titoli brevi quando esistono, altrimenti la domanda", () => {
    expect(card("industry")!.title).toBe("blueprint.short.industry");
    expect(card("hosting")!.title).toBe("Domanda hosting?");
    expect(bp.sections[0].title).toBe("blueprint.sections.company");
    expect(bp.sections.find((s) => s.key === "infrastructure")!.title).toBe("infrastructure");
  });

  it("assegna lo stato a ogni scheda", () => {
    expect(card("industry")).toMatchObject({ value: "BATTERY", status: "defined" });
    expect(card("production_model")).toMatchObject({ value: "blueprint.na", status: "na" }); // nascosto (brand)
    expect(card("sku_count")).toMatchObject({ value: "2500", status: "defined" }); // in italiano 4 cifre senza separatore
    expect(generateBlueprint(def, { ...answers, sku_count: 25000 }, cfg, t, "it").sections[0].cards.at(-1)!.value).toBe("25.000");
    expect(card("sample_product")!.value).toBe("Pacco X");
    expect(card("hosting")!.status).toBe("open");
    expect(card("registry_integration")!.status).toBe("attention");
    expect(card("custom_extra")).toMatchObject({ value: "toDefine", status: "open" });
  });

  it("costruisce la tabella per categoria e segnala l'obbligo tolto", () => {
    const table = bp.sections.find((s) => s.key === "product")!.table!;
    expect(table.rows.map((r) => [r.label, r.cells.map((c) => `${c.value}:${c.status}`)])).toEqual([
      ["BATTERY_EV", ["MODEL:attention", "YES:defined"]],
      ["BATTERY_PORTABLE", ["UNSURE:open", "toDefine:open"]],
    ]);
    expect(bp.notes[0]).toEqual({
      tone: "attention",
      text: "blueprint.noteMandatoryMissing(BATTERY_EV|ITEM|Domanda dpp_granularity?)",
    });
  });

  it("conta uno stato per step e riassume i punti aperti", () => {
    // 12 step: 6 definiti; da definire hosting, custom_extra, griglia manutenzione (riga senza risposta);
    // attenzione registro e griglia livello (obbligo tolto); n/a production_model
    expect(bp.counts).toEqual({ defined: 6, open: 3, attention: 2, na: 1 });
    expect(bp.notes.find((n) => n.tone === "open")!.text).toContain("Domanda hosting?");
    expect(bp.title).toBe("blueprint.titleWithProduct(Pacco X)");
  });
});
