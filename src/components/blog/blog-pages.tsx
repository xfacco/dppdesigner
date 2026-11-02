import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/guide/json-ld";
import { Markdown } from "@/components/site/markdown";
import { MonoLabel, RAIL } from "@/components/site/page-sections";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { blogPath, blogSegment, type BlogLocale } from "@/lib/blog";
import { plainText, truncate } from "@/lib/guide";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { getPost, listPosts } from "@/server/blog";

/**
 * Pagine della sezione "Articoli", condivise da /it/articoli e /en/articles: ogni cartella passa
 * la lingua del proprio segmento e chi arriva con la lingua "sbagliata" viene reindirizzato.
 */
type IndexParams = Promise<{ locale: string }>;
type PostParams = Promise<{ locale: string; slug: string }>;

const OG_LOCALE: Record<string, string> = { it: "it_IT", en: "en_GB" };
const PUBLISHER = { "@type": "Organization", name: "DPP Designer", url: SITE_URL };
const fmt = (locale: string, d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d);

function checkSegment(locale: string, segmentLocale: BlogLocale) {
  if (!routing.locales.includes(locale as never)) notFound();
  // Lo slug di un articolo è tradotto: con la lingua sbagliata si torna all'elenco giusto
  if (locale !== segmentLocale) permanentRedirect(blogPath(locale));
}

// ─── Elenco ───

export async function blogIndexMetadata(params: IndexParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("lede"),
    alternates: {
      canonical: blogPath(locale),
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, blogPath(l)])), "x-default": blogPath(routing.defaultLocale) },
    },
    openGraph: { type: "website", title: t("title"), description: t("lede"), url: blogPath(locale), siteName: "DPP Designer", locale: OG_LOCALE[locale] },
    twitter: { card: "summary", title: t("title"), description: t("lede") },
  };
}

export async function BlogIndexPage({ params, segmentLocale }: { params: IndexParams; segmentLocale: BlogLocale }) {
  const { locale } = await params;
  checkSegment(locale, segmentLocale);
  setRequestLocale(locale);
  const [posts, t] = await Promise.all([listPosts(locale), getTranslations("blog")]);

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
        publisher: PUBLISHER,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: absoluteUrl(blogPath(locale, p.slug)),
          datePublished: p.publishedAt.toISOString(),
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
        <MonoLabel className="mb-5">{t("byline", { count: posts.length })}</MonoLabel>
        <h1 className="m-0 text-[clamp(38px,5vw,57px)] font-medium leading-[1.08] tracking-[-0.05em] text-balance">{t("title")}</h1>
        <p className="mt-5 text-lg leading-normal tracking-[-0.02em] text-muted-foreground md:text-xl">{t("lede")}</p>
      </header>

      {posts.length === 0 ? (
        <p className="border-t py-10 text-muted-foreground">{t("empty")}</p>
      ) : (
        <ol className="grid">
          {posts.map((p) => (
            <li key={p.id} className="grid gap-3 border-t py-8 md:grid-cols-[minmax(190px,0.8fr)_minmax(0,1.2fr)] md:gap-[30px]">
              <MonoLabel className="pt-1.5">
                <time dateTime={p.publishedAt.toISOString()}>{fmt(locale, p.publishedAt)}</time>
                {p.author && <> · {t("by", { author: p.author })}</>}
              </MonoLabel>
              <article className="grid max-w-[640px] gap-2">
                <h2 className="m-0 text-2xl font-medium leading-snug tracking-[-0.03em]">
                  <Link href={`/${blogSegment(locale)}/${p.slug}`} className="underline-offset-4 hover:underline">
                    {p.title}
                  </Link>
                </h2>
                {p.excerpt && <p className="m-0 text-muted-foreground">{p.excerpt}</p>}
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

// ─── Articolo ───

/** Link alternativi per lingua: solo le traduzioni esistenti dell'articolo. */
function postLanguages(translations: { locale: string; slug: string }[]) {
  const map: Record<string, string> = Object.fromEntries(translations.map((t) => [t.locale, blogPath(t.locale, t.slug)]));
  const fallback = map[routing.defaultLocale] ?? Object.values(map)[0];
  return fallback ? { ...map, "x-default": fallback } : map;
}

export async function blogPostMetadata(params: PostParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  if (!post) return {};
  const description = truncate(post.excerpt || plainText(post.body), 160);
  return {
    title: post.title,
    description,
    authors: post.author ? [{ name: post.author }] : undefined,
    alternates: { canonical: blogPath(locale, post.slug), languages: postLanguages(post.translations) },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: blogPath(locale, post.slug),
      siteName: "DPP Designer",
      locale: OG_LOCALE[locale],
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author ? [post.author] : undefined,
    },
    twitter: { card: "summary", title: post.title, description },
  };
}

export async function BlogPostPage({ params, segmentLocale }: { params: PostParams; segmentLocale: BlogLocale }) {
  const { locale, slug } = await params;
  checkSegment(locale, segmentLocale);
  setRequestLocale(locale);
  const [post, t] = await Promise.all([getPost(locale, slug), getTranslations("blog")]);
  if (!post) notFound();

  const url = absoluteUrl(blogPath(locale, post.slug));
  const indexUrl = absoluteUrl(blogPath(locale));
  const edited = post.updatedAt.getTime() - post.publishedAt.getTime() > 24 * 3600 * 1000;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: url,
        headline: post.title,
        description: truncate(post.excerpt || plainText(post.body), 160),
        inLanguage: locale,
        datePublished: post.publishedAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: post.author ? { "@type": "Person", name: post.author } : PUBLISHER,
        publisher: PUBLISHER,
        isPartOf: { "@type": "Blog", "@id": indexUrl, name: t("title") },
        wordCount: plainText(post.body).split(" ").filter(Boolean).length,
      },
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

  return (
    <article className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <JsonLd data={jsonLd} />
      <Breadcrumb
        label={t("breadcrumb")}
        items={[{ name: t("home"), href: "/" }, { name: t("title"), href: `/${blogSegment(locale)}` }, { name: post.title }]}
      />
      <header className="max-w-[820px] pb-10">
        <MonoLabel className="mb-5">
          <time dateTime={post.publishedAt.toISOString()}>{fmt(locale, post.publishedAt)}</time>
          {post.author && <> · {t("by", { author: post.author })}</>}
        </MonoLabel>
        <h1 className="m-0 text-[clamp(34px,4.6vw,52px)] font-medium leading-[1.1] tracking-[-0.045em] text-balance">{post.title}</h1>
        {post.excerpt && <p className="mt-5 max-w-[720px] text-lg leading-normal tracking-[-0.02em] text-muted-foreground md:text-xl">{post.excerpt}</p>}
      </header>

      <div className="max-w-[720px] border-t pt-10">
        <Markdown className="[&>*:first-child]:mt-0">{post.body}</Markdown>
        {edited && (
          <p className="mt-8 text-xs text-muted-foreground">
            <time dateTime={post.updatedAt.toISOString()}>{t("updated", { date: fmt(locale, post.updatedAt) })}</time>
          </p>
        )}
      </div>

      <aside className="mt-14 grid max-w-[720px] gap-4 rounded-lg border p-6">
        <p className="m-0 text-xl font-medium tracking-[-0.025em]">{t("ctaTitle")}</p>
        <p className="m-0 text-muted-foreground">{t("ctaText")}</p>
        <Link href="/progetta" className={buttonVariants({ className: "w-fit" })}>
          {t("ctaTitle")}
        </Link>
      </aside>

      <p className="mt-10 text-sm">
        <Link href={`/${blogSegment(locale)}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
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
