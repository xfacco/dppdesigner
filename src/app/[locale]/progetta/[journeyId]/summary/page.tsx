import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiagramPanel } from "@/components/diagrams/diagram-panel";
import { LockIcon, type DownloadMode } from "@/components/diagrams/diagram-download";
import { db } from "@/lib/db";
import { PreviewBanner } from "@/components/wizard/preview-banner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle, Progress } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { computeScore, firstIncompleteStep, matchingRecommendations, visibleSteps } from "@/lib/wizard/engine";
import { requireJourney } from "@/server/journey";
import { loadWizard, toAnswers } from "@/server/wizard";

type Props = { params: Promise<{ locale: string; journeyId: string }> };

export default async function SummaryPage({ params }: Props) {
  const { locale, journeyId } = await params;
  setRequestLocale(locale);
  const journey = await requireJourney(journeyId, locale, `/progetta/${journeyId}/summary`);

  const [def, t, tDiagrams, version, session] = await Promise.all([
    loadWizard(journey.versionId, locale),
    getTranslations("wizard.summary"),
    getTranslations("diagrams"),
    db.wizardVersion.findUniqueOrThrow({ where: { id: journey.versionId }, select: { diagramConfig: true } }),
    getSession(),
  ]);
  const answers = toAnswers(journey.answers);
  const incomplete = firstIncompleteStep(def, answers);

  if (incomplete) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p>{t("incomplete")}</p>
        <Link href={`/progetta/${journeyId}/${incomplete.key}`} className={buttonVariants({ className: "mt-6" })}>
          {t("continue")}
        </Link>
      </div>
    );
  }

  const score = computeScore(def, answers);
  const recommendations = matchingRecommendations(def, answers);
  const firstStep = visibleSteps(def, answers)[0];
  const returnTo = encodeURIComponent(`/progetta/${journeyId}/summary`);
  // Download (PDF, PNG, SVG) solo per l'utente registrato proprietario del progetto
  const canDownload = !!journey.userId && session?.user.id === journey.userId;
  const fileHref = (format: string, diagram?: string) =>
    `/api/journeys/${journeyId}/download?format=${format}${diagram ? `&diagram=${diagram}` : ""}&locale=${locale}`;
  const registerHref = `/register?next=${returnTo}`;
  const loginHref = `/login?next=${returnTo}`;
  const download: DownloadMode = canDownload
    ? { kind: "files", href: (diagram, format) => fileHref(format, diagram) }
    : { kind: "locked", registerHref, loginHref };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
      {journey.isPreview && <PreviewBanner versionId={journey.versionId} />}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("pageTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{tDiagrams("sectionIntro")}</p>
      </div>

      {/* Report PDF: download per i registrati, altrimenti invito a registrarsi */}
      {canDownload ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/40">
          <div className="max-w-xl">
            <CardTitle>{t("pdfTitle")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("pdfBody")}</p>
          </div>
          <a href={fileHref("pdf")} className={buttonVariants()}>
            {t("pdfCta")}
          </a>
        </Card>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-primary">
          <div className="flex max-w-xl gap-3">
            <LockIcon className="mt-1 h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t("lockedTitle")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t("lockedBody")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={registerHref} className={buttonVariants()}>
              {t("lockedCta")}
            </Link>
            <Link href={loginHref} className="text-sm text-primary underline">
              {t("haveAccount")}
            </Link>
          </div>
        </Card>
      )}

      {/* 1. Blueprint del DPP · 2. Flusso dei dati DPP */}
      <DiagramPanel
        def={def}
        answers={answers}
        diagramConfig={version.diagramConfig}
        locale={locale}
        stepHref={`/${locale}/progetta/${journeyId}`}
        download={download}
      />

      {/* 3. Il tuo risultato: punteggio totale e per area */}
      <Card>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("score")}</p>
          </div>
          <p className="text-5xl font-semibold tabular-nums text-primary">
            {score.total}
            <span className="text-xl text-muted-foreground">/100</span>
          </p>
        </div>
        <h3 className="mb-3 text-sm font-semibold">{t("areas")}</h3>
        <div className="grid gap-4">
          {score.areas.map((a) => (
            <div key={a.key} className="grid gap-1">
              <div className="flex justify-between text-sm">
                <span>{a.label}</span>
                <span className="tabular-nums text-muted-foreground">{a.percent}%</span>
              </div>
              <Progress value={a.percent} />
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Prossimi passi consigliati */}
      <Card>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">{t("recommendations")}</h2>
        {recommendations.length ? (
          <ol className="grid gap-4">
            {recommendations.map((r, i) => (
              <li key={i} className="grid gap-1">
                <p className="font-medium">
                  {i + 1}. {r.title}
                </p>
                <p className="text-sm text-muted-foreground">{r.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noRecommendations")}</p>
        )}
      </Card>

      {firstStep && (
        <div>
          <Link href={`/progetta/${journeyId}/${firstStep.key}`} className={buttonVariants({ variant: "outline" })}>
            {t("editAnswers")}
          </Link>
        </div>
      )}
    </div>
  );
}
