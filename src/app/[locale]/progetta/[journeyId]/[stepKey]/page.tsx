import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Badge, Progress } from "@/components/ui/card";
import { db } from "@/lib/db";
import { PreviewBanner } from "@/components/wizard/preview-banner";
import { StepAssistant } from "@/components/wizard/step-assistant";
import { StepArticles } from "@/components/wizard/step-articles";
import { StepReferences } from "@/components/wizard/step-references";
import { StickyStepHeader } from "@/components/wizard/sticky-step-header";
import { listStepQuestions } from "@/server/questions";
import { Markdown } from "@/components/site/markdown";
import {
  adjacentSteps,
  matchingSuggestions,
  matrixAdvice,
  matrixRows,
  visibleOptions,
  visibleSteps,
} from "@/lib/wizard/engine";
import { postsForStep } from "@/server/blog";
import { requireJourney } from "@/server/journey";
import { loadWizard, toAnswers } from "@/server/wizard";
import { StepForm, type MatrixRow } from "./step-form";

type Props = { params: Promise<{ locale: string; journeyId: string; stepKey: string }> };

export default async function StepPage({ params }: Props) {
  const { locale, journeyId, stepKey } = await params;
  setRequestLocale(locale);
  const journey = await requireJourney(journeyId, locale, `/progetta/${journeyId}/${stepKey}`);

  const [def, t, version] = await Promise.all([
    loadWizard(journey.versionId, locale),
    getTranslations("wizard"),
    db.wizardVersion.findUniqueOrThrow({ where: { id: journey.versionId }, select: { number: true } }),
  ]);
  const answers = toAnswers(journey.answers);
  const step = visibleSteps(def, answers).find((s) => s.key === stepKey);
  if (!step) notFound();

  const { index, total, prev, next } = adjacentSteps(def, answers, stepKey);
  const articles = await postsForStep(locale, stepKey);
  // Colonna destra: riferimenti normativi e/o articoli di approfondimento
  const hasAside = Boolean(step.references) || articles.length > 0;
  const stored = journey.answers.find((a) => a.stepKey === stepKey);
  // Le opzioni arrivano al client già filtrate: lo schema del form non deve rivalutare condizioni
  const clientStep = {
    ...step,
    visibleIf: null,
    suggestions: undefined,
    options: visibleOptions(step, answers).map((o) => ({ ...o, visibleIf: null })),
  };
  const isMatrix = step.type === "MATRIX";
  const advice = isMatrix ? matrixAdvice(def, step, answers) : null;
  // Per la griglia il riquadro in alto mostra solo i consigli validi per tutte le righe
  const suggestions = advice ? advice.general : matchingSuggestions(def, step, answers);
  const suggestedKeys = [...new Set(suggestions.flatMap((s) => (s.optionKey ? [s.optionKey] : [])))];
  const rows: MatrixRow[] = advice
    ? matrixRows(def, step, answers).map((r) => ({
        ...r,
        notes: advice.rows[r.key].map((s) => s.message),
        suggested: [...new Set(advice.rows[r.key].flatMap((s) => (s.optionKey ? [s.optionKey] : [])))],
        mandatory: advice.mandatory[r.key],
      }))
    : [];

  // Valore iniziale: risposta salvata, altrimenti l'opzione consigliata più prioritaria;
  // nelle griglie le opzioni obbligatorie sono sempre incluse.
  let initialValue: unknown = stored?.value ?? (step.type === "SINGLE_CHOICE" && suggestedKeys[0] ? suggestedKeys[0] : undefined);
  if (isMatrix) {
    const saved = (stored?.value ?? {}) as Record<string, string[]>;
    initialValue = Object.fromEntries(
      rows.map((r) => [r.key, [...new Set([...(saved[r.key] ?? (r.suggested[0] ? [r.suggested[0]] : [])), ...r.mandatory])]]),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {journey.isPreview && <PreviewBanner versionId={journey.versionId} />}
      {/* Barra degli step e titolo: restano fissi in alto per tutta la pagina.
          Devono essere figli diretti del contenitore della pagina: un elemento sticky
          resta fermo solo finché il suo contenitore è visibile. */}
      <StickyStepHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>{t("stepOf", { current: index + 1, total })}</span>
                <Badge>{t("version", { number: version.number })}</Badge>
              </p>
              <Progress value={((index + 1) / total) * 100} />
            </div>
            <h1
              id="step-title"
              className="max-w-3xl text-2xl font-semibold tracking-tight transition-[font-size] duration-200 group-data-[stuck]/sticky:text-lg"
            >
              {step.title}
            </h1>
          </div>
      </StickyStepHeader>
      <div className="mb-8 mt-2 grid max-w-3xl gap-2">
        {step.description && <p className="text-muted-foreground">{step.description}</p>}
        {stored?.needsReview && (
          <p className="rounded-md bg-warning/20 px-3 py-2 text-sm" role="status">
            {t("needsReview")}
          </p>
        )}
      </div>

      {/* Sinistra: campi da compilare · Destra: articoli di approfondimento e riferimenti normativi.
          Su schermi stretti la colonna destra viene prima dei campi. */}
      <div
        className={
          hasAside
            ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-start lg:gap-8"
            : "grid max-w-3xl"
        }
      >
        <section
          aria-labelledby="answer-heading"
          className="order-2 rounded-xl border-2 border-primary/40 bg-card p-5 shadow-md shadow-primary/5 sm:p-8 lg:order-1"
        >
          <h2 id="answer-heading" className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
            <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
            {t("yourAnswer")}
          </h2>
          {suggestions.length > 0 && (
            <div role="note" className="mb-6 rounded-md border border-primary/30 bg-accent/60 px-4 py-3 text-sm">
              <p className="mb-1 font-semibold text-accent-foreground">{t("suggestionTitle")}</p>
              <ul className="grid gap-1.5">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <Markdown className="step-references">{s.message}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <StepForm
            key={step.key}
            journeyId={journeyId}
            step={clientStep}
            suggested={suggestedKeys}
            matrixRows={rows}
            initialValue={initialValue}
            prevHref={prev ? `/progetta/${journeyId}/${prev.key}` : "/progetta"}
            isLast={!next}
          />
        </section>
        {hasAside && (
          <aside className="order-1 grid min-w-0 gap-4 lg:sticky lg:top-[calc(var(--step-header-h,0px)+1.5rem)] lg:order-2">
            <StepArticles locale={locale} posts={articles} />
            {step.references && <StepReferences markdown={step.references} />}
          </aside>
        )}
      </div>

      {/* Sotto: richiesta di aiuto (AI o esperto) */}
      <div className="mt-12 border-t pt-8">
        <StepAssistant
          key={`ask-${step.key}`}
          journeyId={journeyId}
          stepKey={step.key}
          initial={await listStepQuestions(journeyId, step.key)}
        />
      </div>
    </div>
  );
}
