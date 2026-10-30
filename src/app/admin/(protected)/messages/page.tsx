import { revalidatePath } from "next/cache";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";

async function toggleHandled(id: string, handled: boolean) {
  "use server";
  await requireStaff();
  await db.contactMessage.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/messages");
}

export default async function MessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 200 });

  return (
    <div>
      <PageHeader title="Messaggi" description="Richieste dal modulo contatti." />
      <div className="grid gap-3">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">Nessun messaggio.</p>}
        {messages.map((m) => (
          <Card key={m.id} className={m.handled ? "opacity-60" : undefined}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">
                  {m.name} {m.company && <span className="text-muted-foreground">· {m.company}</span>}
                </p>
                <p className="text-muted-foreground">
                  {m.email} · {m.locale.toUpperCase()} · {fmtDate(m.createdAt)}
                </p>
              </div>
              <form action={toggleHandled.bind(null, m.id, !m.handled)}>
                <Button type="submit" size="sm" variant="outline">
                  {m.handled ? "Segna da gestire" : "Segna gestito"}
                </Button>
              </form>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
