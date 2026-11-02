/** Sezione "Articoli" (blog): segmento tradotto per lingua, /it/articoli e /en/articles. */
export const BLOG_SEGMENT = { it: "articoli", en: "articles" } as const;
export type BlogLocale = keyof typeof BLOG_SEGMENT;

export const blogSegment = (locale: string) => BLOG_SEGMENT[locale as BlogLocale] ?? BLOG_SEGMENT.it;

/** Percorso (senza dominio) dell'elenco o di un articolo. */
export const blogPath = (locale: string, slug?: string) => `/${locale}/${blogSegment(locale)}${slug ? `/${slug}` : ""}`;
