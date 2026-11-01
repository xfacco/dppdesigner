import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { guidePath } from "@/lib/guide";
import { absoluteUrl } from "@/lib/site-url";
import { guideMarkdown } from "@/server/guide-markdown";

export const dynamic = "force-dynamic";

/** Indice del sito per i modelli linguistici (formato llms.txt): la guida con un link per domanda. */
export async function GET() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "footer" });
  const parts = [`# DPP Designer`, "", `> ${t("about")}`, ""];

  for (const locale of routing.locales) {
    const tGuide = await getTranslations({ locale, namespace: "guide" });
    const list = await guideMarkdown(locale, false);
    if (!list) continue;
    parts.push(`## ${tGuide("title")} (${locale.toUpperCase()})`, "", `${tGuide("lede")} ${absoluteUrl(guidePath(locale))}`, "", list, "");
  }

  parts.push("## Optional", "", `- [${"Testo completo della guida / Full guide text"}](${absoluteUrl("/llms-full.txt")})`, "");
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
