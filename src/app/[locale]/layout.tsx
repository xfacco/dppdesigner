import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { JsonLd } from "@/components/guide/json-ld";
import { CookieConsent } from "@/components/site/cookie-consent";
import { THEME_SCRIPT } from "@/components/site/theme-toggle";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site-url";
import { getPageByKey } from "@/server/content";
import { getSiteSettings, organizationLd } from "@/server/site-settings";
import { inter } from "../fonts";
import "../globals.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [t, s] = await Promise.all([getTranslations({ locale, namespace: "meta" }), getSiteSettings()]);
  return {
    title: { default: `${t("siteName")} — ${t("tagline")}`, template: `%s — ${t("siteName")}` },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    // Valori predefiniti per la condivisione (Admin → SEO); le pagine possono sovrascriverli
    openGraph: { siteName: s.organizationName, ...(s.defaultOgImageUrl ? { images: [s.defaultOgImageUrl] } : {}) },
    twitter: { ...(s.twitterHandle ? { site: s.twitterHandle } : {}), ...(s.defaultOgImageUrl ? { card: "summary_large_image" } : {}) },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [settings, cookiePage] = await Promise.all([getSiteSettings(), getPageByKey(locale, "cookies")]);
  // Organizzazione e sito su ogni pagina: le pagine collegano articoli e guida a questi @id
  const siteLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd(settings),
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: settings.organizationName,
        inLanguage: routing.locales,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Applica il tema scelto prima del primo disegno */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <JsonLd data={siteLd} />
          <SiteHeader locale={locale} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
          <CookieConsent policyHref={cookiePage ? `/${cookiePage.slug}` : null} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
