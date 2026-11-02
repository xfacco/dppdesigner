import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type PostWithTranslations = Prisma.PostGetPayload<{ include: { translations: true } }>;

/** Vista di un articolo in una lingua: campi comuni + traduzione, con le date già risolte. */
function view(p: PostWithTranslations, locale: string) {
  const t = p.translations.find((x) => x.locale === locale)!;
  return {
    id: p.id,
    slug: t.slug,
    title: t.title,
    excerpt: t.excerpt,
    body: t.body,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    coverImageAlt: t.coverImageAlt,
    keyTakeaways: t.keyTakeaways,
    faq: t.faq,
    sources: t.sources,
    author: p.author,
    authorTitle: p.authorTitle,
    authorUrl: p.authorUrl,
    coverImageUrl: p.coverImageUrl,
    category: p.category,
    tags: p.tags,
    noindex: p.noindex,
    canonicalUrl: p.canonicalUrl,
    stepKeys: p.stepKeys,
    publishedAt: p.publishedAt ?? p.createdAt,
    // Data di revisione dei contenuti, altrimenti l'ultimo salvataggio
    modifiedAt: p.reviewedAt ?? p.updatedAt,
    translations: p.translations.map((x) => ({ locale: x.locale, slug: x.slug })),
  };
}

export type PostView = ReturnType<typeof view>;

const ORDER = [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];

/** Articoli pubblicati nella lingua richiesta, dal più recente (solo quelli tradotti in quella lingua). */
export const listPosts = cache(async (locale: string) => {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED", translations: { some: { locale } } },
    orderBy: ORDER,
    include: { translations: true },
  });
  return posts.map((p) => view(p, locale));
});

/** Un articolo pubblicato, con le sue traduzioni (per i link alle altre lingue). */
export const getPost = cache(async (locale: string, slug: string) => {
  const p = await db.post.findFirst({
    where: { status: "PUBLISHED", translations: { some: { locale, slug } } },
    include: { translations: true },
  });
  return p ? view(p, locale) : null;
});

/** Articoli correlati: stessi tag o stessa categoria, poi i più recenti; al massimo `limit`, esclusi i noindex. */
export async function relatedPosts(locale: string, post: PostView, limit = 3) {
  const all = await listPosts(locale);
  const score = (p: PostView) => p.tags.filter((t) => post.tags.includes(t)).length * 2 + (post.category && p.category === post.category ? 1 : 0);
  return all
    .filter((p) => p.id !== post.id && !p.noindex)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.publishedAt.getTime() - a.p.publishedAt.getTime())
    .slice(0, limit)
    .map((x) => x.p);
}

/** Articoli pubblicati, nella lingua richiesta, collegati a uno step del wizard (approfondimenti). */
export const postsForStep = cache(async (locale: string, stepKey: string) => {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED", stepKeys: { has: stepKey }, translations: { some: { locale } } },
    orderBy: ORDER,
    include: { translations: true },
  });
  return posts.map((p) => view(p, locale));
});
