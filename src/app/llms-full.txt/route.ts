import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { guideMarkdown } from "@/server/guide-markdown";

export const dynamic = "force-dynamic";

/** Testo completo della guida in Markdown, in tutte le lingue, per i modelli linguistici. */
export async function GET() {
  const parts = ["# DPP Designer", ""];
  for (const locale of routing.locales) {
    const t = await getTranslations({ locale, namespace: "guide" });
    const body = await guideMarkdown(locale, true);
    if (body) parts.push(`# ${t("title")} (${locale.toUpperCase()})`, "", t("lede"), "", body, "");
  }
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
