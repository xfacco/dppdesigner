import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { blogMarkdownPath, blogPath } from "@/lib/blog";
import { guidePath } from "@/lib/guide";
import { absoluteUrl } from "@/lib/site-url";
import { listPosts } from "@/server/blog";
import { pageMarkdownPath, pillarPages } from "@/server/pages-markdown";
import { guideMarkdown } from "@/server/guide-markdown";

export const dynamic = "force-dynamic";

/** Indice del sito per i modelli linguistici (formato llms.txt): pagine principali, articoli e guida. */
export async function GET() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "footer" });
  const parts = [`# DPP Designer`, "", `> ${t("about")}`, ""];

  // Pagine principali (le più generali e citabili), per lingua
  for (const locale of routing.locales) {
    const pages = await pillarPages(locale);
    if (!pages.length) continue;
    parts.push(locale === "it" ? "## Pagine principali (IT)" : "## Main pages (EN)", "");
    for (const p of pages)
      parts.push(`- [${p.title}](${absoluteUrl(pageMarkdownPath(locale, p.slug))}): ${p.description ? `${p.description} ` : ""}(${absoluteUrl(`/${locale}/${p.slug}`)})`);
    parts.push("");
  }

  // Articoli del blog, per lingua
  for (const locale of routing.locales) {
    const posts = (await listPosts(locale)).filter((p) => !p.noindex);
    if (!posts.length) continue;
    const tBlog = await getTranslations({ locale, namespace: "blog" });
    parts.push(`## ${tBlog("title")} (${locale.toUpperCase()})`, "", `${tBlog("lede")} ${absoluteUrl(blogPath(locale))}`, "");
    // Link alla versione Markdown, più facile da leggere per un modello; la pagina HTML è indicata nel testo
    for (const p of posts)
      parts.push(`- [${p.title}](${absoluteUrl(blogMarkdownPath(locale, p.slug))}): ${p.excerpt ? `${p.excerpt} ` : ""}(${absoluteUrl(blogPath(locale, p.slug))})`);
    parts.push("");
  }

  for (const locale of routing.locales) {
    const tGuide = await getTranslations({ locale, namespace: "guide" });
    const list = await guideMarkdown(locale, false);
    if (!list) continue;
    parts.push(`## ${tGuide("title")} (${locale.toUpperCase()})`, "", `${tGuide("lede")} ${absoluteUrl(guidePath(locale))}`, "", list, "");
  }

  parts.push("## Optional", "", `- [${"Testo completo di articoli e guida / Full text of articles and guide"}](${absoluteUrl("/llms-full.txt")})`, "");
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
