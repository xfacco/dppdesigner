import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { blogSegment } from "@/lib/blog";
import { guideSegment } from "@/lib/guide";
import { getMenu, getPageByKey } from "@/server/content";
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
            {menu.map((item) => (
              <Link key={item.key} href={`/${item.slug}`} className={link}>
                {item.title}
              </Link>
            ))}
          </div>
          <div className="flex flex-col items-start gap-3">
            <h2 className="mb-1 text-[13px] font-medium">{t("info")}</h2>
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
        <p className="border-t pb-7 pt-5 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} DPP Designer. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
