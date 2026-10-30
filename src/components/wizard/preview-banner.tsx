import { db } from "@/lib/db";

/** Banner per i progetti di prova avviati dall'admin (testo solo in italiano: lo vede solo lo staff). */
export async function PreviewBanner({ versionId }: { versionId: string }) {
  const v = await db.wizardVersion.findUniqueOrThrow({ where: { id: versionId }, select: { number: true, status: true } });
  const status = v.status === "DRAFT" ? "bozza" : v.status === "PUBLISHED" ? "pubblicata" : "archiviata";
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-warning bg-warning/15 px-4 py-2 text-sm">
      <span>
        <strong>Anteprima</strong> della versione {v.number} ({status}): progetto di prova, escluso da statistiche e lead. Le
        modifiche salvate nella bozza si vedono ricaricando la pagina.
      </span>
      <a href={`/admin/wizard/${versionId}`} className="ml-auto underline">
        ← Torna all&apos;editor
      </a>
    </div>
  );
}
