/** Indirizzo pubblico del sito, per URL assoluti (sitemap, canonical, dati strutturati, llms.txt). */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
