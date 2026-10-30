import { effectiveAnswers, matrixRows, type StepDef, type WizardDef } from "@/lib/wizard/engine";
import type { AnswerValue, Answers } from "@/lib/wizard/rules";
import type { DiagramConfig } from "./config";

/**
 * Generatore degli schemi del riepilogo. Produce una struttura "colonne → riquadri → frecce"
 * a partire dalle risposte: la stessa struttura alimenta il disegno SVG, la descrizione
 * testuale e il file scaricabile. Funzione pura, testata in generate.test.ts.
 */

export type Icon = "excel" | "pdf" | "api" | "system" | "manual" | "more" | "product" | "qr" | "registry" | "cloud";
export type Tone = "default" | "muted" | "warning";

export type DiagramItem = {
  id: string;
  title: string;
  subtitle?: string;
  lines?: string[];
  /** Elenco puntato (es. funzioni del core engine) */
  bullets?: string[];
  icon?: Icon;
  dashed?: boolean;
  tone?: Tone;
};

export type DiagramColumn = {
  id: string;
  title: string;
  color: "slate" | "sky" | "green" | "navy" | "amber";
  items: DiagramItem[];
  /** Spazio libero sopra i riquadri, per far passare le frecce che saltano la colonna */
  offsetTop?: boolean;
};

export type DiagramEdge = {
  from: string;
  to: string;
  style: "solid" | "dotted" | "dashed";
  tone?: "default" | "accent" | "warning";
  label?: string;
};

export type Diagram = {
  id: string;
  title: string;
  subtitle: string;
  columns: DiagramColumn[];
  edges: DiagramEdge[];
  notes: string[];
};

export type Translate = ((key: string, vars?: Record<string, string | number>) => string) & {
  /** Se presente, dice se una chiave esiste (per i testi facoltativi, es. titoli brevi) */
  has?: (key: string) => boolean;
};

type Ctx = {
  def: WizardDef;
  answers: Answers;
  cfg: DiagramConfig;
  t: Translate;
};

const asList = (v: AnswerValue | undefined): string[] => {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "object") return [...new Set(Object.values(v).flatMap((x) => (Array.isArray(x) ? x : [])))];
  return [String(v)];
};

function stepOf(ctx: Ctx, role: keyof DiagramConfig["steps"]): StepDef | undefined {
  return ctx.def.steps.find((s) => s.key === ctx.cfg.steps[role]);
}

/** Valori scelti per un ruolo (per le griglie: l'unione di tutte le righe). */
function valuesOf(ctx: Ctx, role: keyof DiagramConfig["steps"]): string[] {
  const step = stepOf(ctx, role);
  return step ? asList(ctx.answers[step.key]) : [];
}

function labelOf(ctx: Ctx, role: keyof DiagramConfig["steps"], key: string): string {
  return stepOf(ctx, role)?.options.find((o) => o.key === key)?.label ?? key;
}

const labelsOf = (ctx: Ctx, role: keyof DiagramConfig["steps"]) => valuesOf(ctx, role).map((k) => labelOf(ctx, role, k));
const inGroup = (ctx: Ctx, group: keyof DiagramConfig["options"], key: string) => ctx.cfg.options[group].includes(key);
const anyInGroup = (ctx: Ctx, group: keyof DiagramConfig["options"], keys: string[]) => keys.some((k) => inGroup(ctx, group, k));

/** Risposta mancante o "non so". */
const undefinedAnswer = (ctx: Ctx, keys: string[]) => keys.length === 0 || keys.every((k) => inGroup(ctx, "unknown", k));

/** Livelli del passaporto per categoria (griglia) o complessivi (scelta singola). */
function granularityRows(ctx: Ctx): { key: string; label: string; levels: string[] }[] {
  const step = stepOf(ctx, "granularity");
  if (!step) return [];
  const v = ctx.answers[step.key];
  const levelLabel = (k: string) => step.options.find((o) => o.key === k)?.label ?? k;
  if (step.type === "MATRIX" && v && typeof v === "object" && !Array.isArray(v)) {
    return matrixRows(ctx.def, step, ctx.answers).map((row) => ({
      key: row.key,
      label: row.label,
      levels: ((v as Record<string, string[]>)[row.key] ?? []).map(levelLabel),
    }));
  }
  return [];
}

// ─── Schema 1: flusso dei dati ───

