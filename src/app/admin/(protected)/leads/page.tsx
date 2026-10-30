import Link from "next/link";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Table, Td, Th } from "@/components/ui/table";
import { findLeads, leadSummary, type LeadFilters } from "@/server/leads";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<LeadFilters> }) {
  const filters = await searchParams;
  const leads = await findLeads(filters);
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div>
      <PageHeader
        title="Lead"
        description={`${leads.length} lead trovati`}
        actions={
          <a href={`/api/admin/leads/export${qs ? `?${qs}` : ""}`} className={buttonVariants({ variant: "outline" })}>
            Esporta CSV
          </a>
        }
      />

      <form className="mb-6 flex flex-wrap gap-3 rounded-lg border bg-card p-4">
        <Input name="q" placeholder="Cerca email, nome, azienda" defaultValue={filters.q} className="max-w-64" />
        <Select name="status" defaultValue={filters.status ?? ""} className="max-w-48">
          <option value="">Tutti gli stati</option>
          <option value="COMPLETED">Progetto completato</option>
          <option value="IN_PROGRESS">Progetto in corso</option>
        </Select>
        <Input name="minScore" type="number" min={0} max={100} placeholder="Punteggio min." defaultValue={filters.minScore} className="max-w-36" />
        <Select name="marketing" defaultValue={filters.marketing ?? ""} className="max-w-56">
          <option value="">Tutti i consensi</option>
          <option value="yes">Consenso marketing</option>
        </Select>
        <Button type="submit">Filtra</Button>
        {qs && (
          <Link href="/admin/leads" className={buttonVariants({ variant: "ghost" })}>
            Azzera
          </Link>
        )}
      </form>

      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Contatto</Th>
              <Th>Azienda</Th>
              <Th>Industry</Th>
              <Th>Progetti</Th>
              <Th>Punteggio</Th>
              <Th>Marketing</Th>
              <Th>Registrato</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const s = leadSummary(lead);
              return (
                <tr key={lead.id} className="hover:bg-muted/50">
                  <Td>
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{lead.email}</span>
                  </Td>
                  <Td>{lead.company ?? "—"}</Td>
                  <Td>{s.industry || "—"}</Td>
                  <Td>
                    {lead.journeys.length}
                    {lead.journeys.some((j) => j.hiddenByUserAt) && (
                      <span className="block text-xs text-muted-foreground">
                        {lead.journeys.filter((j) => j.hiddenByUserAt).length} eliminati dall&apos;utente
                      </span>
                    )}
                  </Td>
                  <Td className="tabular-nums">{s.bestScore ?? "—"}</Td>
                  <Td>{s.marketing ? <Badge tone="primary">Sì</Badge> : <Badge>No</Badge>}</Td>
                  <Td className="whitespace-nowrap text-muted-foreground">{fmtDate(lead.createdAt)}</Td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <Td colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nessun lead.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
