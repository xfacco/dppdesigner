import { getTranslations } from "next-intl/server";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { describeDiagram } from "@/lib/diagrams/generate";
import { articleSlug, guidePath, markdownLinks } from "@/lib/guide";
import { getSession } from "@/lib/session";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { computeScore, firstIncompleteStep, matchingRecommendations } from "@/lib/wizard/engine";
import { formatAnswers } from "@/server/answers-format";
import { getPageByKey } from "@/server/content";
import { buildDiagrams, DIAGRAMS, type DiagramName } from "@/server/diagrams";
import { diagramSvg, logoPng, svgToPng } from "@/server/download-files";
import { renderReport } from "@/server/pdf/report";
import { loadWizard, toAnswers } from "@/server/wizard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORMATS = ["pdf", "png", "svg"] as const;
type Format = (typeof FORMATS)[number];

/**
 * Download del riepilogo di un progetto: report PDF oppure uno schema in PNG/SVG.
 * Riservato agli utenti registrati e solo per i propri progetti: chi non ha fatto l'accesso viene
 * mandato al login e poi riportato al riepilogo. Ogni download viene registrato (Admin → Download).
 *
 *   GET /api/journeys/<id>/download?format=pdf|png|svg&diagram=blueprint|flow&locale=it|en
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = await params;
  const q = req.nextUrl.searchParams;
  const format = q.get("format") as Format;
  const diagram = q.get("diagram") as DiagramName;
  if (!FORMATS.includes(format) || (format !== "pdf" && !DIAGRAMS.includes(diagram))) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const journey = await db.journey.findUnique({ where: { id: journeyId }, include: { answers: true } });
  const locale = routing.locales.find((l) => l === q.get("locale")) ?? journey?.locale ?? routing.defaultLocale;
  const summaryPath = `/${locale}/progetta/${journeyId}/summary`;

  const session = await getSession();
  if (!session) {
    // Percorso relativo: dietro Cloud Run l'host della richiesta non è quello pubblico
    const next = encodeURIComponent(`/progetta/${journeyId}/summary`);
    return new NextResponse(null, { status: 303, headers: { Location: `/${locale}/login?next=${next}` } });
  }
  if (!journey || journey.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [def, version] = await Promise.all([
    loadWizard(journey.versionId, locale),
    db.wizardVersion.findUniqueOrThrow({ where: { id: journey.versionId }, select: { diagramConfig: true } }),
  ]);
  const answers = toAnswers(journey.answers);
  if (firstIncompleteStep(def, answers)) {
    return new NextResponse(null, { status: 303, headers: { Location: summaryPath } });
  }

  const diagrams = await buildDiagrams(def, answers, version.diagramConfig, locale);
  const suffix = journeyId.slice(-6);
  let body: Buffer | string;
  let type: string;
  let fileName: string;

  if (format === "pdf") {
    body = await buildReport();
    type = "application/pdf";
    fileName = `dpp-designer-report-${suffix}.pdf`;
  } else {
    const file = await diagramSvg(diagrams, diagram);
    body = format === "svg" ? file.svg : svgToPng(file.svg);
    type = format === "svg" ? "image/svg+xml; charset=utf-8" : "image/png";
    fileName = `${diagram}-${suffix}.${format}`;
  }

  await db.download.create({
    data: {
      userId: session.user.id,
      journeyId,
      format: format.toUpperCase() as "PDF" | "PNG" | "SVG",
      diagram: format === "pdf" ? null : diagram,
      locale,
    },
  });

  return new NextResponse(new Uint8Array(typeof body === "string" ? Buffer.from(body) : body), {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });

  async function buildReport() {
    const [t, tSummary, user, contacts] = await Promise.all([
      getTranslations({ locale, namespace: "report" }),
      getTranslations({ locale, namespace: "wizard.summary" }),
      db.user.findUnique({ where: { id: session!.user.id }, select: { name: true, company: true } }),
      getPageByKey(locale, "contacts"),
    ]);
    const score = computeScore(def, answers);
    const steps = new Map(def.steps.map((st) => [st.key, st]));
    const images = await Promise.all(
      DIAGRAMS.map(async (name) => {
        const file = await diagramSvg(diagrams, name);
        return {
          title: file.title,
          png: svgToPng(file.svg, 2),
          width: file.width,
          height: file.height,
          description: name === "flow" ? describeDiagram(diagrams.flow, diagrams.t) : undefined,
        };
      }),
    );

    return renderReport({
      locale,
      title: tSummary("pageTitle"),
      intro: t("intro"),
      preparedFor: user ? [user.name, user.company].filter(Boolean).join(" · ") : null,
      date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(journey!.completedAt ?? journey!.updatedAt),
      projectRef: `#${suffix}`,
      summaryUrl: absoluteUrl(summaryPath),
      siteUrl: SITE_URL,
      contactsUrl: contacts ? absoluteUrl(`/${locale}/${contacts.slug}`) : null,
      score: { total: score.total, areas: score.areas.map((a) => ({ label: a.label, percent: a.percent })) },
      recommendations: matchingRecommendations(def, answers).map((r) => ({ title: r.title, body: r.body })),
      diagrams: images,
      answers: formatAnswers(def, answers)
        .filter((a) => !a.hidden)
        .map((a, i) => ({
          number: i + 1,
          title: a.title,
          text: a.text,
          guideUrl: absoluteUrl(guidePath(locale, articleSlug(a.key))),
          references: markdownLinks(steps.get(a.key)?.references),
        })),
      logo: logoPng(),
      labels: {
        kicker: t("kicker"),
        preparedFor: t("preparedFor"),
        date: t("date"),
        project: t("project"),
        online: t("online"),
        score: tSummary("score"),
        areas: tSummary("areas"),
        recommendations: tSummary("recommendations"),
        noRecommendations: tSummary("noRecommendations"),
        answers: t("answers"),
        answersIntro: t("answersIntro"),
        guide: t("guide"),
        references: t("references"),
        description: t("description"),
        helpTitle: t("helpTitle"),
        helpBody: t("helpBody"),
        contacts: t("contacts"),
        // Segnaposto lasciati intatti: il numero di pagina lo mette il PDF
        page: t("page", { n: "{n}", total: "{total}" }),
        disclaimer: t("disclaimer"),
      },
    });
  }
}
