import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { listPosts } from "@/server/blog";
import { postMarkdown } from "@/server/blog-markdown";
import { guideMarkdown } from "@/server/guide-markdown";

export const dynamic = "force-dynamic";

/** Testo completo di articoli e guida in Markdown, in tutte le lingue, per i modelli linguistici. */
export async function GET() {
  const parts = ["# DPP Designer", ""];
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
