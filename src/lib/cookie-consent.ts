/**
 * Consenso ai cookie: categorie, elenco dei cookie del sito e lettura/scrittura della scelta.
 * L'elenco è la fonte unica per il banner, le preferenze e la tabella nella Cookie policy:
 * quando si aggiunge un servizio (es. statistiche), va aggiunto qui nella sua categoria.
 */

export const CONSENT_COOKIE = "dpp_consent";
/** Da aumentare quando cambiano categorie o servizi: il banner viene riproposto. */
export const CONSENT_VERSION = 2;
/** La scelta vale 6 mesi (linee guida del Garante privacy), poi il banner ricompare. */
export const CONSENT_MAX_AGE_DAYS = 180;

/** Google Analytics 4: caricato solo con il consenso alle statistiche. */
export const GA_MEASUREMENT_ID = "G-ZDF1ST8JK4";

export const OPTIONAL_CATEGORIES = ["analytics", "marketing"] as const;
export type OptionalCategory = (typeof OPTIONAL_CATEGORIES)[number];
export type CookieCategory = "necessary" | OptionalCategory;

export type Consent = { v: number; at: string } & Record<OptionalCategory, boolean>;

type T = { it: string; en: string };
export type CookieItem = { name: string; category: CookieCategory; storage: "cookie" | "localStorage"; provider: string; purpose: T; duration: T };

export const COOKIES: CookieItem[] = [
  {
    name: "__Secure-better-auth.session_token",
    category: "necessary",
    storage: "cookie",
    provider: "DPP Designer",
    purpose: { it: "Mantiene l'accesso all'account dopo il login.", en: "Keeps you signed in to your account." },
    duration: { it: "7 giorni", en: "7 days" },
  },
  {
    name: "dpp_journey",
    category: "necessary",
    storage: "cookie",
    provider: "DPP Designer",
    purpose: {
      it: "Permette di riprendere il progetto DPP dallo stesso browser senza registrarsi.",
      en: "Lets you resume your DPP project from the same browser without signing up.",
    },
    duration: { it: "30 giorni", en: "30 days" },
  },
  {
    name: "NEXT_LOCALE",
    category: "necessary",
    storage: "cookie",
    provider: "DPP Designer",
    purpose: { it: "Ricorda la lingua scelta (italiano o inglese).", en: "Remembers your language (Italian or English)." },
    duration: { it: "1 anno", en: "1 year" },
  },
  {
    name: CONSENT_COOKIE,
    category: "necessary",
    storage: "cookie",
    provider: "DPP Designer",
    purpose: { it: "Registra le tue scelte sui cookie.", en: "Stores your cookie choices." },
    duration: { it: "6 mesi", en: "6 months" },
  },
  {
    name: "theme",
    category: "necessary",
    storage: "localStorage",
    provider: "DPP Designer",
    purpose: { it: "Ricorda il tema chiaro o scuro scelto.", en: "Remembers the light or dark theme you chose." },
    duration: { it: "Fino alla cancellazione dal browser", en: "Until cleared from the browser" },
  },
  {
    name: "_ga",
    category: "analytics",
    storage: "cookie",
    provider: "Google Analytics (Google Ireland Ltd)",
    purpose: {
      it: "Distingue i visitatori in forma anonima per le statistiche di utilizzo del sito.",
      en: "Distinguishes visitors anonymously for site usage statistics.",
    },
    duration: { it: "2 anni", en: "2 years" },
  },
  {
    name: `_ga_${GA_MEASUREMENT_ID.slice(2)}`,
    category: "analytics",
    storage: "cookie",
    provider: "Google Analytics (Google Ireland Ltd)",
    purpose: { it: "Mantiene lo stato della sessione per le statistiche.", en: "Keeps the session state for statistics." },
    duration: { it: "2 anni", en: "2 years" },
  },
];

export const cookiesIn = (category: CookieCategory) => COOKIES.filter((c) => c.category === category);

/** Legge la scelta dal cookie; null se manca, è illeggibile o di una versione precedente. */
export function parseConsent(cookieHeader: string | null | undefined): Consent | null {
  const raw = (cookieHeader ?? "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    if (c.v !== CONSENT_VERSION) return null;
    return { v: CONSENT_VERSION, at: String(c.at ?? ""), analytics: c.analytics === true, marketing: c.marketing === true };
  } catch {
    return null;
  }
}

export function serializeConsent(choice: Record<OptionalCategory, boolean>, secure: boolean): string {
  const value: Consent = { v: CONSENT_VERSION, at: new Date().toISOString(), ...choice };
  return [
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}`,
    "Path=/",
    `Max-Age=${CONSENT_MAX_AGE_DAYS * 24 * 3600}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

/** Evento per riaprire le preferenze (dal footer o dalla Cookie policy). */
export const OPEN_PREFERENCES_EVENT = "open-cookie-preferences";
/** Evento emesso a ogni scelta salvata: script facoltativi (es. statistiche) possono attivarsi qui. */
export const CONSENT_CHANGED_EVENT = "cookie-consent-changed";
