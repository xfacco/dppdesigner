import Link from "next/link";
import { PageHeader, Stat } from "@/components/admin/page-header";
import { db } from "@/lib/db";

export default async function AdminHome() {
  const [leads, journeys, completed, anonymous, avg, unread, published, openQuestions] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.journey.count({ where: { isPreview: false } }),
    db.journey.count({ where: { status: "COMPLETED", isPreview: false } }),
    db.journey.count({ where: { userId: null, isPreview: false } }),
    db.journey.aggregate({ _avg: { score: true }, where: { status: "COMPLETED", isPreview: false } }),
    db.contactMessage.count({ where: { handled: false } }),
    db.wizardVersion.findFirst({ where: { status: "PUBLISHED" } }),
    db.stepQuestion.count({ where: { channel: "EXPERT", status: "OPEN", journey: { isPreview: false } } }),
  ]);
  const rate = journeys ? Math.round((completed / journeys) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Panoramica"
        description={
          published ? (
            <>Wizard pubblicato: versione {published.number}</>
          ) : (
            <span className="text-destructive">
              Nessuna versione del wizard pubblicata. <Link href="/admin/wizard" className="underline">Pubblicane una</Link>.
            </span>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Lead registrati" value={leads} />
        <Stat label="Progetti totali" value={journeys} />
        <Stat label="Progetti anonimi" value={anonymous} />
        <Stat label="Tasso di completamento" value={`${rate}%`} />
        <Stat label="Punteggio medio" value={avg._avg.score !== null ? Math.round(avg._avg.score) : "—"} />
        <Stat label="Messaggi da gestire" value={unread} />
        <Link href="/admin/questions">
          <Stat label="Domande all'esperto da rispondere" value={openQuestions} />
        </Link>
      </div>
    </div>
  );
}
