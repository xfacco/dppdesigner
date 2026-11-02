import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { blogPath } from "@/lib/blog";
import { guidePath } from "@/lib/guide";
import { absoluteUrl } from "@/lib/site-url";
import { listPosts } from "@/server/blog";
import { guideMarkdown } from "@/server/guide-markdown";

export const dynamic = "force-dynamic";

/** Indice del sito per i modelli linguistici (formato llms.txt): articoli e guida, con un link per pagina. */
export async function GET() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "footer" });
  const parts = [`# DPP Designer`, "", `> ${t("about")}`, ""];

  // Articoli del blog, per lingua
  for (const locale of routing.locales) {
    const posts = await listPosts(locale);
    if (!posts.length) continue;
    const tBlog = await getTranslations({ locale, namespace: "blog" });
    parts.push(`## ${tBlog("title")} (${locale.toUpperCase()})`, "", `${tBlog("lede")} ${absoluteUrl(blogPath(locale))}`, "");
    for (const p of posts) parts.push(`- [${p.title}](${absoluteUrl(blogPath(locale, p.slug))})${p.excerpt ? `: ${p.excerpt}` : ""}`);
    parts.push("");
  }

  for (const locale of routing.locales) {
    const tGuide = await getTranslations({ locale, namespace: "guide" });
    const list = await guideMarkdown(locale, false);
    if (!list) continue;
    parts.push(`## ${tGuide("title")} (${locale.toUpperCase()})`, "", `${tGuide("lede")} ${absoluteUrl(guidePath(locale))}`, "", list, "");
  }

  parts.push("## Optional", "", `- [${"Testo completo della guida / Full guide text"}](${absoluteUrl("/llms-full.txt")})`, "");
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
