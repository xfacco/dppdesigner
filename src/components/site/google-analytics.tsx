"use client";

import { useEffect } from "react";
import { CONSENT_CHANGED_EVENT, GA_MEASUREMENT_ID, parseConsent, type OptionalCategory } from "@/lib/cookie-consent";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** Carica gtag.js una volta sola. Le pagine successive le registra GA4 da solo (misurazione avanzata). */
function load() {
  if (window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js vuole l'oggetto arguments, non un array
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

/** Consenso revocato: niente più invii e via i cookie _ga già scritti (stanno sul dominio principale). */
function unload() {
  window.gtag?.("consent", "update", { analytics_storage: "denied" });
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  for (const name of document.cookie.split(";").map((c) => c.trim().split("=")[0])) {
    if (!name.startsWith("_ga")) continue;
    for (const d of domains) document.cookie = `${name}=; Path=/; Max-Age=0${d ? `; Domain=${d}` : ""}`;
  }
}

/** Google Analytics 4, attivo solo con il consenso alle statistiche (banner dei cookie). */
export function GoogleAnalytics() {
  useEffect(() => {
    if (parseConsent(document.cookie)?.analytics) load();
    const onChange = (e: Event) => ((e as CustomEvent<Record<OptionalCategory, boolean>>).detail.analytics ? load() : unload());
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);
  return null;
}
