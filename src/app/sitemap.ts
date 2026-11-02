import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { blogPath } from "@/lib/blog";
import { guidePath } from "@/lib/guide";
import { absoluteUrl } from "@/lib/site-url";
import { SYSTEM_PAGES } from "@/server/content";
import { getGuide } from "@/server/guide";

export const dynamic = "force-dynamic";

/** Una voce per pagina, con le versioni nelle altre lingue (hreflang). */
const entry = (paths: Record<string, string>, lastModified?: Date, priority?: number): MetadataRoute.Sitemap =>
  Object.values(paths).map((p) => ({
    url: absoluteUrl(p),
    lastModified,
    priority,
    alternates: { languages: Object.fromEntries(Object.entries(paths).map(([l, lp]) => [l, absoluteUrl(lp)])) },
  }));

const perLocale = (fn: (locale: string) => string) => Object.fromEntries(routing.locales.map((l) => [l, fn(l)]));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, guide, posts] = await Promise.all([
    db.page.findMany({
      where: { status: "PUBLISHED", key: { notIn: Object.keys(SYSTEM_PAGES) } },
      include: { translations: true },
    }),
    getGuide(routing.defaultLocale),
    // Esclusi gli articoli noindex e quelli con canonical verso un altro sito
    db.post.findMany({ where: { status: "PUBLISHED", noindex: false, canonicalUrl: null }, include: { translations: true } }),
  ]);

  return [
    ...entry(perLocale((l) => `/${l}`), undefined, 1),
    ...entry(perLocale((l) => `/${l}/progetta`), undefined, 0.9),
    ...pages.flatMap((p) =>
      entry(Object.fromEntries(p.translations.map((t) => [t.locale, `/${t.locale}/${t.slug}`])), p.updatedAt, 0.7),
    ),
    ...entry(perLocale((l) => blogPath(l)), undefined, 0.8),
    ...posts.flatMap((p) =>
      entry(Object.fromEntries(p.translations.map((t) => [t.locale, blogPath(t.locale, t.slug)])), p.updatedAt, 0.7),
    ),
    ...(guide
      ? [
          ...entry(perLocale((l) => guidePath(l)), guide.updatedAt, 0.8),
          ...guide.articles.flatMap((a) => entry(perLocale((l) => guidePath(l, a.slug)), guide.updatedAt, 0.6)),
        ]
      : []),
  ];
}
