import { Card } from "@/components/ui/card";
import { describeDiagram } from "@/lib/diagrams/generate";
import type { WizardDef } from "@/lib/wizard/engine";
import type { Answers } from "@/lib/wizard/rules";
import { buildDiagrams } from "@/server/diagrams";
import { BlueprintList } from "./blueprint-list";
import { BlueprintSvg } from "./blueprint-svg";
import { DiagramDownload, type DownloadMode } from "./diagram-download";
import { DiagramSvg } from "./diagram-svg";

/**
 * Schemi del riepilogo: Flusso dei dati DPP e Blueprint del DPP, con descrizione testuale e, se
 * indicato, i download (file per gli utenti registrati, altrimenti invito a registrarsi).
 */
export async function DiagramPanel({
  def,
  answers,
  diagramConfig,
  locale,
  stepHref,
  hrefFor: hrefForProp,
  hint,
  download,
}: {
  def: WizardDef;
  answers: Answers;
  diagramConfig: unknown;
  locale: string;
  /** Prefisso del link agli step del progetto, es. /it/progetta/<id> */
  stepHref?: string;
  /** In alternativa a stepHref: link di ogni scheda (es. alla guida, nell'esempio di "Progetta") */
  hrefFor?: (stepKey: string) => string;
  /** Testo sotto il titolo del Blueprint; predefinito "Clicca su una scheda per modificare la risposta" */
  hint?: string;
  /** Download degli schemi; senza, nessun pulsante */
  download?: DownloadMode;
}) {
  const { tr, t, flow, blueprint, labels } = await buildDiagrams(def, answers, diagramConfig, locale);
  const hrefFor = hrefForProp ?? ((stepKey: string) => `${stepHref}/${stepKey}`);

  return (
    <div className="grid gap-8">
      {/* ─── Blueprint del DPP ─── */}
      <Card className="grid gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{blueprint.title}</h2>
            <p className="text-sm text-muted-foreground">{hint ?? tr("blueprint.editHint")}</p>
          </div>
          {download && <DiagramDownload diagram="blueprint" mode={download} />}
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
          {download && <DiagramDownload diagram="flow" mode={download} />}
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
