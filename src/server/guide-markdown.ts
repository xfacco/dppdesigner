import "server-only";
import { getTranslations } from "next-intl/server";
import { guidePath } from "@/lib/guide";
import { optionDescription } from "@/lib/option-description";
import { absoluteUrl } from "@/lib/site-url";
import { getGuide } from "./guide";

/**
 * La guida in Markdown, per i motori di risposta (llms.txt / llms-full.txt):
 * stessi contenuti delle pagine, senza impaginazione.
 */
export async function guideMarkdown(locale: string, full: boolean): Promise<string | null> {
  const guide = await getGuide(locale);
  if (!guide) return null;
  const t = await getTranslations({ locale, namespace: "guide" });
  const tSections = await getTranslations({ locale, namespace: "diagrams.blueprint.sections" });
  const out: string[] = [];

  for (const s of guide.sections) {
    if (!full) out.push(`### ${tSections.has(s.key) ? tSections(s.key) : s.key}`, "");
    for (const a of s.articles) {
      const url = absoluteUrl(guidePath(locale, a.slug));
      if (!full) {
        const summary = (a.description ?? a.help ?? "").replace(/\s+/g, " ").trim();
        out.push(`- [${a.title}](${url})${summary ? `: ${summary}` : ""}`);
        continue;
      }
      out.push(`## ${a.title}`, "", `URL: ${url}`, "");
      if (a.description) out.push(a.description, "");
      if (a.options.length) {
        out.push(`### ${t("answers")}`, "");
        for (const o of a.options) {
          const desc = o.description ? optionDescription(o.description).replace(/ {2}\n/g, " ").replace(/\n/g, " ") : "";
          out.push(`- **${o.label}**${desc ? `: ${desc}` : ""}`);
        }
        out.push("");
      }
      if (a.notes.length) {
        out.push(`### ${t("notes")}`, "");
        for (const n of a.notes) out.push(`- ${n.mandatory ? `(${t("mandatory")}) ` : ""}${n.message}`);
        out.push("");
      }
      if (a.help) out.push(`### ${t("help")}`, "", a.help, "");
      if (a.references) out.push(`### ${t("references")}`, "", a.references.trim(), "");
    }
    if (!full) out.push("");
  }
  return out.join("\n").trim();
}
