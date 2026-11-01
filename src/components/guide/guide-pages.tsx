import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { Markdown } from "@/components/site/markdown";
import { MonoLabel, RAIL, SectionRow } from "@/components/site/page-sections";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { guidePath, guideSegment, markdownLinks, plainText, truncate, type GuideLocale } from "@/lib/guide";
import { optionDescription } from "@/lib/option-description";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { getGuide, type GuideArticle } from "@/server/guide";
import { JsonLd } from "./json-ld";

/**
 * Pagine della guida, condivise da /it/guida e /en/guide: ogni cartella passa la lingua del
 * proprio segmento e chi arriva con la lingua "sbagliata" viene reindirizzato all'indirizzo giusto.
 */
type IndexParams = Promise<{ locale: string }>;
type ArticleParams = Promise<{ locale: string; slug: string }>;

const OG_LOCALE: Record<string, string> = { it: "it_IT", en: "en_GB" };
const PUBLISHER = { "@type": "Organization", name: "DPP Designer", url: SITE_URL };

function checkSegment(locale: string, segmentLocale: GuideLocale, slug?: string) {
  if (!routing.locales.includes(locale as never)) notFound();
  if (locale !== segmentLocale) permanentRedirect(guidePath(locale, slug));
}

/** Link alternativi per lingua (hreflang), con l'italiano come predefinito. */
function languages(slug?: string) {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, guidePath(l, slug)])),
    "x-default": guidePath(routing.defaultLocale, slug),
  };
}

/** Descrizione breve di un articolo: la sua descrizione, oppure la nota o le risposte possibili. */
function summary(a: GuideArticle) {
  const text = plainText(a.description) || plainText(a.help) || a.options.map((o) => o.label).join(", ");
  return truncate(text || a.title, 160);
}

/** Risposta in testo semplice per i dati strutturati (FAQ) e i motori di risposta. */
function answerText(a: GuideArticle) {
  return [
    plainText(a.description),
    ...a.options.map((o) => (o.description ? `${o.label}: ${plainText(o.description)}` : o.label)),
    ...a.notes.map((n) => plainText(n.message)),
    plainText(a.help),
  ]
    .filter(Boolean)
    .join(" ");
}

// ─── Indice ───

export async function guideIndexMetadata(params: IndexParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  const url = guidePath(locale);
  return {
    title: t("title"),
    description: t("lede"),
    alternates: { canonical: url, languages: languages() },
    openGraph: {
      type: "website",
      title: t("title"),
      description: t("lede"),
      url,
      siteName: "DPP Designer",
      locale: OG_LOCALE[locale],
    },
    twitter: { card: "summary", title: t("title"), description: t("lede") },
  };
}

