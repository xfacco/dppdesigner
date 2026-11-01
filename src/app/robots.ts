import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Indicizzazione: sito pubblico e guida sì; area riservata, account e progetti dei singoli
 * utenti no. I crawler dei motori di risposta AI sono citati esplicitamente con le stesse regole.
 */
const DISALLOW = ["/admin", "/api/", ...routing.locales.flatMap((l) => [`/${l}/account`, `/${l}/progetta/`])];
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
