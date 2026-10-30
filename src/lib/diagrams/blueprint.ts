import {
  effectiveAnswers,
  matrixAdvice,
  matrixRows,
  visibleSteps,
  type StepDef,
  type WizardDef,
} from "@/lib/wizard/engine";
import type { AnswerValue, Answers } from "@/lib/wizard/rules";
import type { DiagramConfig } from "./config";
import type { Translate } from "./generate";

/**
 * Blueprint del DPP: tutti gli step della versione raggruppati in aree, ognuno con la
 * risposta e uno stato. Le griglie per categoria diventano una tabella unica
 * (categoria × step). Funzione pura, testata in blueprint.test.ts.
 */

export type BpStatus = "defined" | "open" | "attention" | "na";

export type BpCard = { stepKey: string; title: string; value: string; status: BpStatus };
export type BpCell = { value: string; status: BpStatus };
export type BpTable = {
  /** Step-colonna della tabella (griglie per categoria) */
  columns: { stepKey: string; title: string }[];
  rows: { key: string; label: string; cells: BpCell[] }[];
};
export type BpSection = { key: string; title: string; cards: BpCard[]; table?: BpTable };
export type BpNote = { tone: "attention" | "open" | "info"; text: string };

export type Blueprint = {
  title: string;
  subtitle: string;
  sections: BpSection[];
  counts: Record<BpStatus, number>;
  notes: BpNote[];
};

const STATUS_RANK: Record<BpStatus, number> = { na: 0, defined: 1, open: 2, attention: 3 };
const worst = (list: BpStatus[]): BpStatus => list.reduce<BpStatus>((w, s) => (STATUS_RANK[s] > STATUS_RANK[w] ? s : w), "defined");

const asList = (v: AnswerValue | undefined): string[] =>
  v === undefined || v === "" ? [] : Array.isArray(v) ? v : typeof v === "object" ? [] : [String(v)];

/** Toglie il Markdown leggero dai messaggi dei suggerimenti (grassetto, link). */
const plain = (md: string) => md.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\([^)]+\)/g, "$1");

