import { describe, expect, it } from "vitest";
import { blogPath, headingId, lines, parseFaq, parseSources, readingStats, tableOfContents } from "./blog";

describe("articoli", () => {
  it("percorsi tradotti", () => {
    expect(blogPath("it", "x")).toBe("/it/articoli/x");
    expect(blogPath("en")).toBe("/en/articles");
  });

  it("righe senza elenco puntato", () => {
    expect(lines("- uno\n\n* due\ntre ")).toEqual(["uno", "due", "tre"]);
  });

  it("domande frequenti a blocchi", () => {
    expect(parseFaq("Cos'è il DPP?\nUn passaporto digitale.\n\nD: Quando?\nR: Dal 2027.\n\nSenza risposta")).toEqual([
      { question: "Cos'è il DPP?", answer: "Un passaporto digitale." },
      { question: "Quando?", answer: "Dal 2027." },
    ]);
  });

  it("fonti con o senza titolo, solo URL validi", () => {
    expect(parseSources("ESPR | https://eur-lex.europa.eu/x\nhttps://www.gs1.org/dl\nsenza link")).toEqual([
      { name: "ESPR", url: "https://eur-lex.europa.eu/x" },
      { name: "gs1.org/dl", url: "https://www.gs1.org/dl" },
    ]);
  });

  it("indice dai titoli ## con ancore stabili", () => {
    expect(headingId("Perché il **DPP** è utile?")).toBe("perche-il-dpp-e-utile");
    expect(tableOfContents("# T\n## Primo punto\ntesto\n### sotto\n## [Link](x) finale")).toEqual([
      { title: "Primo punto", id: "primo-punto" },
      { title: "Link finale", id: "link-finale" },
    ]);
  });

  it("tempo di lettura", () => {
    expect(readingStats("parola ".repeat(450))).toEqual({ words: 450, minutes: 2 });
  });
});