export async function GuideIndexPage({ params, segmentLocale }: { params: IndexParams; segmentLocale: GuideLocale }) {
  const { locale } = await params;
  checkSegment(locale, segmentLocale);
  setRequestLocale(locale);
  const [guide, t, tSections] = await Promise.all([
    getGuide(locale),
    getTranslations("guide"),
    getTranslations("diagrams.blueprint.sections"),
  ]);
  if (!guide) notFound();

  const url = absoluteUrl(guidePath(locale));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: t("title"),
        description: t("lede"),
        inLanguage: locale,
        dateModified: guide.updatedAt.toISOString(),
        publisher: PUBLISHER,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: guide.articles.length,
          itemListElement: guide.articles.map((a) => ({
            "@type": "ListItem",
            position: a.number,
            url: absoluteUrl(guidePath(locale, a.slug)),
            name: a.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl(`/${locale}`) },
          { "@type": "ListItem", position: 2, name: t("section"), item: url },
        ],
      },
    ],
  };

  return (
    <div className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <JsonLd data={jsonLd} />
      <Breadcrumb label={t("breadcrumb")} items={[{ name: t("home"), href: "/" }, { name: t("section") }]} />
      <header className="pb-10">
        <MonoLabel className="mb-5">{t("byline", { count: guide.articles.length })}</MonoLabel>
        <h1 className="m-0 text-[clamp(38px,5vw,57px)] font-medium leading-[1.08] tracking-[-0.05em] text-balance">{t("title")}</h1>
        <p className="mt-5 text-lg leading-normal tracking-[-0.02em] text-muted-foreground md:text-xl">{t("lede")}</p>
      </header>

      {guide.sections.map((s) => (
        <SectionRow key={s.key} title={tSections.has(s.key) ? tSections(s.key) : s.key}>
          <ol className="grid gap-5">
            {s.articles.map((a) => (
              <li key={a.key} className="grid gap-1">
                <Link href={`/${guideSegment(locale)}/${a.slug}`} className="group inline-flex gap-3 text-[17px] font-medium leading-snug tracking-[-0.015em]">
                  <span className="w-6 shrink-0 font-mono text-[12px] leading-[1.6] text-muted-foreground tabular-nums">
                    {String(a.number).padStart(2, "0")}
                  </span>
                  <span className="underline-offset-4 group-hover:underline">{a.title}</span>
                </Link>
                {(a.description || a.help) && <p className="m-0 pl-9 text-sm text-muted-foreground">{summary(a)}</p>}
              </li>
            ))}
          </ol>
        </SectionRow>
      ))}

      <p className="mt-6 border-t pt-5 text-xs text-muted-foreground">
        <time dateTime={guide.updatedAt.toISOString()}>
          {t("updated", { date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(guide.updatedAt), version: guide.versionNumber })}
        </time>
      </p>
    </div>
  );
}

// ─── Articolo ───

async function findArticle(locale: string, slug: string) {
  const guide = await getGuide(locale);
  const index = guide?.articles.findIndex((a) => a.slug === slug) ?? -1;
  if (!guide || index < 0) return null;
  return { guide, article: guide.articles[index], prev: guide.articles[index - 1], next: guide.articles[index + 1] };
}

export async function guideArticleMetadata(params: ArticleParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await findArticle(locale, slug);
  if (!found) return {};
  const { article: a, guide } = found;
  const description = summary(a);
  const url = guidePath(locale, a.slug);
  return {
    title: a.title,
    description,
    alternates: { canonical: url, languages: languages(a.slug) },
    openGraph: {
      type: "article",
      title: a.title,
      description,
      url,
      siteName: "DPP Designer",
      locale: OG_LOCALE[locale],
      modifiedTime: guide.updatedAt.toISOString(),
    },
    twitter: { card: "summary", title: a.title, description },
  };
}

