import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/** Articoli pubblicati nella lingua richiesta, dal più recente (solo quelli tradotti in quella lingua). */
export const listPosts = cache(async (locale: string) => {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED", translations: { some: { locale } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { translations: true },
  });
  return posts.map((p) => {
    const t = p.translations.find((x) => x.locale === locale)!;
    return {
      id: p.id,
      slug: t.slug,
      title: t.title,
      excerpt: t.excerpt,
      author: p.author,
      publishedAt: p.publishedAt ?? p.createdAt,
      updatedAt: p.updatedAt,
      translations: p.translations.map((x) => ({ locale: x.locale, slug: x.slug })),
    };
  });
});

/** Un articolo pubblicato, con le sue traduzioni (per i link alle altre lingue). */
export const getPost = cache(async (locale: string, slug: string) => {
  const t = await db.postTranslation.findFirst({
    where: { locale, slug, post: { status: "PUBLISHED" } },
    include: { post: { include: { translations: { select: { locale: true, slug: true } } } } },
  });
  if (!t) return null;
  return {
    id: t.post.id,
    slug: t.slug,
    title: t.title,
    excerpt: t.excerpt,
    body: t.body,
    author: t.post.author,
    publishedAt: t.post.publishedAt ?? t.post.createdAt,
    updatedAt: t.post.updatedAt,
    translations: t.post.translations,
  };
});
