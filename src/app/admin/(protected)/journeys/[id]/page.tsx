import Link from "next/link";
import { notFound } from "next/navigation";
import { JourneyDetail } from "@/components/admin/journey-detail";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export default async function JourneyAdminDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const journey = await db.journey.findUnique({
    where: { id },
    include: { answers: true, user: { select: { id: true, name: true, email: true } }, version: true },
  });
  if (!journey) notFound();

  return (
    <div>
      <PageHeader
        title={`Progetto ${journey.id.slice(-8)}`}
        description={
          journey.user ? (
            <Link href={`/admin/leads/${journey.user.id}`} className="underline">
              {journey.user.name} · {journey.user.email}
            </Link>
          ) : (
            `Anonimo · wizard v${journey.version.number} · ${journey.locale.toUpperCase()}`
          )
        }
      />
      <Card>
        <JourneyDetail journey={journey} />
      </Card>
    </div>
  );
}
