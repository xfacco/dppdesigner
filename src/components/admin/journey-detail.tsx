import { Badge } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { formatAnswers } from "@/server/answers-format";
import { loadWizard, toAnswers } from "@/server/wizard";
import { fmtDate } from "./page-header";

type JourneyWithAnswers = {
  id: string;
  versionId: string;
  status: string;
  score: number | null;
  areaScores: unknown;
  createdAt: Date;
  completedAt: Date | null;
  hiddenByUserAt?: Date | null;
  answers: { stepKey: string; value: unknown; needsReview: boolean }[];
};

export async function JourneyDetail({ journey }: { journey: JourneyWithAnswers }) {
  const def = await loadWizard(journey.versionId, "it");
  const rows = formatAnswers(
    def,
    toAnswers(journey.answers),
    new Set(journey.answers.filter((a) => a.needsReview).map((a) => a.stepKey)),
  );
  const areas = (journey.areaScores ?? []) as { key: string; label: string; percent: number }[];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge tone={journey.status === "COMPLETED" ? "primary" : "muted"}>
          {journey.status === "COMPLETED" ? "Completato" : "In corso"}
        </Badge>
        {journey.score !== null && <span className="font-medium tabular-nums">Punteggio {journey.score}/100</span>}
        <span className="text-muted-foreground">Iniziato {fmtDate(journey.createdAt)}</span>
        {journey.hiddenByUserAt && (
          <Badge tone="warning">Eliminato dall&apos;utente il {fmtDate(journey.hiddenByUserAt)}: non visibile nel suo account</Badge>
        )}
        {journey.completedAt && <span className="text-muted-foreground">Completato {fmtDate(journey.completedAt)}</span>}
      </div>
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map((a) => (
            <Badge key={a.key}>
              {a.label}: {a.percent}%
            </Badge>
          ))}
        </div>
      )}
      <Table>
        <thead>
          <tr>
            <Th>Step</Th>
            <Th>Risposta</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.hidden ? "opacity-50" : undefined}>
              <Td className="w-1/3">
                <span className="font-medium">{r.title}</span>
                <span className="block text-xs text-muted-foreground">{r.key}</span>
              </Td>
              <Td>
                {r.text}
                {r.needsReview && (
                  <Badge tone="warning" className="ml-2">
                    da rivedere
                  </Badge>
                )}
                {r.hidden && <span className="ml-2 text-xs">(step non più visibile)</span>}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
