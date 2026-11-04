import "server-only";
import { getTranslations } from "next-intl/server";
import { generateBlueprint, type BpStatus } from "@/lib/diagrams/blueprint";
import { resolveDiagramConfig } from "@/lib/diagrams/config";
import { generateFlowDiagram, type Translate } from "@/lib/diagrams/generate";
import type { WizardDef } from "@/lib/wizard/engine";
import type { Answers } from "@/lib/wizard/rules";

export const DIAGRAMS = ["blueprint", "flow"] as const;
export type DiagramName = (typeof DIAGRAMS)[number];

/**
 * Schemi di un progetto (Blueprint e Flusso dei dati) con le etichette tradotte: gli stessi per la
 * pagina di riepilogo e per i file scaricabili (PDF, PNG, SVG).
 */
export async function buildDiagrams(def: WizardDef, answers: Answers, diagramConfig: unknown, locale: string) {
  const tr = await getTranslations({ locale, namespace: "diagrams" });
  const t: Translate = Object.assign((key: string, vars?: Record<string, string | number>) => tr(key as never, vars as never), {
    has: (key: string) => tr.has(key as never),
  });
  const cfg = resolveDiagramConfig(diagramConfig);
  const statuses: BpStatus[] = ["defined", "open", "attention", "na"];
  return {
    tr,
    t,
    flow: generateFlowDiagram(def, answers, cfg, t),
    blueprint: generateBlueprint(def, answers, cfg, t, locale),
    labels: {
      category: tr("blueprint.category"),
      legend: Object.fromEntries(statuses.map((s) => [s, tr(`blueprint.legend.${s}` as never)])) as Record<BpStatus, string>,
      statusName: Object.fromEntries(statuses.map((s) => [s, tr(`blueprint.status.${s}` as never)])) as Record<BpStatus, string>,
    },
  };
}

export type Diagrams = Awaited<ReturnType<typeof buildDiagrams>>;
