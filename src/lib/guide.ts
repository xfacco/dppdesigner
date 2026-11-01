/**
 * Sezione "Guida": le domande del wizard pubblicato, una per pagina.
 * Qui solo funzioni pure (percorsi, testo semplice per meta e dati strutturati), testate a parte.
 */

/** Segmento della sezione per lingua: /it/guida, /en/guide. */
export const GUIDE_SEGMENT = { it: "guida", en: "guide" } as const;
export type GuideLocale = keyof typeof GUIDE_SEGMENT;

export const guideSegment = (locale: string) => GUIDE_SEGMENT[locale as GuideLocale] ?? GUIDE_SEGMENT.it;

/** Lo slug dell'articolo è la chiave dello step, con i trattini: stabile anche se il titolo cambia. */
export const articleSlug = (stepKey: string) => stepKey.replace(/_/g, "-");
export const stepKeyFromSlug = (slug: string) => slug.replace(/-/g, "_");

/** Percorso (senza dominio) dell'indice o di un articolo. */
export const guidePath = (locale: string, slug?: string) => `/${locale}/${guideSegment(locale)}${slug ? `/${slug}` : ""}`;

/** Markdown → testo semplice su una riga: per meta description, dati strutturati e llms.txt. */
export function plainText(md: string | null | undefined): string {
  if (!md) return "";
  return md
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Taglia un testo alla parola, entro `max` caratteri, aggiungendo "…". */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  // Se il taglio cade già a fine parola si tiene tutto, altrimenti si torna all'ultimo spazio
  const end = text[max - 1] === " " ? cut.length : Math.max(cut.lastIndexOf(" "), Math.floor(max * 0.6));
  return `${cut.slice(0, end).trimEnd()}…`;
}

/** Link esterni citati in un testo Markdown, senza doppioni: le fonti dell'articolo. */
export function markdownLinks(md: string | null | undefined): { name: string; url: string }[] {
  if (!md) return [];
  const seen = new Set<string>();
  const out: { name: string; url: string }[] = [];
  for (const m of md.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    out.push({ name: m[1], url: m[2] });
  }
  return out;
}
