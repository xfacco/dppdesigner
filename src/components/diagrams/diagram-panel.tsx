import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { generateBlueprint, type BpStatus } from "@/lib/diagrams/blueprint";
import { resolveDiagramConfig } from "@/lib/diagrams/config";
import { describeDiagram, generateFlowDiagram, type Translate } from "@/lib/diagrams/generate";
import type { WizardDef } from "@/lib/wizard/engine";
import type { Answers } from "@/lib/wizard/rules";
import { BlueprintList } from "./blueprint-list";
import { BlueprintSvg } from "./blueprint-svg";
import { DiagramDownload } from "./diagram-download";
import { DiagramSvg } from "./diagram-svg";

/** Schemi del riepilogo: Flusso dei dati DPP e Blueprint del DPP, con download e descrizione testuale. */
export async function DiagramPanel({
  def,
  answers,
  diagramConfig,
  locale,
  stepHref,
  fileSuffix,
}: {
  def: WizardDef;
  answers: Answers;
  diagramConfig: unknown;
  locale: string;
  /** Prefisso del link agli step del progetto, es. /it/progetta/<id> */
  stepHref: string;
  fileSuffix: string;
}) {
  const tr = await getTranslations("diagrams");
  const t: Translate = Object.assign((key: string, vars?: Record<string, string | number>) => tr(key as never, vars as never), {
    has: (key: string) => tr.has(key as never),
  });
  const cfg = resolveDiagramConfig(diagramConfig);
  const flow = generateFlowDiagram(def, answers, cfg, t);
  const blueprint = generateBlueprint(def, answers, cfg, t, locale);
  const hrefFor = (stepKey: string) => `${stepHref}/${stepKey}`;
  const statuses: BpStatus[] = ["defined", "open", "attention", "na"];
  const labels = {
    category: tr("blueprint.category"),
    legend: Object.fromEntries(statuses.map((s) => [s, tr(`blueprint.legend.${s}` as never)])) as Record<BpStatus, string>,
    statusName: Object.fromEntries(statuses.map((s) => [s, tr(`blueprint.status.${s}` as never)])) as Record<BpStatus, string>,
  };

  return (
    <div className="grid gap-8">
      {/* ─── Blueprint del DPP ─── */}
      <Card className="grid gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{blueprint.title}</h2>
            <p className="text-sm text-muted-foreground">{tr("blueprint.editHint")}</p>
          </div>
          <DiagramDownload svgId="diagram-blueprint" fileName={`blueprint-${fileSuffix}`} />
        </div>
        {/* Desktop: disegno con schede cliccabili; telefono: aree impilate */}
        <div className="hidden lg:block">
          <BlueprintSvg blueprint={blueprint} svgId="diagram-blueprint" hrefFor={hrefFor} labels={labels} />
        </div>
        <div className="lg:hidden">
          <BlueprintList blueprint={blueprint} hrefFor={hrefFor} labels={labels} />
        </div>
        <details className="hidden text-sm lg:block">
          <summary className="cursor-pointer text-muted-foreground">{tr("describeTitle")}</summary>
          <div className="mt-3">
            <BlueprintList blueprint={blueprint} hrefFor={hrefFor} labels={labels} />
          </div>
        </details>
      </Card>

      {/* ─── Flusso dei dati ─── */}
      <Card className="grid gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{flow.title}</h2>
          <DiagramDownload svgId="diagram-flow" fileName={`flow-${fileSuffix}`} />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[720px]">
            <DiagramSvg diagram={flow} svgId="diagram-flow" />
          </div>
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{tr("describeTitle")}</summary>
          <ul className="mt-2 grid list-disc gap-1 pl-5">
            {describeDiagram(flow, t).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      </Card>
    </div>
  );
}
