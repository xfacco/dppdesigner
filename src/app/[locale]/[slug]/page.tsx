import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/guide/json-ld";
import { Byline } from "@/components/site/byline";
import { CookieTable } from "@/components/site/cookie-table";
import { MarkdownBody, MonoLabel, RAIL, SectionRow } from "@/components/site/page-sections";
import { routing } from "@/i18n/routing";
import { plainText, truncate } from "@/lib/guide";
import { splitMarkdown } from "@/lib/markdown-sections";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { getPageBySlug } from "@/server/content";
import { pageMarkdownPath } from "@/server/pages-markdown";
import { getSiteSettings, ORGANIZATION_ID, PERSON_ID, personLd, resolveAuthor } from "@/server/site-settings";
import { ContactForm } from "./contact-form";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * Tipo schema.org di una pagina di contenuto. Le pagine "pilastro" (Cos'è il DPP, Normativa ESPR,
 * Settori e quelle aggiunte da admin) sono articoli con autore e date; le altre hanno il tipo giusto.
 */
const PAGE_TYPES: Record<string, "AboutPage" | "ContactPage" | "WebPage"> = {
  about: "AboutPage",
  contacts: "ContactPage",
  privacy: "WebPage",
  cookies: "WebPage",
};
const isArticle = (key: string) => !PAGE_TYPES[key];

const OG_LOCALE: Record<string, string> = { it: "it_IT", en: "en_GB" };

/** Data di pubblicazione: la creazione, ma mai dopo l'ultima modifica (pagine create prima che esistesse la colonna). */
const publishedOf = (p: { createdAt: Date; updatedAt: Date }) => (p.createdAt < p.updatedAt ? p.createdAt : p.updatedAt);

function languages(translations: { locale: string; slug: string }[]) {
  const map: Record<string, string> = Object.fromEntries(translations.map((t) => [t.locale, `/${t.locale}/${t.slug}`]));
  const fallback = map[routing.defaultLocale] ?? Object.values(map)[0];
  return fallback ? { ...map, "x-default": fallback } : map;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const [page, s] = await Promise.all([getPageBySlug(locale, slug), getSiteSettings()]);
  if (!page) return {};
  const description = page.description ?? (truncate(plainText(splitMarkdown(page.body).lede ?? page.body), 160) || undefined);
  const author = isArticle(page.page.key) ? resolveAuthor(s) : null;
  return {
    title: page.title,
    description,
    authors: author ? [{ name: author.name, url: author.url ?? undefined }] : undefined,
    alternates: {
      canonical: `/${locale}/${page.slug}`,
      languages: languages(page.page.translations),
      types: { "text/markdown": pageMarkdownPath(locale, page.slug) },
    },
    openGraph: {
      type: isArticle(page.page.key) ? "article" : "website",
      title: page.title,
      description,
      url: `/${locale}/${page.slug}`,
      siteName: s.organizationName,
      locale: OG_LOCALE[locale],
      ...(isArticle(page.page.key)
        ? { publishedTime: publishedOf(page.page).toISOString(), modifiedTime: page.page.updatedAt.toISOString(), authors: author ? [author.name] : undefined }
        : {}),
    },
    twitter: { card: "summary", title: page.title, description },
  };
}

export default async function ContentPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [page, s, tGuide] = await Promise.all([getPageBySlug(locale, slug), getSiteSettings(), getTranslations("guide")]);
  if (!page) notFound();

  const parts = splitMarkdown(page.body);
  const rest = [parts.intro, ...parts.sections.map((sec) => `## ${sec.title}\n${sec.body}`)].filter(Boolean).join("\n\n");
  const key = page.page.key;
  const article = isArticle(key);
  const author = article ? resolveAuthor(s) : null;
  const person = personLd(s);
  const url = absoluteUrl(`/${locale}/${page.slug}`);
  const title = parts.title ?? page.title;
  const description = page.description ?? (parts.lede ? plainText(parts.lede) : undefined);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      article
        ? {
            "@type": "Article",
            "@id": `${url}#article`,
            url,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            headline: truncate(title, 110),
            ...(description ? { description } : {}),
            inLanguage: locale,
            datePublished: publishedOf(page.page).toISOString(),
            dateModified: page.page.updatedAt.toISOString(),
            author: author ? (author.isDefault && person ? { "@id": PERSON_ID } : { "@type": "Person", name: author.name }) : { "@id": ORGANIZATION_ID },
            publisher: { "@id": ORGANIZATION_ID },
            about: { "@type": "Thing", name: "Digital Product Passport" },
          }
        : {
            "@type": PAGE_TYPES[key],
            "@id": url,
            url,
            name: title,
            ...(description ? { description } : {}),
            inLanguage: locale,
            dateModified: page.page.updatedAt.toISOString(),
            isPartOf: { "@id": `${SITE_URL}/#website` },
            publisher: { "@id": ORGANIZATION_ID },
            // "Chi sono": la pagina parla della persona di riferimento del sito
            ...(key === "about" && person ? { mainEntity: { "@id": PERSON_ID }, about: { "@id": PERSON_ID } } : {}),
          },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: tGuide("home"), item: absoluteUrl(`/${locale}`) },
          { "@type": "ListItem", position: 2, name: title, item: url },
        ],
      },
    ],
  };

  return (
    <article className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <JsonLd data={jsonLd} />
      <header className="max-w-[820px] pb-10">
        <MonoLabel className="mb-5">DPP Designer</MonoLabel>
        <h1 className="m-0 text-[clamp(38px,5vw,57px)] font-medium leading-[1.08] tracking-[-0.05em] text-balance">{title}</h1>
        {parts.lede && <p className="mt-5 max-w-[720px] text-lg leading-normal tracking-[-0.02em] md:text-xl">{parts.lede}</p>}
        {article && <Byline locale={locale} updated={page.page.updatedAt} author={author} />}
      </header>
      {rest && <MarkdownBody body={rest} />}
      {key === "cookies" && (
        <div className="max-w-[900px] border-t pt-10">
          <CookieTable locale={locale} />
        </div>
      )}
      {key === "contacts" && (
        <SectionRow title={page.title}>
          <ContactForm />
        </SectionRow>
      )}
    </article>
  );
}
