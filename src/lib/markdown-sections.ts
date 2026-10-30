/**
 * Divide il Markdown di una pagina in parti per l'impaginazione:
 *   # Titolo            → title
 *   primo paragrafo     → lede (sottotitolo)
 *   testo successivo    → intro (prima del primo ##)
 *   ## Sezione …        → sections (titolo a sinistra, testo a destra)
 * Se il testo non ha questa forma, finisce tutto in intro e la pagina resta leggibile.
 */
export type MarkdownSections = {
  title: string | null;
  lede: string | null;
  intro: string;
  sections: { title: string; body: string }[];
};

const isBlockStart = (l: string) => /^(\s*[-*+]\s|\s*\d+\.\s|\||>|#)/.test(l);

export function splitMarkdown(md: string): MarkdownSections {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  const skipBlank = () => {
    while (i < lines.length && !lines[i].trim()) i++;
  };

  skipBlank();
  let title: string | null = null;
  if (lines[i]?.startsWith("# ")) {
    title = lines[i].slice(2).trim();
    i++;
  }

  skipBlank();
  let lede: string | null = null;
  if (title && i < lines.length && !isBlockStart(lines[i])) {
    const para: string[] = [];
    while (i < lines.length && lines[i].trim()) para.push(lines[i++]);
    // Il sottotitolo è testo semplice: via grassetto, corsivo e link Markdown
    lede = para
      .join(" ")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/\[(.+?)\]\([^)]+\)/g, "$1")
      .trim();
  }

  const intro: string[] = [];
  const sections: { title: string; body: string[] }[] = [];
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("## ")) sections.push({ title: l.slice(3).trim(), body: [] });
    else if (sections.length) sections[sections.length - 1].body.push(l);
    else intro.push(l);
  }

  return {
    title,
    lede,
    intro: intro.join("\n").trim(),
    sections: sections.map((s) => ({ title: s.title, body: s.body.join("\n").trim() })),
  };
}
