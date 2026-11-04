import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { ArticleSearch } from "@/components/blog/article-search";
import { JsonLd } from "@/components/guide/json-ld";
import { Byline } from "@/components/site/byline";
import { Markdown } from "@/components/site/markdown";
import { MonoLabel, RAIL } from "@/components/site/page-sections";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { blogMarkdownPath, blogPath, blogSegment, lines, parseFaq, parseSources, readingStats, tableOfContents, type BlogLocale } from "@/lib/blog";
import { highlight, queryTerms, searchPosts } from "@/lib/blog-search";
import { plainText, truncate } from "@/lib/guide";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { getPost, listPosts, relatedPosts, type PostView } from "@/server/blog";
import { getSiteSettings, PERSON_ID, personLd, resolveAuthor, toAbsolute } from "@/server/site-settings";

/**
 * Pagine della sezione "Articoli", condivise da /it/articoli e /en/articles: ogni cartella passa
 * la lingua del proprio segmento e chi arriva con la lingua "sbagliata" viene reindirizzato.
 *
 * Struttura pensata per motori di ricerca e motori di risposta (GEO): risposta in apertura
 * ("In breve"), titoli con ancora e indice, domande frequenti, fonti citate, autore con ruolo e
 * profilo, date di pubblicazione e revisione, dati strutturati schema.org e versione Markdown.
 */
type IndexParams = Promise<{ locale: string }>;
type PostParams = Promise<{ locale: string; slug: string }>;
type SearchParams = Promise<{ q?: string | string[] }>;

const OG_LOCALE: Record<string, string> = { it: "it_IT", en: "en_GB" };
const ORG_REF = { "@id": `${SITE_URL}/#organization` };
const fmt = (locale: string, d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d);

function checkSegment(locale: string, segmentLocale: BlogLocale) {
  if (!routing.locales.includes(locale as never)) notFound();
  // Lo slug di un articolo è tradotto: con la lingua sbagliata si torna all'elenco giusto
  if (locale !== segmentLocale) permanentRedirect(blogPath(locale));
}

const descriptionOf = (p: PostView) => truncate(p.seoDescription || p.excerpt || plainText(p.body), 160);

// ─── Elenco ───

/** La ricerca (?q=) letta dall'URL, al massimo 100 caratteri. */
const searchQuery = async (searchParams: SearchParams) => {
  const { q } = await searchParams;
  return (Array.isArray(q) ? q[0] : (q ?? "")).trim().slice(0, 100);
};

export async function blogIndexMetadata(params: IndexParams, searchParams: SearchParams): Promise<Metadata> {
  const [{ locale }, q] = await Promise.all([params, searchQuery(searchParams)]);
  const [t, s] = await Promise.all([getTranslations({ locale, namespace: "blog" }), getSiteSettings()]);
  const images = s.defaultOgImageUrl ? [s.defaultOgImageUrl] : undefined;
  return {
    title: q ? t("search.metaTitle", { q }) : t("title"),
    // I risultati di una ricerca non vanno indicizzati: il canonical resta l'elenco completo
    ...(q ? { robots: { index: false, follow: true } } : {}),
    description: t("lede"),
    alternates: {
      canonical: blogPath(locale),
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, blogPath(l)])), "x-default": blogPath(routing.defaultLocale) },
    },
    openGraph: { type: "website", title: t("title"), description: t("lede"), url: blogPath(locale), siteName: s.organizationName, locale: OG_LOCALE[locale], images },
    twitter: { card: images ? "summary_large_image" : "summary", title: t("title"), description: t("lede"), site: s.twitterHandle ?? undefined },
  };
}

