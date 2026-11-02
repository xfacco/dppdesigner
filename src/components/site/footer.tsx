import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogSegment } from "@/lib/blog";
import { guideSegment } from "@/lib/guide";
import { getMenu, getPageByKey } from "@/server/content";
import { LocaleSwitch } from "./locale-switch";
import { Logo } from "./logo";

export async function SiteFooter({ locale }: { locale: string }) {
  const [t, tNav, tGuide, menu, privacy] = await Promise.all([
    getTranslations("footer"),
    getTranslations("nav"),
    getTranslations("guide"),
    getMenu(locale),
    getPageByKey(locale, "privacy"),
  ]);
  const link = "text-[13px] leading-snug text-muted-foreground transition-colors hover:text-foreground";
  // "Chi sono" e "Contatti" stanno sotto Informazioni; le altre pagine del menu sotto Sito
  const INFO_KEYS = ["about", "contacts"];
  const infoPages = INFO_KEYS.flatMap((k) => menu.filter((m) => m.key === k));

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-[min(calc(100%-40px),1200px)] sm:w-[min(calc(100%-80px),1200px)]">
        <div className="grid gap-8 py-12 sm:grid-cols-2 md:grid-cols-[1fr_220px_160px]">
          <div className="grid content-start gap-4">
            <Logo />
            <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{t("about")}</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <h2 className="mb-1 text-[13px] font-medium">{t("site")}</h2>
            <Link href="/progetta" className={link}>
              {tNav("startWizard")}
            </Link>
            <Link href={`/${blogSegment(locale)}`} className={link}>
              {tNav("articles")}
            </Link>
            <Link href={`/${guideSegment(locale)}`} className={link}>
              {tGuide("nav")}
            </Link>
            {menu.filter((m) => !INFO_KEYS.includes(m.key)).map((item) => (
              <Link key={item.key} href={`/${item.slug}`} className={link}>
                {item.title}
              </Link>
            ))}
          </div>
          <div className="flex flex-col items-start gap-3">
            <h2 className="mb-1 text-[13px] font-medium">{t("info")}</h2>
            <LocaleSwitch to={locale === "it" ? "en" : "it"} label={tNav("language")} />
            <hr className="w-full border-border" />
            {infoPages.map((item) => (
              <Link key={item.key} href={`/${item.slug}`} className={link}>
                {item.title}
              </Link>
            ))}
            <Link href="/account" className={link}>
              {tNav("account")}
            </Link>
            {privacy && (
              <Link href={`/${privacy.slug}`} className={link}>
                {t("privacy")}
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pb-7 pt-5 text-[11px] text-muted-foreground">
          <p className="m-0">
            © {new Date().getFullYear()} DPP Designer. {t("rights")}
          </p>
          {/* Dati e indici per riuso, motori di ricerca e motori AI: file alla radice del sito, fuori dalle lingue */}
          <nav aria-label={t("machine")} className="flex flex-wrap gap-x-5 gap-y-2 font-mono">
            <a href="/open-data.json" type="application/json" className="transition-colors hover:text-foreground">
              Open data (JSON)
            </a>
            <a href="/llms.txt" type="text/plain" className="transition-colors hover:text-foreground">
              For AI (llms.txt)
            </a>
            <a href="/sitemap.xml" type="application/xml" className="transition-colors hover:text-foreground">
              sitemap.xml
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
