/**
 * Ricerca negli articoli: ogni parola cercata deve comparire nell'articolo (titolo, sommario,
 * categoria, tag o testo), senza distinguere maiuscole e accenti. I risultati sono ordinati per
 * pertinenza (prima i titoli, poi tag e categoria, sommario e testo) e, a parità, dal più recente.
 */

export type Searchable = { title: string; excerpt: string | null; category: string | null; tags: string[]; text: string; date: Date };

/** Minuscole, senza accenti né apostrofi tipografici: "Perché" e "perche" sono la stessa parola. */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .toLowerCase();

/** Parole della ricerca, senza doppioni né parole di una lettera. */
export const queryTerms = (q: string) => [...new Set(normalize(q).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1))];

const WEIGHTS = { title: 8, tags: 4, category: 4, excerpt: 2, text: 1 } as const;

export function searchPosts<T extends Searchable>(posts: T[], q: string): { post: T; snippet: string | null }[] {
  const terms = queryTerms(q);
  if (terms.length === 0) return posts.map((post) => ({ post, snippet: null }));
  return posts
    .map((post) => {
      const fields = {
        title: normalize(post.title),
        tags: normalize(post.tags.join(" ")),
        category: normalize(post.category ?? ""),
        excerpt: normalize(post.excerpt ?? ""),
        text: normalize(post.text),
      };
      let score = 0;
      for (const term of terms) {
        let found = 0;
        for (const [k, v] of Object.entries(fields) as [keyof typeof WEIGHTS, string][]) if (v.includes(term)) found += WEIGHTS[k];
        if (!found) return null;
        score += found;
      }
      // Estratto del testo solo se titolo e sommario non spiegano già perché l'articolo compare
      const visible = `${fields.title} ${fields.excerpt}`;
      const snippet = terms.some((t) => !visible.includes(t)) ? snippetOf(post.text, terms) : null;
      return { post, snippet, score };
    })
    .filter((r) => r !== null)
    .sort((a, b) => b.score - a.score || b.post.date.getTime() - a.post.date.getTime())
    .map(({ post, snippet }) => ({ post, snippet }));
}

/** Frase del testo intorno alla prima parola trovata, tagliata a parole intere. */
export function snippetOf(text: string, terms: string[], radius = 90): string | null {
  const n = normalize(text);
  const at = terms.map((t) => n.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at === undefined) return null;
  // normalize() non cambia la lunghezza per i caratteri latini comuni: gli indici valgono anche sul testo originale
  let start = Math.max(0, at - radius);
  let end = Math.min(text.length, at + radius);
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  if (end < text.length) end = text.lastIndexOf(" ", end) > at ? text.lastIndexOf(" ", end) : end;
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/** Divide un testo in parti normali ed evidenziate, per mostrare in grassetto le parole cercate. */
export function highlight(text: string, terms: string[]): { text: string; match: boolean }[] {
  if (terms.length === 0) return [{ text, match: false }];
  const n = normalize(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const t of terms) for (let i = n.indexOf(t); i >= 0; i = n.indexOf(t, i + t.length)) marks.fill(true, i, i + t.length);
  const parts: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.match === marks[i]) last.text += text[i];
    else parts.push({ text: text[i], match: marks[i] });
  }
  return parts;
}