export async function BlogIndexPage({ params, searchParams, segmentLocale }: { params: IndexParams; searchParams: SearchParams; segmentLocale: BlogLocale }) {
  const { locale } = await params;
  checkSegment(locale, segmentLocale);
  setRequestLocale(locale);
  const [posts, t, q] = await Promise.all([listPosts(locale), getTranslations("blog"), searchQuery(searchParams)]);
  const terms = queryTerms(q);
  const results = searchPosts(
    posts.map((p) => ({ ...p, text: plainText(p.body), date: p.publishedAt })),
    q,
  );

  const url = absoluteUrl(blogPath(locale));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": url,
        url,
        name: t("title"),
        description: t("lede"),
        inLanguage: locale,
        publisher: ORG_REF,
        blogPost: posts
          .filter((p) => !p.noindex)
          .map((p) => ({
            "@type": "BlogPosting",
            "@id": `${absoluteUrl(blogPath(locale, p.slug))}#article`,
            headline: p.title,
            url: absoluteUrl(blogPath(locale, p.slug)),
            datePublished: p.publishedAt.toISOString(),
            dateModified: p.modifiedAt.toISOString(),
          })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl(`/${locale}`) },
          { "@type": "ListItem", position: 2, name: t("title"), item: url },
        ],
      },
    ],
  };

  return (
    <div className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <JsonLd data={jsonLd} />
      <Breadcrumb label={t("breadcrumb")} items={[{ name: t("home"), href: "/" }, { name: t("title") }]} />
      <header className="pb-10">
        <h1 className="m-0 text-[clamp(38px,5vw,57px)] font-medium leading-[1.08] tracking-[-0.05em] text-balance">{t("title")}</h1>
        <p className="mt-5 text-lg leading-normal tracking-[-0.02em] text-muted-foreground md:text-xl">{t("lede")}</p>
      </header>

      {posts.length > 0 && (
        <div className="grid gap-3 pb-8">
          <ArticleSearch initial={q} label={t("search.label")} placeholder={t("search.placeholder")} clear={t("search.clear")} />
          {q && (
            <p role="status" className="m-0 text-sm text-muted-foreground">
              {results.length > 0 ? t("search.results", { count: results.length, q }) : t("search.none", { q })}{" "}
              <Link href={`/${blogSegment(locale)}`} className="text-foreground underline underline-offset-4">
                {t("search.showAll")}
              </Link>
            </p>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="border-t py-10 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ol className="grid">
          {results.map(({ post: p, snippet }) => (
            <li key={p.id} className="grid gap-3 border-t py-8 md:grid-cols-[minmax(190px,0.8fr)_minmax(0,1.2fr)] md:gap-[30px]">
              <MonoLabel className="pt-1.5">
                <time dateTime={p.publishedAt.toISOString()}>{fmt(locale, p.publishedAt)}</time>
                {p.category && <> · {p.category}</>}
                <> · {t("readingTime", { minutes: readingStats(p.text).minutes })}</>
              </MonoLabel>
              <article className="grid max-w-[640px] gap-2">
                <h2 className="m-0 text-2xl font-medium leading-snug tracking-[-0.03em]">
                  <Link href={`/${blogSegment(locale)}/${p.slug}`} className="underline-offset-4 hover:underline">
                    <Marked text={p.title} terms={terms} />
                  </Link>
                </h2>
                {p.excerpt && (
                  <p className="m-0 text-muted-foreground">
                    <Marked text={p.excerpt} terms={terms} />
                  </p>
                )}
                {snippet && (
                  <p className="m-0 border-l-2 pl-3 text-sm text-muted-foreground">
                    <Marked text={snippet} terms={terms} />
                  </p>
                )}
                <Link href={`/${blogSegment(locale)}/${p.slug}`} className="mt-1 w-fit text-sm text-primary underline-offset-4 hover:underline">
                  {t("readMore")} →
                </Link>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Testo con le parole cercate evidenziate. */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  return highlight(text, terms).map((p, i) =>
    p.match ? (
      <mark key={i} className="rounded-sm bg-primary/15 px-0.5 text-inherit">
        {p.text}
      </mark>
    ) : (
      p.text
    ),
  );
}

// ─── Articolo ───

/** Link alternativi per lingua: solo le traduzioni esistenti dell'articolo. */
function postLanguages(translations: { locale: string; slug: string }[]) {
  const map: Record<string, string> = Object.fromEntries(translations.map((t) => [t.locale, blogPath(t.locale, t.slug)]));
  const fallback = map[routing.defaultLocale] ?? Object.values(map)[0];
  return fallback ? { ...map, "x-default": fallback } : map;
}

export async function blogPostMetadata(params: PostParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const [post, s] = await Promise.all([getPost(locale, slug), getSiteSettings()]);
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = descriptionOf(post);
  const image = toAbsolute(post.coverImageUrl) ?? s.defaultOgImageUrl;
  const images = image ? [{ url: image, alt: post.coverImageAlt || post.title }] : undefined;
  const author = post.author || s.defaultAuthor;
  return {
    title,
    description,
    keywords: post.tags.length ? post.tags : undefined,
    category: post.category ?? undefined,
    authors: author ? [{ name: author, url: post.authorUrl ?? undefined }] : undefined,
    robots: post.noindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: post.canonicalUrl || blogPath(locale, post.slug),
      languages: postLanguages(post.translations),
      types: { "text/markdown": blogMarkdownPath(locale, post.slug) },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: blogPath(locale, post.slug),
      siteName: s.organizationName,
      locale: OG_LOCALE[locale],
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.modifiedAt.toISOString(),
      authors: author ? [author] : undefined,
      section: post.category ?? undefined,
      tags: post.tags.length ? post.tags : undefined,
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, site: s.twitterHandle ?? undefined },
  };
}

export async function BlogPostPage({ params, segmentLocale }: { params: PostParams; segmentLocale: BlogLocale }) {
  const { locale, slug } = await params;
  checkSegment(locale, segmentLocale);
  setRequestLocale(locale);
  const [post, t, s] = await Promise.all([getPost(locale, slug), getTranslations("blog"), getSiteSettings()]);
  if (!post) notFound();
  const related = await relatedPosts(locale, post);

  const url = absoluteUrl(blogPath(locale, post.slug));
  const indexUrl = absoluteUrl(blogPath(locale));
  const takeaways = lines(post.keyTakeaways);
  const faq = parseFaq(post.faq);
  const sources = parseSources(post.sources);
  const toc = tableOfContents(post.body);
  const stats = readingStats(plainText(post.body));
  const image = toAbsolute(post.coverImageUrl);
  const author = resolveAuthor(s, { name: post.author, title: post.authorTitle, url: post.authorUrl });
  const person = personLd(s);

  // La persona di riferimento del sito è un'unica entità (stesso @id su tutte le pagine)
  const authorLd = !author
    ? ORG_REF
    : author.isDefault && person
      ? { "@id": PERSON_ID }
      : {
          "@type": "Person",
          name: author.name,
          ...(author.title ? { jobTitle: author.title } : {}),
          ...(author.url ? { url: author.url, sameAs: [author.url] } : {}),
          worksFor: ORG_REF,
        };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // Organization e Person sono già nel grafo del sito (layout): qui solo i riferimenti @id
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: truncate(post.title, 110),
        ...(post.seoTitle && post.seoTitle !== post.title ? { alternativeHeadline: post.seoTitle } : {}),
        description: descriptionOf(post),
        ...(takeaways.length ? { abstract: takeaways.join(" ") } : {}),
        ...(image ? { image: { "@type": "ImageObject", url: image, caption: post.coverImageAlt || post.title } } : {}),
        inLanguage: locale,
        datePublished: post.publishedAt.toISOString(),
        dateModified: post.modifiedAt.toISOString(),
        author: authorLd,
        publisher: ORG_REF,
        isPartOf: { "@type": "Blog", "@id": indexUrl, name: t("title") },
        ...(post.category ? { articleSection: post.category } : {}),
        ...(post.tags.length ? { keywords: post.tags.join(", "), about: post.tags.map((name) => ({ "@type": "Thing", name })) } : {}),
        wordCount: stats.words,
        timeRequired: `PT${stats.minutes}M`,
        ...(sources.length ? { citation: sources.map((c) => ({ "@type": "CreativeWork", name: c.name, url: c.url, ...(c.description ? { description: c.description } : {}) })) } : {}),
        // Parti più adatte alla lettura vocale e alla citazione: titolo e sommario. "In breve" non è
        // mostrato ai lettori: resta solo in abstract e nella versione Markdown
        speakable: { "@type": "SpeakableSpecification", cssSelector: post.excerpt ? ["h1", "#sommario"] : ["h1"] },
        encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: absoluteUrl(blogMarkdownPath(locale, post.slug)) },
      },
      ...(faq.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: plainText(f.answer) } })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl(`/${locale}`) },
          { "@type": "ListItem", position: 2, name: t("title"), item: indexUrl },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  const base = `/${blogSegment(locale)}`;
  const tocList = (
    <ol className="grid gap-2 text-sm">
      {toc.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {h.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <article className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <JsonLd data={jsonLd} />
      <Breadcrumb label={t("breadcrumb")} items={[{ name: t("home"), href: "/" }, { name: t("title"), href: base }, { name: post.title }]} />

      <header className="pb-8">
        <MonoLabel className="mb-5">
          {post.category && <>{post.category} · </>}
          {t("readingTime", { minutes: stats.minutes })}
        </MonoLabel>
        <h1 className="m-0 text-[clamp(34px,4.6vw,52px)] font-medium leading-[1.1] tracking-[-0.045em] text-balance">{post.title}</h1>
        {post.excerpt && <p id="sommario" className="mt-5 text-lg leading-normal tracking-[-0.02em] text-muted-foreground md:text-xl">{post.excerpt}</p>}
        <Byline locale={locale} published={post.publishedAt} updated={post.modifiedAt} author={author} />
      </header>

      {image && (
        // Immagine esterna o del sito, scelta in admin: niente ottimizzazione di next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={post.coverImageAlt || ""} className="mb-10 w-full max-w-[1000px] rounded-lg border object-cover" />
      )}

      <div className="grid gap-10 border-t pt-10 lg:grid-cols-[minmax(0,720px)_minmax(0,240px)] lg:justify-between">
        <div className="min-w-0">
          {toc.length > 1 && (
            <details className="mb-10 rounded-lg border px-5 py-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold">{t("toc")}</summary>
              <nav aria-label={t("toc")} className="mt-3">
                {tocList}
              </nav>
            </details>
          )}

          <Markdown headingIds className="[&>*:first-child]:mt-0">
            {post.body}
          </Markdown>

          {faq.length > 0 && (
            <section id="faq" aria-labelledby="faq-title" className="mt-14 border-t pt-10">
              <h2 id="faq-title" className="m-0 mb-6 text-2xl font-medium tracking-[-0.03em]">
                {t("faq")}
              </h2>
              <div className="grid gap-6">
                {faq.map((f, i) => (
                  <div key={i}>
                    <h3 className="m-0 mb-2 text-lg font-medium">{f.question}</h3>
                    <Markdown className="prose-compact text-[16px] text-muted-foreground">{f.answer}</Markdown>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sources.length > 0 && (
            <section aria-labelledby="sources-title" className="mt-14 border-t pt-10">
              <h2 id="sources-title" className="m-0 mb-4 text-lg font-semibold">
                {t("sources")}
              </h2>
              <ol className="grid list-decimal gap-2 pl-5 text-sm">
                {sources.map((c, i) => (
                  <li key={i}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                      {c.name}
                    </a>
                    {c.description && <p className="m-0 mt-0.5 text-muted-foreground">{c.description}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <footer className="mt-12 grid gap-3 text-sm text-muted-foreground">
            {post.tags.length > 0 && (
              <p className="m-0 flex flex-wrap items-center gap-2">
                <span>{t("tags")}:</span>
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full border px-2.5 py-0.5 text-xs text-foreground">
                    {tag}
                  </span>
                ))}
              </p>
            )}
            <p className="m-0">
              <a href={blogMarkdownPath(locale, post.slug)} className="underline-offset-4 hover:underline" type="text/markdown">
                {t("markdown")}
              </a>
            </p>
          </footer>
        </div>

        {toc.length > 1 && (
          <aside className="hidden lg:block">
            <nav aria-label={t("toc")} className="sticky top-8 grid gap-3">
              <p className="m-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{t("toc")}</p>
              {tocList}
            </nav>
          </aside>
        )}
      </div>

      <aside className="mt-14 grid max-w-[720px] gap-4 rounded-lg border p-6">
        <p className="m-0 text-xl font-medium tracking-[-0.025em]">{t("ctaTitle")}</p>
        <p className="m-0 text-muted-foreground">{t("ctaText")}</p>
        <Link href="/progetta" className={buttonVariants({ className: "w-fit" })}>
          {t("ctaTitle")}
        </Link>
      </aside>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-14 border-t pt-10">
          <h2 id="related-title" className="m-0 mb-6 text-xl font-medium tracking-[-0.025em]">
            {t("related")}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`${base}/${r.slug}`} className="group grid h-full gap-2 rounded-lg border p-5 transition-colors hover:bg-muted">
                  <span className="font-mono text-[11px] text-muted-foreground">{fmt(locale, r.publishedAt)}</span>
                  <span className="font-medium group-hover:underline">{r.title}</span>
                  {r.excerpt && <span className="line-clamp-3 text-sm text-muted-foreground">{r.excerpt}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-sm">
        <Link href={base} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          ← {t("all")}
        </Link>
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