export async function GuideArticlePage({ params, segmentLocale }: { params: ArticleParams; segmentLocale: GuideLocale }) {
  const { locale, slug } = await params;
  checkSegment(locale, segmentLocale, slug);
  setRequestLocale(locale);
  const [found, t, tSections, tNav] = await Promise.all([
    findArticle(locale, slug),
    getTranslations("guide"),
    getTranslations("diagrams.blueprint.sections"),
    getTranslations("nav"),
  ]);
  if (!found) notFound();
  const { guide, article: a, prev, next } = found;

  const sectionTitle = tSections.has(a.section) ? tSections(a.section) : a.section;
  const url = absoluteUrl(guidePath(locale, a.slug));
  const indexUrl = absoluteUrl(guidePath(locale));
  const updated = guide.updatedAt.toISOString();
  const typeNote =
    a.type === "MATRIX"
      ? t("answerMatrix")
      : a.type === "TEXT"
        ? t("answerText")
        : a.type === "NUMBER"
          ? t("answerNumber")
          : a.type === "FIELDS"
            ? t("answerFields")
            : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: url,
        headline: a.title,
        description: summary(a),
        inLanguage: locale,
        articleSection: sectionTitle,
        position: a.number,
        datePublished: updated,
        dateModified: updated,
        author: PUBLISHER,
        publisher: PUBLISHER,
        isPartOf: { "@type": "CollectionPage", "@id": indexUrl, name: t("title") },
        about: { "@type": "Thing", name: "Digital Product Passport" },
        citation: markdownLinks([a.references, a.help, ...a.notes.map((n) => n.message)].join("\n")).map((l) => ({
          "@type": "CreativeWork",
          name: l.name,
          url: l.url,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: [{ "@type": "Question", name: a.title, acceptedAnswer: { "@type": "Answer", text: answerText(a) } }],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl(`/${locale}`) },
          { "@type": "ListItem", position: 2, name: t("section"), item: indexUrl },
          { "@type": "ListItem", position: 3, name: a.title, item: url },
        ],
      },
    ],
  };

  const base = `/${guideSegment(locale)}`;

  return (
    <article className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        label={t("breadcrumb")}
        items={[{ name: t("home"), href: "/" }, { name: t("section"), href: base }, { name: a.title }]}
      />
      <header className="max-w-[820px] pb-10">
        <MonoLabel className="mb-5">
          {t("question", { number: a.number, total: guide.articles.length })} · {sectionTitle}
        </MonoLabel>
        <h1 className="m-0 text-[clamp(34px,4.6vw,52px)] font-medium leading-[1.1] tracking-[-0.045em] text-balance">{a.title}</h1>
        {a.description && <p className="mt-5 max-w-[720px] text-lg leading-normal tracking-[-0.02em] md:text-xl">{a.description}</p>}
      </header>

      {(a.options.length > 0 || typeNote) && (
        <SectionRow title={t("answers")}>
          {typeNote && <p className="mb-4 text-muted-foreground">{typeNote}</p>}
          {a.options.length > 0 && (
            <dl className="grid gap-4">
              {a.options.map((o) => (
                <div key={o.key} className="grid gap-1 border-b pb-4 last:border-b-0 last:pb-0">
                  <dt className="font-medium">{o.label}</dt>
                  {o.description && (
                    <dd className="m-0">
                      <Markdown className="prose-compact text-[15px] text-muted-foreground">{optionDescription(o.description)}</Markdown>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          )}
        </SectionRow>
      )}

      {a.notes.length > 0 && (
        <SectionRow title={t("notes")}>
          <ul className="grid gap-4">
            {a.notes.map((n, i) => (
              <li key={i} className="grid gap-1.5">
                {n.mandatory && (
                  <span className="w-fit rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">{t("mandatory")}</span>
                )}
                <Markdown className="prose-compact text-[15px]">{n.message}</Markdown>
              </li>
            ))}
          </ul>
        </SectionRow>
      )}

      {a.help && (
        <SectionRow title={t("help")}>
          <Markdown className="prose-compact text-[15px]">{a.help}</Markdown>
        </SectionRow>
      )}

      {a.references && (
        <SectionRow title={t("references")}>
          <Markdown className="step-references text-[15px]">{a.references}</Markdown>
        </SectionRow>
      )}

      <SectionRow title={t("ctaTitle")}>
        <p className="mb-5 text-muted-foreground">{t("ctaText")}</p>
        <Link href="/progetta" className={buttonVariants({ size: "lg" })}>
          {tNav("startWizard")}
        </Link>
      </SectionRow>

      <nav aria-label={t("all")} className="grid gap-4 border-t pt-8 sm:grid-cols-2">
        {prev ? (
          <Link href={`${base}/${prev.slug}`} className="group grid gap-1 rounded-lg border p-4 transition-colors hover:bg-muted">
            <span className="font-mono text-[11px] text-muted-foreground">← {t("prev")}</span>
            <span className="font-medium group-hover:underline">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`${base}/${next.slug}`} className="group grid gap-1 rounded-lg border p-4 text-right transition-colors hover:bg-muted">
            <span className="font-mono text-[11px] text-muted-foreground">{t("next")} →</span>
            <span className="font-medium group-hover:underline">{next.title}</span>
          </Link>
        )}
      </nav>

      <p className="mt-8 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
        <Link href={base} className="underline-offset-4 hover:underline">
          {t("all")}
        </Link>
        <time dateTime={updated}>
          {t("updated", { date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(guide.updatedAt), version: guide.versionNumber })}
        </time>
      </p>
    </article>
  );
}

// ─── Briciole di pane ───

function Breadcrumb({ label, items }: { label: string; items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label={label} className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-foreground">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 text-foreground">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
