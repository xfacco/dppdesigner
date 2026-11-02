import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiagramPanel } from "@/components/diagrams/diagram-panel";
import { Markdown } from "@/components/site/markdown";
import { RAIL } from "@/components/site/page-sections";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { articleSlug, guideSegment } from "@/lib/guide";
import { getSession } from "@/lib/session";
import { matchingRecommendations } from "@/lib/wizard/engine";
import { exampleAnswers } from "@/lib/wizard/example";
import { getPageByKey } from "@/server/content";
import { getAnonymousJourney } from "@/server/journey";
import { getPublishedVersionId, loadWizard } from "@/server/wizard";
import { startJourney } from "./actions";

/** Stima del tempo di compilazione: circa 30 secondi a domanda. */
const minutesFor = (count: number) => Math.max(1, Math.round(count / 2));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [page, t] = await Promise.all([getPageByKey(locale, "wizard_intro"), getTranslations({ locale, namespace: "wizard" })]);
  return {
    title: page?.title ?? t("title"),
    description: page?.description ?? undefined,
    alternates: { languages: { it: "/it/progetta", en: "/en/progetta" } },
  };
}

export default async function WizardStart({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, session, page, versionId] = await Promise.all([
    getTranslations("wizard"),
    getSession(),
    getPageByKey(locale, "wizard_intro"),
    getPublishedVersionId(),
  ]);

  const existing = session
    ? await db.journey.findFirst({
        where: { userId: session.user.id, status: "IN_PROGRESS", isPreview: false, hiddenByUserAt: null },
        orderBy: { updatedAt: "desc" },
      })
    : await getAnonymousJourney();
  const [def, version, tEx, tSummary] = await Promise.all([
    versionId ? loadWizard(versionId, locale) : null,
    versionId ? db.wizardVersion.findUnique({ where: { id: versionId }, select: { diagramConfig: true } }) : null,
    getTranslations("wizard.example"),
    getTranslations("wizard.summary"),
  ]);
  const steps = def?.steps ?? [];
  // Esempio di risultato: stessi calcoli del riepilogo finale, con le risposte di un'azienda di esempio
  const example = exampleAnswers(locale);
  const exampleSteps = def ? matchingRecommendations(def, example) : [];
  const guideHref = (stepKey: string) => `/${locale}/${guideSegment(locale)}/${articleSlug(stepKey)}`;

  const actions = (
    <div className="flex flex-wrap gap-3">
      {existing ? (
        <>
          <Link href={`/progetta/${existing.id}`} className={buttonVariants({ size: "lg" })}>
            {t("resume")}
          </Link>
          <form action={startJourney}>
            <Button type="submit" variant="outline" size="lg">
              {t("restart")}
            </Button>
          </form>
        </>
      ) : (
        <form action={startJourney}>
          <Button type="submit" size="lg">
            {t("start")}
          </Button>
        </form>
      )}
    </div>
  );

  return (
    <div className={`${RAIL} grid gap-10 pb-24 pt-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-14 md:pt-14`}>
      {/* ─── Sinistra: presentazione (testo da Admin → Contenuti) ed esempio di risultato ─── */}
      <div className="grid min-w-0 content-start gap-10">
        <div>
          {page ? (
            <Markdown>{page.body}</Markdown>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
              <p className="mt-4 text-muted-foreground">{t("intro")}</p>
            </>
          )}
          <div className="mt-8">{actions}</div>
        </div>

        {def && (
          <section aria-labelledby="example-title" className="grid gap-6 border-t pt-10">
            <div>
              <h2 id="example-title" className="text-2xl font-medium tracking-[-0.03em]">
                {tEx("title")}
              </h2>
              <p className="mt-2 text-muted-foreground">{tEx("intro")}</p>
            </div>
            <DiagramPanel
              def={def}
              answers={example}
              diagramConfig={version?.diagramConfig}
              locale={locale}
              hrefFor={guideHref}
              hint={tEx("hint")}
              fileSuffix="esempio"
            />
            {exampleSteps.length > 0 && (
              <Card>
                <h3 className="mb-4 text-lg font-semibold tracking-tight">{tSummary("recommendations")}</h3>
                <ol className="grid gap-4">
                  {exampleSteps.map((r, i) => (
                    <li key={i} className="grid gap-1">
                      <p className="font-medium">
                        {i + 1}. {r.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{r.body}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
            <p className="text-xs text-muted-foreground">{tEx("note")}</p>
            <div>{actions}</div>
          </section>
        )}
      </div>

      {/* ─── Destra: le domande del wizard ─── */}
      {steps.length > 0 && (
        <aside aria-labelledby="steps-title" className="min-w-0 lg:border-l lg:pl-10">
          <h2 id="steps-title" className="text-xl font-semibold tracking-tight">
            {t("stepsTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("stepsIntro", { count: steps.length, minutes: minutesFor(steps.length) })}
          </p>
          <ol className="ml-3 mt-6 grid border-l">
            {steps.map((s, i) => (
              <li key={s.key} className="relative flex gap-4 py-2.5 pl-6">
                <span
                  aria-hidden
                  className="absolute -left-3 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs tabular-nums text-muted-foreground"
                >
                  {i + 1}
                </span>
                <span className="grid gap-0.5">
                  <span className="font-medium">
                    <Link href={`/${guideSegment(locale)}/${articleSlug(s.key)}`} className="underline-offset-4 hover:underline">
                      {s.title}
                    </Link>
                    {s.visibleIf && <Badge className="ml-2 align-middle">{t("conditional")}</Badge>}
                  </span>
                  {s.description && <span className="text-sm text-muted-foreground">{s.description}</span>}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}
