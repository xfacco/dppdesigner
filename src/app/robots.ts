import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Indicizzazione: sito pubblico e guida sì; area riservata, account e progetti dei singoli
 * utenti no. I crawler AI (addestramento e risposte in tempo reale) sono citati esplicitamente con le
 * stesse regole: i contenuti pubblici devono poter essere letti, citati e usati dai modelli.
 */
const DISALLOW = ["/admin", "/api/", ...routing.locales.flatMap((l) => [`/${l}/account`, `/${l}/progetta/`])];
const AI_BOTS = [
  // OpenAI: addestramento, ricerca in ChatGPT, letture su richiesta dell'utente
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic (Claude)
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Google Gemini / Vertex AI (addestramento e risposte), Apple Intelligence
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  // Motori di risposta e altri modelli
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
