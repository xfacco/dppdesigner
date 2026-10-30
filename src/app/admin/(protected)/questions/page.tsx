import Link from "next/link";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HelpPanel } from "@/components/admin/help";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Markdown } from "@/components/site/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { cn } from "@/lib/utils";
import { aiEnabled } from "@/server/ai";
import { pickTranslation } from "@/server/wizard";

async function answerQuestion(id: string, form: FormData) {
  "use server";
  const session = await requireStaff();
  const answer = z.string().trim().min(1).max(5000).parse(form.get("answer"));
  await db.stepQuestion.update({
    where: { id, channel: "EXPERT" },
    data: { answer, status: "ANSWERED", answeredAt: new Date(), answeredById: session.user.id },
  });
  revalidatePath("/admin/questions");
}

const FILTERS = {
  open: { label: "Da rispondere", where: { channel: "EXPERT", status: "OPEN", journey: { isPreview: false } } },
  answered: { label: "Risposte dall'esperto", where: { channel: "EXPERT", status: "ANSWERED", journey: { isPreview: false } } },
  ai: { label: "Domande all'AI", where: { channel: "AI", journey: { isPreview: false } } },
} satisfies Record<string, { label: string; where: Prisma.StepQuestionWhereInput }>;
type Filter = keyof typeof FILTERS;

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter: Filter = f && f in FILTERS ? (f as Filter) : "open";

  const [questions, counts] = await Promise.all([
    db.stepQuestion.findMany({
      where: FILTERS[filter].where,
      orderBy: { createdAt: filter === "open" ? "asc" : "desc" },
      take: 200,
      include: {
        answeredBy: { select: { name: true } },
        journey: {
          select: {
            id: true,
            versionId: true,
            user: { select: { id: true, name: true, email: true, company: true } },
          },
        },
      },
    }),
    Promise.all(Object.values(FILTERS).map((x) => db.stepQuestion.count({ where: x.where }))),
  ]);

  // Titoli degli step (in italiano) per le versioni coinvolte
  const versionIds = [...new Set(questions.map((q) => q.journey.versionId))];
  const steps = await db.step.findMany({
    where: { versionId: { in: versionIds } },
    select: { versionId: true, key: true, translations: { select: { locale: true, title: true } } },
  });
  const titleOf = (versionId: string, key: string) => {
    const s = steps.find((x) => x.versionId === versionId && x.key === key);
    return (s && pickTranslation(s.translations, "it")?.title) ?? key;
  };

  return (
    <div>
      <PageHeader
        title="Domande"
        description={
          <>
            Domande degli utenti sugli step del wizard.{" "}
            {aiEnabled() ? "Assistente AI attivo." : "Assistente AI non attivo (manca ANTHROPIC_API_KEY): gli utenti possono solo scrivere all'esperto."}
          </>
        }
      />
      <HelpPanel>
        <p>
          In ogni step di <strong>Progetta</strong> l&apos;utente può aprire &quot;Hai un dubbio su questa domanda?&quot; e scegliere tra:
        </p>
        <ul>
          <li>
            <strong>Chiedi all&apos;AI</strong>: risposta immediata generata da Claude (Anthropic), che riceve il testo dello step, le
            opzioni, i riferimenti normativi e le risposte già date nel progetto. Ogni progetto può fare al massimo 10 domande
            all&apos;AI nelle ultime 24 ore. Le domande e le risposte restano qui, nella scheda &quot;Domande all&apos;AI&quot;, utile per
            capire quali step creano dubbi e migliorare testi e riferimenti.
          </li>
          <li>
            <strong>Chiedi all&apos;esperto</strong>: la domanda arriva nella scheda &quot;Da rispondere&quot;. Al massimo 5 domande in
            attesa per progetto.
          </li>
        </ul>
        <h3>Come arriva la risposta all&apos;utente</h3>
        <p>
          La risposta compare nello step dove è stata fatta la domanda: l&apos;utente la vede tornando su quello step dallo stesso
          browser (progetto anonimo) o dal suo account (progetto registrato). <strong>Non viene inviata nessuna email.</strong> Se
          l&apos;utente è registrato, puoi contattarlo anche dalla scheda del lead.
        </p>
        <p>La risposta si scrive in Markdown (link, grassetto, elenchi) e si può correggere anche dopo averla inviata.</p>
      </HelpPanel>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(FILTERS) as Filter[]).map((key, i) => (
          <Link
            key={key}
            href={`/admin/questions?f=${key}`}
            className={cn(buttonVariants({ variant: key === filter ? "default" : "outline", size: "sm" }))}
          >
            {FILTERS[key].label} ({counts[i]})
          </Link>
        ))}
      </div>

      <div className="grid gap-4">
        {questions.length === 0 && <p className="text-sm text-muted-foreground">Nessuna domanda.</p>}
        {questions.map((q) => {
          const user = q.journey.user;
          return (
            <Card key={q.id} className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={q.channel === "AI" ? "muted" : q.status === "OPEN" ? "warning" : "primary"}>
                  {q.channel === "AI" ? "AI" : q.status === "OPEN" ? "Da rispondere" : "Risposta inviata"}
                </Badge>
                <span className="font-medium">{titleOf(q.journey.versionId, q.stepKey)}</span>
                <span className="font-mono text-xs text-muted-foreground">{q.stepKey}</span>
                <span className="text-muted-foreground">· {q.locale.toUpperCase()} · {fmtDate(q.createdAt)}</span>
                <span className="ml-auto text-muted-foreground">
                  {user ? (
                    <Link href={`/admin/leads/${user.id}`} className="underline">
                      {user.name} · {user.email}
                      {user.company ? ` · ${user.company}` : ""}
                    </Link>
                  ) : (
                    "Utente anonimo"
                  )}{" "}
                  ·{" "}
                  <Link href={`/admin/journeys/${q.journey.id}`} className="underline">
                    progetto
                  </Link>
                </span>
              </div>
              <p className="whitespace-pre-wrap rounded-md bg-accent px-3 py-2 text-sm">{q.question}</p>

              {q.channel === "AI" ? (
                <div className="rounded-md border px-3 py-2">
                  <Markdown className="step-references text-sm">{q.answer ?? ""}</Markdown>
                </div>
              ) : (
                <form action={answerQuestion.bind(null, q.id)} className="grid gap-2">
                  <Textarea
                    name="answer"
                    rows={q.answer ? 4 : 5}
                    defaultValue={q.answer ?? ""}
                    placeholder="Scrivi la risposta (Markdown)…"
                    required
                    aria-label="Risposta"
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Button type="submit" size="sm">
                      {q.answer ? "Aggiorna risposta" : "Invia risposta"}
                    </Button>
                    {q.answeredAt && (
                      <span>
                        Risposto {fmtDate(q.answeredAt)}
                        {q.answeredBy ? ` da ${q.answeredBy.name}` : ""}
                      </span>
                    )}
                  </div>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
