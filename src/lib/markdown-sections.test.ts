import { describe, expect, it } from "vitest";
import { splitMarkdown } from "./markdown-sections";

describe("splitMarkdown", () => {
  it("divide titolo, sottotitolo, introduzione e sezioni", () => {
    const md = `# Titolo grande

Primo paragrafo
su due righe.

Testo introduttivo.

## Prima sezione
- punto 1
- punto 2

## Seconda
Testo.`;
    expect(splitMarkdown(md)).toEqual({
      title: "Titolo grande",
      lede: "Primo paragrafo su due righe.",
      intro: "Testo introduttivo.",
      sections: [
        { title: "Prima sezione", body: "- punto 1\n- punto 2" },
        { title: "Seconda", body: "Testo." },
      ],
    });
  });

  it("toglie il Markdown dal sottotitolo", () => {
    expect(splitMarkdown("# T\n\nIl **DPP** e il [registro](https://x.eu) *ESPR*.").lede).toBe("Il DPP e il registro ESPR.");
  });

  it("non usa come sottotitolo un elenco o una tabella", () => {
    const r = splitMarkdown("# T\n\n- voce\n\n## S\nx");
    expect(r.lede).toBeNull();
    expect(r.intro).toBe("- voce");
  });

  it("senza titolo lascia tutto nell'introduzione", () => {
    expect(splitMarkdown("Solo testo\n\naltro")).toEqual({ title: null, lede: null, intro: "Solo testo\n\naltro", sections: [] });
  });
});
