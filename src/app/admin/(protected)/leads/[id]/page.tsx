import { notFound } from "next/navigation";
import { JourneyDetail } from "@/components/admin/journey-detail";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.user.findUnique({
    where: { id },
    include: {
      consents: { orderBy: { createdAt: "desc" } },
      journeys: { orderBy: { updatedAt: "desc" }, include: { answers: true } },
    },
  });
  if (!lead) notFound();

  const fields: [string, string | null][] = [
    ["Email", lead.email],
    ["Azienda", lead.company],
    ["Ruolo", lead.jobTitle],
    ["Telefono", lead.phone],
    ["Lingua", lead.locale],
    ["Email verificata", lead.emailVerified ? "Sì" : "No"],
    ["Registrato", fmtDate(lead.createdAt)],
    ["Ultimo accesso", fmtDate(lead.lastSeenAt)],
  ];

  return (
    <div className="grid gap-6">
      <PageHeader title={lead.name} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Profilo</CardTitle>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {fields.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <CardTitle className="mb-4">Consensi</CardTitle>
          <ul className="grid gap-2 text-sm">
            {lead.consents.map((c) => (
              <li key={c.id}>
                {c.type === "PRIVACY" ? "Privacy" : "Marketing"}: {c.granted ? "concesso" : "negato"}{" "}
                <span className="text-muted-foreground">
                  (informativa {c.policyVersion}, {fmtDate(c.createdAt)})
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {lead.journeys.map((j, i) => (
        <Card key={j.id}>
          <CardTitle className="mb-4">
            Progetto {lead.journeys.length - i}
            {j.hiddenByUserAt && <span className="ml-2 text-sm font-normal text-muted-foreground">(eliminato dall&apos;utente)</span>}
          </CardTitle>
          <JourneyDetail journey={j} />
        </Card>
      ))}
    </div>
  );
}
