import "server-only";
import { cache } from "react";
import { lines } from "@/lib/blog";
import { db } from "@/lib/db";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

/** URL assoluto da un valore scritto in admin: indirizzo completo oppure percorso del sito. */
export const toAbsolute = (u: string | null | undefined) => (!u ? null : /^https?:\/\//.test(u) ? u : absoluteUrl(u));

/** Impostazioni SEO del sito (Admin → SEO), con i valori predefiniti se non sono ancora state salvate. */
export const getSiteSettings = cache(async () => {
  const s = await db.siteSettings.findUnique({ where: { id: "site" } });
  return {
    organizationName: s?.organizationName || "DPP Designer",
    organizationUrl: s?.organizationUrl || SITE_URL,
    logoUrl: toAbsolute(s?.logoUrl) ?? absoluteUrl("/logo.svg"),
    sameAs: lines(s?.sameAs).filter((u) => /^https?:\/\//.test(u)),
    defaultOgImageUrl: toAbsolute(s?.defaultOgImageUrl),
    twitterHandle: s?.twitterHandle ? `@${s.twitterHandle.replace(/^@/, "")}` : null,
    defaultAuthor: s?.defaultAuthor || null,
    defaultAuthorTitle: s?.defaultAuthorTitle || null,
    defaultAuthorUrl: s?.defaultAuthorUrl || null,
  };
});

export type SiteSettingsView = Awaited<ReturnType<typeof getSiteSettings>>;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const PERSON_ID = `${SITE_URL}/#person`;

/** Organizzazione schema.org: editore del sito e degli articoli; la persona di riferimento è il fondatore. */
export function organizationLd(s: SiteSettingsView) {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: s.organizationName,
    url: s.organizationUrl,
    logo: { "@type": "ImageObject", url: s.logoUrl },
    ...(s.sameAs.length ? { sameAs: s.sameAs } : {}),
    ...(s.defaultAuthor ? { founder: { "@id": PERSON_ID } } : {}),
  };
}

/** Persona di riferimento del sito (autore predefinito in Admin → SEO), o null se non impostata. */
export function personLd(s: SiteSettingsView) {
  if (!s.defaultAuthor) return null;
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: s.defaultAuthor,
    ...(s.defaultAuthorTitle ? { jobTitle: s.defaultAuthorTitle } : {}),
    ...(s.defaultAuthorUrl ? { url: s.defaultAuthorUrl, sameAs: [s.defaultAuthorUrl] } : {}),
    worksFor: { "@id": ORGANIZATION_ID },
  };
}

/** Autore effettivo di un contenuto: quello indicato, altrimenti la persona di riferimento. */
export function resolveAuthor(s: SiteSettingsView, own?: { name?: string | null; title?: string | null; url?: string | null }) {
  const name = own?.name || s.defaultAuthor;
  if (!name) return null;
  // Se è la persona di riferimento, ruolo e profilo mancanti si prendono dalle impostazioni
  const isDefault = name === s.defaultAuthor;
  return {
    name,
    title: own?.title || (isDefault ? s.defaultAuthorTitle : null),
    url: own?.url || (isDefault ? s.defaultAuthorUrl : null),
    isDefault,
  };
}
