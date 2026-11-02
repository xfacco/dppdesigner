import { routing } from "@/i18n/routing";
import { blogMarkdownPath, blogPath, lines, parseFaq, parseSources } from "@/lib/blog";
import { guidePath, markdownLinks } from "@/lib/guide";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { listPosts } from "@/server/blog";
import { getGuide } from "@/server/guide";
import { pageMarkdownPath, pillarPages } from "@/server/pages-markdown";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

/**
 * Open data: i contenuti pubblici del sito in JSON, per riuso e integrazioni.
 * Pagine principali, domande del wizard pubblicato (con risposte possibili, indicazioni e riferimenti
 * normativi) e articoli pubblicati, in tutte le lingue. Nessun dato degli utenti.
 */
export async function GET() {
  const settings = await getSiteSettings();
  const languages = await Promise.all(
    routing.locales.map(async (locale) => {
      const [guide, posts, pages] = await Promise.all([getGuide(locale), listPosts(locale), pillarPages(locale)]);
      return {
        locale,
        pages: pages.map((p) => ({
          title: p.title,
          description: p.description,
          url: absoluteUrl(`/${locale}/${p.slug}`),
          markdown: absoluteUrl(pageMarkdownPath(locale, p.slug)),
          updatedAt: p.updatedAt.toISOString(),
        })),
        guide: guide && {
          url: absoluteUrl(guidePath(locale)),
          wizardVersion: guide.versionNumber,
          updatedAt: guide.updatedAt.toISOString(),
          questions: guide.articles.map((a) => ({
            key: a.key,
            number: a.number,
            section: a.section,
            type: a.type,
            title: a.title,
            description: a.description,
            note: a.help,
            url: absoluteUrl(guidePath(locale, a.slug)),
            options: a.options.map((o) => ({ key: o.key, label: o.label, description: o.description })),
            guidance: a.notes.map((n) => ({ text: n.message, requiredByLaw: n.mandatory })),
            references: a.references,
            referenceLinks: markdownLinks(a.references),
          })),
        },
        articles: posts
          .filter((p) => !p.noindex)
          .map((p) => ({
            title: p.title,
            summary: p.excerpt,
            url: absoluteUrl(blogPath(locale, p.slug)),
            markdown: absoluteUrl(blogMarkdownPath(locale, p.slug)),
            publishedAt: p.publishedAt.toISOString(),
            updatedAt: p.modifiedAt.toISOString(),
            author: p.author || settings.defaultAuthor,
            category: p.category,
            tags: p.tags,
            keyTakeaways: lines(p.keyTakeaways),
            faq: parseFaq(p.faq),
            sources: parseSources(p.sources),
            relatedQuestions: p.stepKeys,
          })),
      };
    }),
  );

  const body = {
    name: `${settings.organizationName} — open data`,
    publisher: { name: settings.organizationName, url: settings.organizationUrl },
    url: absoluteUrl("/open-data.json"),
    generatedAt: new Date().toISOString(),
    links: { site: SITE_URL, sitemap: absoluteUrl("/sitemap.xml"), llms: absoluteUrl("/llms.txt"), llmsFull: absoluteUrl("/llms-full.txt") },
    languages,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}
