import Link from "next/link";
import { ErrorFlash } from "@/components/admin/flash";
import { HelpPanel } from "@/components/admin/help";
import { VersionsHelp } from "@/components/admin/wizard-help";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";
import { createDraft, deleteDraft } from "./actions";

const STATUS = {
  DRAFT: { label: "Bozza", tone: "warning" },
  PUBLISHED: { label: "Pubblicata", tone: "primary" },
  ARCHIVED: { label: "Archiviata", tone: "muted" },
} as const;

export default async function WizardVersions({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const versions = await db.wizardVersion.findMany({
    orderBy: { number: "desc" },
    include: { _count: { select: { steps: true, journeys: { where: { isPreview: false } } } } },
  });
  const hasDraft = versions.some((v) => v.status === "DRAFT");

  return (
    <div>
      <PageHeader
        title="Wizard"
        description="Ogni modifica avviene su una bozza. Alla pubblicazione la bozza diventa la versione attiva per i nuovi progetti; i progetti già iniziati restano sulla loro versione."
        actions={
          !hasDraft && (
            <form action={createDraft}>
              <Button type="submit">Crea bozza dalla versione pubblicata</Button>
            </form>
          )
        }
      />
      <ErrorFlash error={error} />
      <HelpPanel>
        <VersionsHelp />
      </HelpPanel>
      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Versione</Th>
              <Th>Stato</Th>
              <Th>Step</Th>
              <Th>Progetti</Th>
              <Th>Pubblicata</Th>
              <Th>Note</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id}>
                <Td>
                  <Link href={`/admin/wizard/${v.id}`} className="font-medium hover:underline">
                    v{v.number}
                  </Link>
                </Td>
                <Td>
                  <Badge tone={STATUS[v.status].tone}>{STATUS[v.status].label}</Badge>
                </Td>
                <Td className="tabular-nums">{v._count.steps}</Td>
                <Td className="tabular-nums">{v._count.journeys}</Td>
                <Td className="text-muted-foreground">{fmtDate(v.publishedAt)}</Td>
                <Td className="text-muted-foreground">{v.notes ?? ""}</Td>
                <Td className="text-right">
                  {v.status === "DRAFT" && v._count.journeys === 0 && (
                    <form action={deleteDraft.bind(null, v.id)}>
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Elimina bozza
                      </Button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
