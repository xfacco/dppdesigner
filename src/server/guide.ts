import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { resolveDiagramConfig } from "@/lib/diagrams/config";
import { articleSlug } from "@/lib/guide";
import { pickTranslation } from "./wizard";

/**
 * Articoli della guida: uno per domanda della versione pubblicata del wizard, con i soli
 * contenuti già presenti (titolo, descrizione, aiuto, riferimenti, opzioni, indicazioni).
 * Gli articoli sono raggruppati per area, come nel Blueprint del riepilogo.
 */
export type GuideArticle = {
  key: string;
  slug: string;
  number: number;
  type: string;
  title: string;
  description: string | null;
  help: string | null;
  references: string | null;
  options: { key: string; label: string; description: string | null }[];
  notes: { message: string; mandatory: boolean }[];
  section: string;
};

export type Guide = {
  versionNumber: number;
  updatedAt: Date;
  articles: GuideArticle[];
  sections: { key: string; articles: GuideArticle[] }[];
};

export const getGuide = cache(async (locale: string): Promise<Guide | null> => {
  const version = await db.wizardVersion.findFirst({
    where: { status: "PUBLISHED" },
    include: {
      steps: {
        orderBy: { position: "asc" },
        include: {
          translations: true,
          options: { orderBy: { position: "asc" }, include: { translations: true } },
          suggestions: { orderBy: { priority: "desc" }, include: { translations: true } },
        },
      },
    },
  });
  if (!version) return null;

  const cfg = resolveDiagramConfig(version.diagramConfig);
  const sectionOf = (key: string) => cfg.blueprint.sections.find((s) => s.steps.includes(key))?.key ?? "other";

  const articles: GuideArticle[] = version.steps.map((s, i) => {
    const t = pickTranslation(s.translations, locale);
    // Le indicazioni sono testi a sé: ne teniamo una per testo, quelle obbligatorie per prime
    const notes = new Map<string, boolean>();
    for (const sg of s.suggestions) {
      const message = pickTranslation(sg.translations, locale)?.message?.trim();
      if (message) notes.set(message, (notes.get(message) ?? false) || sg.mandatory);
    }
    return {
      key: s.key,
      slug: articleSlug(s.key),
      number: i + 1,
      type: s.type,
      title: t?.title ?? s.key,
      description: t?.description || null,
      help: t?.help || null,
      references: t?.references || null,
      options: s.options.map((o) => {
        const ot = pickTranslation(o.translations, locale);
        return { key: o.key, label: ot?.label ?? o.key, description: ot?.description || null };
      }),
      notes: [...notes].map(([message, mandatory]) => ({ message, mandatory })).sort((a, b) => Number(b.mandatory) - Number(a.mandatory)),
      section: sectionOf(s.key),
    };
  });

  const order = [...cfg.blueprint.sections.map((s) => s.key), "other"];
  const sections = order
    .map((key) => ({ key, articles: articles.filter((a) => a.section === key) }))
    .filter((s) => s.articles.length > 0);

  return {
    versionNumber: version.number,
    updatedAt: version.publishedAt ?? version.createdAt,
    articles,
    sections,
  };
});
