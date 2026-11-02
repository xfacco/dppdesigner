/** Sezione "Articoli" (blog): segmento tradotto per lingua, /it/articoli e /en/articles. */
export const BLOG_SEGMENT = { it: "articoli", en: "articles" } as const;
export type BlogLocale = keyof typeof BLOG_SEGMENT;

export const blogSegment = (locale: string) => BLOG_SEGMENT[locale as BlogLocale] ?? BLOG_SEGMENT.it;

/** Percorso (senza dominio) dell'elenco o di un articolo. */
export const blogPath = (locale: string, slug?: string) => `/${locale}/${blogSegment(locale)}${slug ? `/${slug}` : ""}`;

/** Versione Markdown di un articolo, per i modelli linguistici. */
export const blogMarkdownPath = (locale: string, slug: string) => `/md/${locale}/${slug}.md`;

// ─── Campi strutturati scritti dall'admin in testo semplice ───

/** Righe non vuote (punti chiave, profili, …), senza eventuali "-" o "*" iniziali. */
export const lines = (text: string | null | undefined) =>
  (text ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*[-*•]\s+/, "").trim())
    .filter(Boolean);

/** Domande frequenti: blocchi separati da una riga vuota; la prima riga è la domanda, il resto la risposta. */
export function parseFaq(text: string | null | undefined): { question: string; answer: string }[] {
  return (text ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => {
      const [first, ...rest] = block.trim().split("\n");
      return { question: (first ?? "").replace(/^(D|Q|Domanda|Question)\s*[:.]\s*/i, "").trim(), answer: rest.join("\n").replace(/^(R|A|Risposta|Answer)\s*[:.]\s*/i, "").trim() };
    })
    .filter((f) => f.question && f.answer);
}

/** Fonti: una per riga, "Titolo | https://…" (oppure solo l'URL). */
export function parseSources(text: string | null | undefined): { name: string; url: string }[] {
  return lines(text).flatMap((l) => {
    const [a, b] = l.split("|").map((x) => x.trim());
    const url = b ?? a;
    if (!/^https?:\/\//.test(url)) return [];
    return [{ name: b ? a : url.replace(/^https?:\/\/(www\.)?/, ""), url }];
  });
}

/** Ancora per un titolo: minuscole senza accenti, parole separate da trattini. */
export const headingId = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[`*_[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Indice dell'articolo: i titoli "## " del Markdown, con la loro ancora. */
export const tableOfContents = (md: string) =>
  [...md.matchAll(/^##\s+(.+?)\s*#*\s*$/gm)].map((m) => {
    const title = m[1].replace(/[*_`]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    return { title, id: headingId(title) };
  });

/** Parole e minuti di lettura (circa 200 parole al minuto). */
export function readingStats(plain: string) {
  const words = plain.split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
