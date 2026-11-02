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
  };
});

export type SiteSettingsView = Awaited<ReturnType<typeof getSiteSettings>>;

/** Organizzazione schema.org: editore del sito e degli articoli. */
export function organizationLd(s: SiteSettingsView) {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: s.organizationName,
    url: s.organizationUrl,
    logo: { "@type": "ImageObject", url: s.logoUrl },
    ...(s.sameAs.length ? { sameAs: s.sameAs } : {}),
  };
}