export function generateBlueprint(
  def: WizardDef,
  rawAnswers: Answers,
  cfg: DiagramConfig,
  t: Translate,
  locale: string,
): Blueprint {
  const answers = effectiveAnswers(def, rawAnswers);
  const visible = new Set(visibleSteps(def, rawAnswers).map((s) => s.key));
  const opt = cfg.options;
  const roles = cfg.steps;
  const categoriesKey = roles.categories;
  const num = new Intl.NumberFormat(locale);

  const shortTitle = (step: StepDef) => {
    const custom = cfg.blueprint.shortTitles[step.key]?.[locale as "it" | "en"];
    if (custom) return custom;
    const key = `blueprint.short.${step.key}`;
    return t.has?.(key) ? t(key) : step.title;
  };
  const label = (step: StepDef, key: string) => step.options.find((o) => o.key === key)?.label ?? key;

  /** Stato di una risposta (non griglia). */
  function statusOf(step: StepDef, value: AnswerValue | undefined): BpStatus {
    if (!visible.has(step.key)) return "na";
    const list = asList(value);
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return "open";
    if (list.length && list.every((k) => opt.unknown.includes(k))) return "open";
    if (step.key === roles.hosting && list.some((k) => opt.hostingUndecided.includes(k))) return "open";
    if (step.key === roles.registry && !list.some((k) => opt.registryPlanned.includes(k))) return "attention";
    if (step.key === roles.carrierPresence && list.some((k) => opt.noCarrier.includes(k))) return "attention";
    return "defined";
  }

  function valueOf(step: StepDef, value: AnswerValue | undefined): string {
    if (!visible.has(step.key)) return t("blueprint.na");
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return t("toDefine");
    if (typeof value === "number") return num.format(value);
    if (Array.isArray(value)) return value.map((k) => label(step, k)).join(", ");
    if (typeof value === "object") {
      if (step.type === "FIELDS") {
        const fields = step.config.fields ?? [];
        return (
          fields
            .map((f) => value[f.key])
            .filter((v) => v !== undefined && v !== "")
            .join(" · ") || t("toDefine")
        );
      }
      return t("toDefine");
    }
    return step.options.length ? label(step, value) : value;
  }

  // ── Tabella per categoria: le griglie che prendono le righe dalle categorie
  const categoriesStep = def.steps.find((s) => s.key === categoriesKey);
  const matrixSteps = def.steps.filter((s) => s.type === "MATRIX" && s.config.rowsFrom === categoriesKey);
  const notes: BpNote[] = [];
  let table: BpTable | undefined;
  const matrixStatus = new Map<string, BpStatus>();

  if (categoriesStep && matrixSteps.length) {
    const rows = matrixRows(def, matrixSteps[0], answers);
    table = { columns: matrixSteps.map((s) => ({ stepKey: s.key, title: shortTitle(s) })), rows: [] };
    const advice = new Map(matrixSteps.map((s) => [s.key, matrixAdvice(def, s, answers)]));
    for (const row of rows) {
      const cells = matrixSteps.map((s): BpCell => {
        if (!visible.has(s.key)) return { value: t("blueprint.na"), status: "na" };
        const v = answers[s.key];
        const chosen = v && typeof v === "object" && !Array.isArray(v) ? ((v as Record<string, string[]>)[row.key] ?? []) : [];
        const mandatory = advice.get(s.key)!.mandatory[row.key] ?? [];
        const missing = mandatory.filter((k) => !chosen.includes(k));
        for (const k of mandatory) {
          notes.push(
            missing.includes(k)
              ? { tone: "attention", text: t("blueprint.noteMandatoryMissing", { category: row.label, option: label(s, k), step: shortTitle(s) }) }
              : { tone: "info", text: t("blueprint.noteMandatory", { category: row.label, option: label(s, k), step: shortTitle(s) }) },
          );
        }
        if (!chosen.length) return { value: t("toDefine"), status: "open" };
        const value = chosen.map((k) => label(s, k)).join(", ");
        if (missing.length) return { value, status: "attention" };
        if (chosen.every((k) => opt.unknown.includes(k))) return { value, status: "open" };
        return { value, status: "defined" };
      });
      table.rows.push({ key: row.key, label: row.label, cells });
    }
    // Stato di ogni griglia = il peggiore delle sue celle
    matrixSteps.forEach((s, i) => {
      const cellStatuses = table!.rows.map((r) => r.cells[i].status);
      matrixStatus.set(s.key, !visible.has(s.key) ? "na" : cellStatuses.length ? worst(cellStatuses) : "open");
    });
  }
  const inTable = new Set(matrixSteps.map((s) => s.key));

  // ── Aree: quelle configurate, poi "Altro" per gli step non assegnati
  const assigned = new Set(cfg.blueprint.sections.flatMap((s) => s.steps));
  const sectionDefs = [
    ...cfg.blueprint.sections,
    { key: "other", steps: def.steps.map((s) => s.key).filter((k) => !assigned.has(k)) },
  ];
  const cardStatus = new Map<string, BpStatus>();

  const sections: BpSection[] = sectionDefs.flatMap((sec) => {
    const steps = sec.steps.map((k) => def.steps.find((s) => s.key === k)).filter((s): s is StepDef => Boolean(s));
    const cards = steps
      .filter((s) => !inTable.has(s.key))
      .map((s): BpCard => {
        const status = statusOf(s, answers[s.key]);
        cardStatus.set(s.key, status);
        return { stepKey: s.key, title: shortTitle(s), value: valueOf(s, answers[s.key]), status };
      });
    const hasTable = table && steps.some((s) => inTable.has(s.key));
    if (!cards.length && !hasTable) return [];
    const titleKey = `blueprint.sections.${sec.key}`;
    return [{ key: sec.key, title: t.has?.(titleKey) ? t(titleKey) : sec.key, cards, ...(hasTable ? { table } : {}) }];
  });
  // Se le griglie non sono in nessuna area configurata, la tabella va nell'area delle categorie
  if (table && !sections.some((s) => s.table)) {
    const home = sections.find((s) => s.cards.some((c) => c.stepKey === categoriesKey)) ?? sections[0];
    if (home) home.table = table;
  }

  // ── Contatori: uno per step
  const counts: Record<BpStatus, number> = { defined: 0, open: 0, attention: 0, na: 0 };
  for (const s of def.steps) {
    const st = matrixStatus.get(s.key) ?? cardStatus.get(s.key);
    if (st) counts[st]++;
  }

  // ── Note: obblighi (già raccolti), attenzioni e punti aperti
  const cards = sections.flatMap((s) => s.cards);
  for (const c of cards) {
    if (c.status !== "attention") continue;
    if (c.stepKey === roles.registry) notes.push({ tone: "attention", text: t("flow.noteRegistry") });
    else if (c.stepKey === roles.carrierPresence) notes.push({ tone: "attention", text: t("flow.noteCarrier") });
  }
  const open = [
    ...cards.filter((c) => c.status === "open").map((c) => c.title),
    ...(table?.columns.filter((col) => matrixStatus.get(col.stepKey) === "open").map((col) => col.title) ?? []),
  ];
  if (open.length) notes.push({ tone: "open", text: t("blueprint.noteOpen", { items: open.join(", ") }) });

  // Nome del prodotto di esempio nel titolo, se c'è
  const product = def.steps.find((s) => s.key === roles.product);
  const pv = product ? answers[product.key] : undefined;
  const name = pv && typeof pv === "object" && !Array.isArray(pv) && typeof pv.name === "string" ? pv.name.trim() : "";

  return {
    title: name ? t("blueprint.titleWithProduct", { product: name }) : t("blueprint.title"),
    subtitle: t("blueprint.subtitle"),
    sections,
    counts,
    notes: notes.map((n) => ({ ...n, text: plain(n.text) })),
  };
}
