import "server-only";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site-url";
import { SYSTEM_PAGES } from "./content";
import { getSiteSettings, resolveAuthor } from "./site-settings";

/** Pagine principali da offrire ai motori AI: quelle del menu, tranne i contatti. */
const EXCLUDED = ["contacts"];

/** Pagine principali pubblicate in una lingua, nell'ordine del menu. */
export async function pillarPages(locale: string) {
  const pages = await db.page.findMany({
    where: { status: "PUBLISHED", showInMenu: true, key: { notIn: [...Object.keys(SYSTEM_PAGES), ...EXCLUDED] } },
    orderBy: { position: "asc" },
    include: { translations: { where: { locale } } },
  });
  return pages.flatMap((p) => (p.translations[0] ? [{ key: p.key, updatedAt: p.updatedAt, ...p.translations[0] }] : []));
}

export const pageMarkdownPath = (locale: string, slug: string) => `/md/${locale}/${slug}.md`;

/** Una pagina pubblicata in Markdown, con intestazione dei metadati (per /md/… e llms-full.txt). */
export async function pageMarkdown(locale: string, slug: string): Promise<string | null> {
  const t = await db.pageTranslation.findFirst({
    where: { locale, slug, page: { status: "PUBLISHED", key: { notIn: Object.keys(SYSTEM_PAGES) } } },
    include: { page: true },
  });
  if (!t) return null;
  const [s, tb] = await Promise.all([getSiteSettings(), getTranslations({ locale, namespace: "byline" })]);
  const author = t.page.key === "about" ? null : resolveAuthor(s);
  const meta = [
    `title: ${JSON.stringify(t.title)}`,
    t.description ? `description: ${JSON.stringify(t.description)}` : null,
    `url: ${absoluteUrl(`/${locale}/${t.slug}`)}`,
    `language: ${locale}`,
    `updated: ${t.page.updatedAt.toISOString().slice(0, 10)}`,
    author ? `author: ${JSON.stringify(author.name + (author.title ? `, ${author.title}` : ""))}` : null,
    `publisher: ${JSON.stringify(s.organizationName)}`,
  ].filter(Boolean);
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(t.page.updatedAt);
  const byline = [tb("updated", { date: updated }), author ? `${tb("by")} ${author.name}${author.title ? `, ${author.title}` : ""}` : null].filter(Boolean).join(" · ");
  const body = t.body.trim().startsWith("# ") ? t.body.trim() : `# ${t.title}\n\n${t.body.trim()}`;
  // Il titolo resta in testa, la riga di aggiornamento e autore subito sotto
  const [first, ...rest] = body.split("\n");
  return ["---", ...meta, "---", "", first, "", `*${byline}*`, ...rest].join("\n").trim() + "\n";
}