function flowDiagram(ctx: Ctx): Diagram {
  const { t } = ctx;
  const sources = valuesOf(ctx, "sources");
  const files = sources.filter((k) => inGroup(ctx, "supplierFiles", k));
  const apis = sources.filter((k) => inGroup(ctx, "supplierApi", k));
  const internal = sources.filter((k) => inGroup(ctx, "internalSystems", k));
  const manual = sources.filter((k) => inGroup(ctx, "manualEntry", k));
  const other = sources.filter((k) => ![...files, ...apis, ...internal, ...manual].includes(k));
  const organization = valuesOf(ctx, "organization");
  const dynamic = anyInGroup(ctx, "dynamicData", valuesOf(ctx, "dynamics"));
  const skuStep = stepOf(ctx, "skuCount");
  const skus = skuStep ? Number(ctx.answers[skuStep.key]) || 0 : 0;

  // ── Colonna 1: fonti
  const sourceItems: DiagramItem[] = [
    ...files.map((k) => ({
      id: `src-${k}`,
      title: labelOf(ctx, "sources", k),
      subtitle: t("flow.fileUpload"),
      icon: (inGroup(ctx, "pdfFiles", k) ? "pdf" : "excel") as Icon,
    })),
    ...apis.map((k) => ({ id: `src-${k}`, title: labelOf(ctx, "sources", k), subtitle: t("flow.apiIntegration"), icon: "api" as Icon })),
    ...internal.map((k) => ({ id: `src-${k}`, title: labelOf(ctx, "sources", k), subtitle: t("flow.internalSystem"), icon: "system" as Icon })),
    ...other.map((k) => ({ id: `src-${k}`, title: labelOf(ctx, "sources", k), icon: "more" as Icon })),
    ...manual.map((k) => ({ id: `src-${k}`, title: labelOf(ctx, "sources", k), subtitle: t("flow.manualEntry"), icon: "manual" as Icon })),
  ];
  if (sourceItems.length === 0) {
    sourceItems.push({ id: "src-undefined", title: t("toDefine"), subtitle: t("flow.noSources"), dashed: true, tone: "warning" });
  }
  sourceItems.push({ id: "src-more", title: t("flow.moreTitle"), subtitle: t("flow.moreSubtitle"), dashed: true, tone: "muted", icon: "more" });

  // ── Colonna 2: middle layer, se i dati vanno raccolti o normalizzati
  const centralized = anyInGroup(ctx, "centralized", organization);
  const disorganized = anyInGroup(ctx, "disorganized", organization);
  const needsMiddle = files.length > 0 || apis.length > 0 || (internal.length > 0 && !centralized) || (organization.length > 0 && !centralized);
  const middleLines: string[] = [];
  if (files.length) {
    const formats = [...new Set(files.map((k) => (inGroup(ctx, "pdfFiles", k) ? "PDF" : "Excel")))].join(", ");
    middleLines.push(t("flow.mlFiles", { formats }));
  }
  if (apis.length) middleLines.push(t("flow.mlApi"));
  if (internal.length) middleLines.push(t("flow.mlInternal", { systems: internal.map((k) => labelOf(ctx, "sources", k)).join(", ") }));
  if (disorganized) middleLines.push(t("flow.mlCleanup"));
  middleLines.push(t("flow.mlNormalize"));
  const queue = dynamic || skus >= ctx.cfg.largeCatalog;

  // ── Colonna 3: piattaforma
  const hosting = valuesOf(ctx, "hosting");
  const hostingUndecided = undefinedAnswer(ctx, hosting) || anyInGroup(ctx, "hostingUndecided", hosting);
  const levels = [
    ...new Set(
      granularityRows(ctx).flatMap((r) => r.levels).length
        ? granularityRows(ctx).flatMap((r) => r.levels)
        : labelsOf(ctx, "granularity"),
    ),
  ];
  const carrierPresence = valuesOf(ctx, "carrierPresence");
  const noCarrier = carrierPresence.length > 0 && anyInGroup(ctx, "noCarrier", carrierPresence);
  const scheme = valuesOf(ctx, "urlScheme").filter((k) => !inGroup(ctx, "unknown", k));
  const dataModel = labelsOf(ctx, "dataModel");

  const bullets = [t("flow.pValidate")];
  if (dataModel.length) bullets.push(t("flow.pEnrich", { items: dataModel.join(", ") }));
  if (dynamic) bullets.push(t("flow.pHistory"));
  bullets.push(levels.length ? t("flow.pIds", { levels: levels.join(", ") }) : t("flow.pIdsGeneric"));
  if (scheme.length) bullets.push(t("flow.pUrl", { scheme: scheme.map((k) => labelOf(ctx, "urlScheme", k)).join(", ") }));
  bullets.push(
    noCarrier || carrierPresence.length === 0
      ? t("flow.pCarrierMissing")
      : t("flow.pCarrier", { carrier: carrierPresence.map((k) => labelOf(ctx, "carrierPresence", k)).join(", ") }),
  );

  const platform: DiagramItem = {
    id: "platform",
    title: t("flow.coreEngine"),
    subtitle: hostingUndecided ? t("flow.hostingUndecided") : hosting.map((k) => labelOf(ctx, "hosting", k)).join(", "),
    bullets,
    icon: "cloud",
    dashed: hostingUndecided,
  };

  // ── Colonna 4: Registro UE
  const registry = valuesOf(ctx, "registry");
  const registryPlanned = anyInGroup(ctx, "registryPlanned", registry);
  const registryItem: DiagramItem = {
    id: "registry",
    title: t("flow.registryTitle"),
    lines: [
      t("flow.registryLine"),
      registry.length ? labelOf(ctx, "registry", registry[0]) : t("toDefine"),
    ],
    icon: "registry",
    dashed: !registryPlanned,
    tone: registryPlanned ? "default" : "warning",
  };

  const columns: DiagramColumn[] = [{ id: "sources", title: t("flow.colSources"), color: "slate", items: sourceItems }];
  if (needsMiddle) {
    columns.push({
      id: "middle",
      title: t("flow.colMiddle"),
      color: "sky",
      offsetTop: manual.length > 0,
      items: [
        { id: "middle", title: t("flow.mlTitle"), bullets: [...middleLines, ...(queue ? [t("flow.mlQueue")] : [])] },
      ],
    });
  }
  columns.push({ id: "platform", title: t("flow.colPlatform"), color: "green", items: [platform] });
  columns.push({ id: "registry", title: t("flow.colRegistry"), color: "navy", items: [registryItem] });

  // ── Frecce
  const edges: DiagramEdge[] = [];
  for (const item of sourceItems) {
    if (item.id === "src-more" || item.id === "src-undefined") continue;
    const key = item.id.slice(4);
    if (inGroup(ctx, "manualEntry", key)) {
      edges.push({ from: item.id, to: "platform", style: "solid", tone: "accent", label: t("flow.manualUpload") });
    } else {
      edges.push({ from: item.id, to: needsMiddle ? "middle" : "platform", style: "dotted" });
    }
  }
  if (needsMiddle) edges.push({ from: "middle", to: "platform", style: "solid" });
  edges.push({
    from: "platform",
    to: "registry",
    style: registryPlanned ? "solid" : "dashed",
    tone: registryPlanned ? "default" : "warning",
    label: registryPlanned ? undefined : t("toPlan"),
  });

  // ── Note
  const notes: string[] = [];
  if (sources.length === 0) notes.push(t("flow.noteSources"));
  if (hostingUndecided) notes.push(t("flow.noteHosting"));
  if (!registryPlanned) notes.push(t("flow.noteRegistry"));
  if (noCarrier) notes.push(t("flow.noteCarrier"));

  return {
    id: "flow",
    title: t("flow.title"),
    subtitle: t("flow.subtitle"),
    columns,
    edges,
    notes,
  };
}

/** Schema "Flusso dei dati DPP". Il Blueprint è in blueprint.ts. */
export function generateFlowDiagram(def: WizardDef, answers: Answers, cfg: DiagramConfig, t: Translate): Diagram {
  const ctx: Ctx = { def, answers: effectiveAnswers(def, answers), cfg, t };
  return flowDiagram(ctx);
}

/** Descrizione testuale di uno schema (accessibilità, contesto per l'AI). */
export function describeDiagram(d: Diagram, t: Translate): string[] {
  const byId = new Map(d.columns.flatMap((c) => c.items.map((i) => [i.id, i.title] as const)));
  const lines: string[] = [];
  for (const c of d.columns) {
    lines.push(`${c.title}: ${c.items.map((i) => [i.title, i.subtitle].filter(Boolean).join(" — ")).join("; ")}`);
  }
  for (const e of d.edges) {
    lines.push(
      t("describe.edge", {
        from: byId.get(e.from) ?? e.from,
        to: byId.get(e.to) ?? e.to,
        kind: t(`describe.${e.style}`),
      }) + (e.label ? ` (${e.label})` : ""),
    );
  }
  return [...lines, ...d.notes];
}
