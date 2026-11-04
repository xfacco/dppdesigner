import "server-only";
import { getTranslations } from "next-intl/server";
import { blogPath, lines, parseFaq, parseSources } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-url";
import type { PostView } from "./blog";
import { getSiteSettings } from "./site-settings";

/**
 * Un articolo in Markdown, per i modelli linguistici (/md/… e llms-full.txt):
 * intestazione con i metadati, punti chiave, testo, domande frequenti e fonti.
 */
export async function postMarkdown(locale: string, post: PostView): Promise<string> {
  const [t, s] = await Promise.all([getTranslations({ locale, namespace: "blog" }), getSiteSettings()]);
  const author = post.author || s.defaultAuthor;
  const meta = [
    `title: ${JSON.stringify(post.title)}`,
    post.seoDescription || post.excerpt ? `description: ${JSON.stringify(post.seoDescription || post.excerpt)}` : null,
    `url: ${absoluteUrl(blogPath(locale, post.slug))}`,
    `language: ${locale}`,
    `published: ${post.publishedAt.toISOString().slice(0, 10)}`,
    `updated: ${post.modifiedAt.toISOString().slice(0, 10)}`,
    author ? `author: ${JSON.stringify(author + (post.authorTitle ? `, ${post.authorTitle}` : ""))}` : null,
    post.category ? `category: ${JSON.stringify(post.category)}` : null,
    post.tags.length ? `tags: [${post.tags.map((x) => JSON.stringify(x)).join(", ")}]` : null,
    `publisher: ${JSON.stringify(s.organizationName)}`,
  ].filter(Boolean);

  const out = ["---", ...meta, "---", "", `# ${post.title}`, ""];
  if (post.excerpt) out.push(post.excerpt, "");
  const takeaways = lines(post.keyTakeaways);
  if (takeaways.length) out.push(`## ${t("inBrief")}`, "", ...takeaways.map((k) => `- ${k}`), "");
  out.push(post.body.trim(), "");
  const faq = parseFaq(post.faq);
  if (faq.length) {
    out.push(`## ${t("faq")}`, "");
    for (const f of faq) out.push(`### ${f.question}`, "", f.answer, "");
  }
  const sources = parseSources(post.sources);
  if (sources.length) out.push(`## ${t("sources")}`, "", ...sources.map((c) => `- [${c.name}](${c.url})${c.description ? ` — ${c.description}` : ""}`), "");
  return out.join("\n").trim() + "\n";
}
