import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Markdown } from "@/components/site/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
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
  const steps = versionId ? (await loadWizard(versionId, locale)).steps : [];

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
    <div className="mx-auto max-w-2xl px-4 py-16">
      {page ? (
        <Markdown>{page.body}</Markdown>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-4 text-muted-foreground">{t("intro")}</p>
        </>
      )}

      <div className="mt-10">{actions}</div>

      {steps.length > 0 && (
        <section className="mt-14" aria-labelledby="steps-title">
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
                    {s.title}
                    {s.visibleIf && (
                      <Badge className="ml-2 align-middle">{t("conditional")}</Badge>
                    )}
                  </span>
                  {s.description && <span className="text-sm text-muted-foreground">{s.description}</span>}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10">{actions}</div>
        </section>
      )}
    </div>
  );
}
