import { describe, expect, it } from "vitest";
import { articleSlug, guidePath, markdownLinks, plainText, stepKeyFromSlug, truncate } from "./guide";

describe("guida", () => {
  it("slug e chiave dello step sono reversibili", () => {
    expect(articleSlug("url_scheme")).toBe("url-scheme");
    expect(stepKeyFromSlug("url-scheme")).toBe("url_scheme");
  });

  it("percorsi tradotti per lingua", () => {
    expect(guidePath("it")).toBe("/it/guida");
    expect(guidePath("en", "url-scheme")).toBe("/en/guide/url-scheme");
  });

  it("toglie il Markdown dal testo", () => {
    expect(plainText("**Batterie**: [Reg. (UE) 2023/1542](https://eur-lex.europa.eu/x), art. 77.<br>Es.: `https://id.brand.com`")).toBe(
      "Batterie: Reg. (UE) 2023/1542, art. 77. Es.: https://id.brand.com",
    );
    expect(plainText("- uno\n- due")).toBe("uno due");
  });

  it("taglia alla parola", () => {
    expect(truncate("uno due tre quattro", 12)).toBe("uno due tre…");
    expect(truncate("breve", 12)).toBe("breve");
  });

  it("raccoglie i link esterni senza doppioni", () => {
    expect(markdownLinks("[A](https://a.eu) e [B](https://b.eu), ancora [A](https://a.eu) e [interno](/it/x)")).toEqual([
      { name: "A", url: "https://a.eu" },
      { name: "B", url: "https://b.eu" },
    ]);
  });
});
