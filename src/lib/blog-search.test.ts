import { describe, expect, it } from "vitest";
import { highlight, queryTerms, searchPosts, snippetOf } from "./blog-search";

const post = (title: string, extra: Partial<{ excerpt: string; category: string; tags: string[]; text: string; date: string }> = {}) => ({
  title,
  excerpt: extra.excerpt ?? null,
  category: extra.category ?? null,
  tags: extra.tags ?? [],
  text: extra.text ?? "",
  date: new Date(extra.date ?? "2026-01-01"),
});

describe("ricerca negli articoli", () => {
  const posts = [
    post("Calendario delle categorie di prodotto", { text: "Le batterie industriali arrivano per prime nel 2027.", date: "2026-03-01" }),
    post("Il Regolamento ESPR spiegato", { excerpt: "Cosa cambia per le imprese.", tags: ["ESPR"], date: "2026-02-01" }),
    post("Batterie: cosa serve per il passaporto", { category: "Settori", date: "2026-01-01" }),
  ];

  it("senza ricerca restituisce tutti gli articoli nell'ordine originale", () => {
    expect(searchPosts(posts, "  ").map((r) => r.post.title)).toEqual(posts.map((p) => p.title));
  });

  it("ignora maiuscole e accenti e mette prima i titoli", () => {
    expect(searchPosts(posts, "BATTERIE").map((r) => r.post.title)).toEqual(["Batterie: cosa serve per il passaporto", "Calendario delle categorie di prodotto"]);
    expect(searchPosts([post("Perché il DPP")], "perche")).toHaveLength(1);
  });

  it("richiede tutte le parole", () => {
    expect(searchPosts(posts, "batterie 2027").map((r) => r.post.title)).toEqual(["Calendario delle categorie di prodotto"]);
    expect(searchPosts(posts, "batterie tessile")).toEqual([]);
  });

  it("mostra un estratto solo quando la parola è nel testo", () => {
    const [cal] = searchPosts(posts, "industriali");
    expect(cal.snippet).toContain("batterie industriali");
    expect(searchPosts(posts, "espr")[0].snippet).toBeNull();
  });

  it("parole della ricerca senza doppioni né lettere singole", () => {
    expect(queryTerms("Il DPP, il dpp e l'ESPR")).toEqual(["il", "dpp", "espr"]);
  });

  it("estratto tagliato a parole intere", () => {
    const text = `${"parola ".repeat(30)}obiettivo ${"altro ".repeat(30)}`.trim();
    const s = snippetOf(text, ["obiettivo"], 30)!;
    expect(s.startsWith("…parola")).toBe(true);
    expect(s.endsWith("altro…")).toBe(true);
  });

  it("evidenzia le parole trovate anche con accenti", () => {
    expect(highlight("Perché il DPP", ["perche", "dpp"])).toEqual([
      { text: "Perché", match: true },
      { text: " il ", match: false },
      { text: "DPP", match: true },
    ]);
  });
});
