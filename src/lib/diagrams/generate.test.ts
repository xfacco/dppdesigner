import { describe, expect, it } from "vitest";
import type { StepDef, WizardDef } from "@/lib/wizard/engine";
import { DEFAULT_DIAGRAM_CONFIG, resolveDiagramConfig } from "./config";
import { describeDiagram, generateFlowDiagram, type Diagram } from "./generate";

// Traduttore di prova: restituisce la chiave con le variabili, per controllare cosa viene usato
const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key}(${Object.values(vars).join("|")})` : key;

const opt = (key: string, label = key) => ({ key, label, visibleIf: null });
function step(key: string, type: StepDef["type"], options: string[] = [], config: StepDef["config"] = {}): StepDef {
  return { key, type, required: true, visibleIf: null, config, title: key, options: options.map((o) => opt(o, o.toUpperCase())) };
}

const def: WizardDef = {
  versionId: "v",
  areas: [],
  scoringRules: [],
  recommendations: [],
  steps: [
    step("product_categories", "MULTI_CHOICE", ["battery_ev", "battery_portable"]),
    step("sample_product", "FIELDS", [], { fields: [{ key: "name", type: "text", label: { it: "Nome" } }] }),
    step("dpp_granularity", "MATRIX", ["model", "batch", "item", "unsure"], { rowsFrom: "product_categories" }),
    step("data_dynamics", "MATRIX", ["static", "dynamic", "mixed"], { rowsFrom: "product_categories", multiple: false }),
    step("data_sources", "MULTI_CHOICE", ["suppliers_excel", "suppliers_pdf", "suppliers_api", "erp", "manual"]),
    step("data_organization", "SINGLE_CHOICE", ["centralized", "decentralized", "unorganized"]),
    step("data_model", "MULTI_CHOICE", ["materials", "origin"]),
    step("qr_presence", "SINGLE_CHOICE", ["qr", "none"]),
    step("url_scheme", "SINGLE_CHOICE", ["gs1_digital_link", "unsure"]),
    step("hosting", "SINGLE_CHOICE", ["saas", "undecided"]),
    step("registry_integration", "SINGLE_CHOICE", ["direct", "not_planned"]),
  ],
};

const full = {
  product_categories: ["battery_ev", "battery_portable"],
  sample_product: { name: "Pacco X" },
  dpp_granularity: { battery_ev: ["item"], battery_portable: [] },
  data_dynamics: { battery_ev: ["mixed"], battery_portable: ["static"] },
  data_sources: ["suppliers_excel", "suppliers_pdf", "suppliers_api", "erp", "manual"],
  data_organization: "decentralized",
  data_model: ["materials"],
  qr_presence: "qr",
  url_scheme: "gs1_digital_link",
  hosting: "saas",
  registry_integration: "direct",
};

const cfg = resolveDiagramConfig(null);
const ids = (d: Diagram) => d.columns.map((c) => c.id);
const item = (d: Diagram, id: string) => d.columns.flatMap((c) => c.items).find((i) => i.id === id);

describe("schema del flusso dei dati", () => {
  it("crea una fonte per tipo, middle layer, piattaforma e registro", () => {
    const flow = generateFlowDiagram(def, full, cfg, t);
    expect(ids(flow)).toEqual(["sources", "middle", "platform", "registry"]);
    const src = flow.columns[0].items.map((i) => [i.id, i.icon]);
    expect(src).toEqual([
      ["src-suppliers_excel", "excel"],
      ["src-suppliers_pdf", "pdf"],
      ["src-suppliers_api", "api"],
      ["src-erp", "system"],
      ["src-manual", "manual"],
      ["src-more", "more"],
    ]);
    expect(item(flow, "middle")?.bullets).toContain("flow.mlFiles(Excel, PDF)");
    expect(item(flow, "middle")?.bullets?.at(-1)).toBe("flow.mlQueue"); // dati dinamici → code
    expect(item(flow, "platform")?.subtitle).toBe("SAAS");
    expect(item(flow, "platform")?.bullets).toContain("flow.pIds(ITEM)");
    expect(item(flow, "platform")?.bullets).toContain("flow.pHistory");
  });

  it("disegna frecce puntinate verso il middle layer e la freccia di caricamento manuale", () => {
    const flow = generateFlowDiagram(def, full, cfg, t);
    expect(flow.edges).toContainEqual({ from: "src-suppliers_excel", to: "middle", style: "dotted" });
    expect(flow.edges).toContainEqual({ from: "src-manual", to: "platform", style: "solid", tone: "accent", label: "flow.manualUpload" });
    expect(flow.edges).toContainEqual({ from: "middle", to: "platform", style: "solid" });
    expect(flow.columns.find((c) => c.id === "middle")?.offsetTop).toBe(true);
  });

  it("senza integrazioni e con dati centralizzati non serve il middle layer", () => {
    const flow = generateFlowDiagram(def, { ...full, data_sources: ["erp"], data_organization: "centralized" }, cfg, t);
    expect(ids(flow)).toEqual(["sources", "platform", "registry"]);
    expect(flow.edges).toContainEqual({ from: "src-erp", to: "platform", style: "dotted" });
  });

  it("segnala hosting non deciso e Registro non pianificato", () => {
    const flow = generateFlowDiagram(def, { ...full, hosting: "undecided", registry_integration: "not_planned" }, cfg, t);
    expect(item(flow, "platform")?.dashed).toBe(true);
    expect(item(flow, "registry")?.tone).toBe("warning");
    expect(flow.edges.at(-1)).toMatchObject({ from: "platform", to: "registry", style: "dashed", label: "toPlan" });
    expect(flow.notes).toEqual(["flow.noteHosting", "flow.noteRegistry"]);
  });

  it("senza risposte mostra i riquadri 'da definire'", () => {
    const flow = generateFlowDiagram(def, {}, cfg, t);
    expect(item(flow, "src-undefined")?.tone).toBe("warning");
    expect(flow.notes).toContain("flow.noteSources");
  });
});

describe("configurazione", () => {
  it("unisce la configurazione salvata con quella predefinita e ignora quella non valida", () => {
    const c = resolveDiagramConfig({ steps: { hosting: "platform_choice" }, options: { manualEntry: ["hand"] } });
    expect(c.steps.hosting).toBe("platform_choice");
    expect(c.steps.sources).toBe(DEFAULT_DIAGRAM_CONFIG.steps.sources);
    expect(c.options.manualEntry).toEqual(["hand"]);
    expect(resolveDiagramConfig({ steps: { hosting: "NON VALIDA" } })).toEqual(DEFAULT_DIAGRAM_CONFIG);
  });

  it("produce una descrizione testuale", () => {
    const flow = generateFlowDiagram(def, full, cfg, t);
    const text = describeDiagram(flow, t);
    expect(text[0]).toMatch(/^flow.colSources: /);
    expect(text.some((l) => l.includes("describe.edge(SUPPLIERS_EXCEL|flow.mlTitle|describe.dotted)"))).toBe(true);
  });
});
