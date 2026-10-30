import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { routing } from "@/i18n/routing";

/** Slug che non possono essere usati dalle pagine perché occupati da route applicative. */
export const RESERVED_SLUGS = ["progetta", "readiness", "login", "register", "forgot-password", "reset-password", "account", "api", "admin"];

/**
 * Pagine di sistema: il loro testo si modifica da Admin → Contenuti, ma sono servite
 * su un percorso fisso (non sul loro slug) e non si possono eliminare.
 */
export const SYSTEM_PAGES: Record<string, { path: string; label: string }> = {
  home: { path: "", label: "Home" },
  wizard_intro: { path: "/progetta", label: "Introduzione di Progetta" },
};
const SYSTEM_KEYS = Object.keys(SYSTEM_PAGES);

export const getMenu = cache(async (locale: string) => {
  const pages = await db.page.findMany({
    where: { status: "PUBLISHED", showInMenu: true, key: { notIn: SYSTEM_KEYS } },
    orderBy: { position: "asc" },
    include: { translations: { where: { locale } } },
  });
  return pages.flatMap((p) => (p.translations[0] ? [{ key: p.key, slug: p.translations[0].slug, title: p.translations[0].title }] : []));
});

export const getPageBySlug = cache(async (locale: string, slug: string) => {
  return db.pageTranslation.findFirst({
    where: { locale, slug, page: { status: "PUBLISHED", key: { notIn: SYSTEM_KEYS } } },
    include: { page: { include: { translations: true } } },
  });
});

export const getPageByKey = cache(async (locale: string, key: string) => {
  return db.pageTranslation.findFirst({
    where: { locale, page: { key, status: "PUBLISHED" } },
    include: { page: { include: { translations: true } } },
  });
});

/** Percorso equivalente nell'altra lingua (gli slug delle pagine sono tradotti). */
export async function translatePath(path: string, to: string): Promise<string> {
  const [, from, first, ...rest] = path.split("/");
  if (!routing.locales.includes(from as never) || !first) return `/${to}`;
  if (RESERVED_SLUGS.includes(first)) return ["", to, first, ...rest].join("/");

  const page = await db.pageTranslation.findFirst({
    where: { locale: from, slug: first },
    include: { page: { include: { translations: { where: { locale: to } } } } },
  });
  const target = page?.page.translations[0]?.slug;
  return target ? `/${to}/${target}` : `/${to}`;
}
