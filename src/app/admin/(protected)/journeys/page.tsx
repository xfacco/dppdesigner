import Link from "next/link";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Table, Td, Th } from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { loadWizard } from "@/server/wizard";

const PAGE_SIZE = 50;

type Search = { who?: string; status?: string; page?: string };

async function funnel(versionId: string) {
  const [def, total, counts] = await Promise.all([
    loadWizard(versionId, "it"),
    db.journey.count({ where: { versionId, isPreview: false } }),
    db.answer.groupBy({ by: ["stepKey"], where: { journey: { versionId, isPreview: false } }, _count: { _all: true } }),
  ]);
  const byKey = new Map(counts.map((c) => [c.stepKey, c._count._all]));
  return { total, steps: def.steps.map((s) => ({ key: s.key, title: s.title, count: byKey.get(s.key) ?? 0 })) };
}

export default async function JourneysPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.JourneyWhereInput = { isPreview: false };
  if (sp.who === "anonymous") where.userId = null;
  if (sp.who === "registered") where.userId = { not: null };
  if (sp.who === "hidden") where.hiddenByUserAt = { not: null };
  if (sp.status === "COMPLETED" || sp.status === "IN_PROGRESS") where.status = sp.status;

  const [journeys, count, published] = await Promise.all([
    db.journey.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } }, version: { select: { number: true } }, _count: { select: { answers: true } } },
    }),
    db.journey.count({ where }),
    db.wizardVersion.findFirst({ where: { status: "PUBLISHED" } }),
  ]);
  const stats = published ? await funnel(published.id) : null;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pageHref = (p: number) => `/admin/journeys?${new URLSearchParams({ ...sp, page: String(p) } as Record<string, string>)}`;

  return (
    <div className="grid gap-6">
      <PageHeader title="Progetti" description={`${count} progetti, anonimi e registrati`} />

      {stats && stats.total > 0 && (
        <Card>
          <CardTitle className="mb-1">Completamento per step</CardTitle>
          <p className="mb-4 text-sm text-muted-foreground">
            Versione {published!.number} · {stats.total} progetti. Gli step condizionali sono mostrati solo a una parte degli utenti.
          </p>
          <div className="grid gap-2">
            {stats.steps.map((s) => {
              const pct = Math.round((s.count / stats.total) * 100);
              return (
                <div key={s.key} className="grid grid-cols-[minmax(0,14rem)_1fr_4rem] items-center gap-3 text-sm">
                  <span className="truncate" title={s.title}>
                    {s.title}
                  </span>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right tabular-nums text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <form className="flex flex-wrap gap-3">
        <Select name="who" defaultValue={sp.who ?? ""} className="max-w-48">
          <option value="">Tutti</option>
          <option value="anonymous">Anonimi</option>
          <option value="registered">Registrati</option>
          <option value="hidden">Eliminati dall&apos;utente</option>
        </Select>
        <Select name="status" defaultValue={sp.status ?? ""} className="max-w-48">
          <option value="">Tutti gli stati</option>
          <option value="COMPLETED">Completati</option>
          <option value="IN_PROGRESS">In corso</option>
        </Select>
        <button type="submit" className={buttonVariants()}>
          Filtra
        </button>
      </form>

      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Progetto</Th>
              <Th>Utente</Th>
              <Th>Stato</Th>
              <Th>Risposte</Th>
              <Th>Punteggio</Th>
              <Th>Lingua</Th>
              <Th>Aggiornato</Th>
            </tr>
          </thead>
          <tbody>
            {journeys.map((j) => (
              <tr key={j.id} className="hover:bg-muted/50">
                <Td>
                  <Link href={`/admin/journeys/${j.id}`} className="font-mono text-xs hover:underline">
                    {j.id.slice(-8)}
                  </Link>
                  <span className="block text-xs text-muted-foreground">v{j.version.number}</span>
                </Td>
                <Td>{j.user ? j.user.email : <span className="text-muted-foreground">Anonimo</span>}</Td>
                <Td>
                  <Badge tone={j.status === "COMPLETED" ? "primary" : "muted"}>
                    {j.status === "COMPLETED" ? "Completato" : "In corso"}
                  </Badge>
                  {j.hiddenByUserAt && (
                    <Badge tone="warning" className="ml-1" title={`Eliminato dall'utente il ${fmtDate(j.hiddenByUserAt)}`}>
                      eliminato dall&apos;utente
                    </Badge>
                  )}
                </Td>
                <Td className="tabular-nums">{j._count.answers}</Td>
                <Td className="tabular-nums">{j.score ?? "—"}</Td>
                <Td className="uppercase">{j.locale}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(j.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={pageHref(p)} className={cn(buttonVariants({ variant: p === page ? "default" : "outline", size: "sm" }))}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
