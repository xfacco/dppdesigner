/** Descrizione di un'opzione: Markdown in cui ogni a capo (o <br> scritto dall'admin) resta un a capo. */
export const optionDescription = (text: string) =>
  text
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((l) => l.trim())
    .join("  \n");
