import Link from "next/link";
import { fmtDate, PageHeader, Stat } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";

const FORMATS = ["PDF", "PNG", "SVG"] as const;
const DIAGRAM_LABEL: Record<string, string> = { blueprint: "Blueprint", flow: "Flusso dei dati" };

/** Registro dei download dal riepilogo dei progetti (report PDF e schemi PNG/SVG), riservati ai registrati. */
export default async function DownloadsPage({ searchParams }: { searchParams: Promise<{ format?: string }> }) {
  const { format: f } = await searchParams;
  const format = FORMATS.find((x) => x === f);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, last30, byFormat, users, rows] = await Promise.all([
    db.download.count(),
    db.download.count({ where: { createdAt: { gte: since } } }),
    db.download.groupBy({ by: ["format"], _count: { _all: true } }),
    db.download.findMany({ where: { userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    db.download.findMany({
      where: format ? { format } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, name: true, email: true, company: true } }, journey: { select: { id: true, score: true } } },
    }),
  ]);
  const count = (x: string) => byFormat.find((b) => b.format === x)?._count._all ?? 0;

  return (
    <div>
      <PageHeader title="Download" description="Report PDF e schemi PNG/SVG scaricati dal riepilogo dei progetti. Solo utenti registrati." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Totale" value={total} />
        <Stat label="Ultimi 30 giorni" value={last30} />
        <Stat label="Utenti" value={users.length} />
        {FORMATS.map((x) => (
          <Stat key={x} label={x} value={count(x)} />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/downloads" className={buttonVariants({ size: "sm", variant: format ? "outline" : "default" })}>
          Tutti
        </Link>
        {FORMATS.map((x) => (
          <Link key={x} href={`/admin/downloads?format=${x}`} className={buttonVariants({ size: "sm", variant: format === x ? "default" : "outline" })}>
            {x}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Utente</Th>
              <Th>Azienda</Th>
              <Th>File</Th>
              <Th>Progetto</Th>
              <Th>Lingua</Th>
              <Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/50">
                <Td>
                  {r.user ? (
                    <>
                      <Link href={`/admin/leads/${r.user.id}`} className="font-medium hover:underline">
                        {r.user.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{r.user.email}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Utente eliminato</span>
                  )}
                </Td>
                <Td>{r.user?.company ?? "—"}</Td>
                <Td>
                  <Badge tone={r.format === "PDF" ? "primary" : "muted"}>{r.format}</Badge>
                  {r.diagram && <span className="ml-2 text-xs text-muted-foreground">{DIAGRAM_LABEL[r.diagram] ?? r.diagram}</span>}
                </Td>
                <Td>
                  {r.journey ? (
                    <Link href={`/admin/journeys/${r.journey.id}`} className="hover:underline">
                      #{r.journey.id.slice(-6)}
                      {r.journey.score != null && <span className="ml-1 text-xs text-muted-foreground">({r.journey.score}/100)</span>}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="uppercase">{r.locale}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(r.createdAt)}</Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <Td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nessun download.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      {rows.length === 200 && <p className="mt-3 text-xs text-muted-foreground">Mostrati gli ultimi 200.</p>}
    </div>
  );
}
