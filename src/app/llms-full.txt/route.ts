import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { listPosts } from "@/server/blog";
import { postMarkdown } from "@/server/blog-markdown";
import { pageMarkdown, pillarPages } from "@/server/pages-markdown";
import { guideMarkdown } from "@/server/guide-markdown";

export const dynamic = "force-dynamic";

/** Testo completo di pagine principali, articoli e guida in Markdown, in tutte le lingue, per i modelli linguistici. */
export async function GET() {
  const parts = ["# DPP Designer", ""];
  // Prima le pagine principali, poi articoli e guida
  for (const locale of routing.locales) {
    for (const p of await pillarPages(locale)) {
      const md = await pageMarkdown(locale, p.slug);
      if (md) parts.push(md, "");
    }
  }
  for (const locale of routing.locales) {
    const posts = (await listPosts(locale)).filter((p) => !p.noindex);
    for (const p of posts) parts.push(await postMarkdown(locale, p), "");
  }
  for (const locale of routing.locales) {
    const t = await getTranslations({ locale, namespace: "guide" });
    const body = await guideMarkdown(locale, true);
    if (body) parts.push(`# ${t("title")} (${locale.toUpperCase()})`, "", t("lede"), "", body, "");
  }
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
