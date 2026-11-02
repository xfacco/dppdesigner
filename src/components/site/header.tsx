import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { blogSegment } from "@/lib/blog";
import { getSession } from "@/lib/session";
import { LocaleSwitch } from "./locale-switch";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

// Le pagine del sito sono raggiungibili dal footer: in alto restano Articoli, lingua, account e pulsante principale
export async function SiteHeader({ locale }: { locale: string }) {
  const [t, session] = await Promise.all([getTranslations("nav"), getSession()]);
  const other = locale === "it" ? "en" : "it";
  const navLink = "whitespace-nowrap text-[13px] text-muted-foreground transition-colors hover:text-foreground";
  const mobileLink = "block w-full border-b py-3 text-left text-[15px] text-foreground transition-colors hover:text-primary";

  return (
    <header className="relative z-30 bg-background">
      <div className="mx-auto flex min-h-[76px] w-[min(calc(100%-40px),1200px)] items-center gap-x-4 py-4 sm:w-[min(calc(100%-80px),1200px)] md:gap-x-8">
        <Link href="/" className="inline-flex items-center gap-4 whitespace-nowrap" aria-label="DPP Designer — Home">
          <Logo />
          <span aria-hidden className="hidden h-5 w-px bg-border lg:block" />
          <span className="hidden text-[15px] font-bold leading-tight tracking-[-0.025em] lg:block">{t("tagline")}</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <nav aria-label={t("menu")} className="hidden items-center gap-4 md:flex">
            <Link href={`/${blogSegment(locale)}`} className={navLink}>
              {t("articles")}
            </Link>
            <LocaleSwitch to={other} label={t("language")} />
            {session ? (
              <>
                <Link href="/account" className={navLink}>
                  {t("account")}
                </Link>
                <SignOutButton label={t("logout")} redirectTo={`/${locale}`} className="text-[13px]" />
              </>
            ) : (
              <Link href="/login" className={navLink}>
                {t("login")}
              </Link>
            )}
          </nav>
          <ThemeToggle labels={{ toDark: t("themeDark"), toLight: t("themeLight") }} />
          <Link href="/progetta" className={buttonVariants({ size: "sm", className: "max-md:hidden" })}>
            {t("startWizard")}
          </Link>

          {/* Su telefono le stesse voci stanno nel pannello ad hamburger */}
          <MobileMenu labels={{ open: t("openMenu"), close: t("closeMenu") }}>
            <nav aria-label={t("menu")} className="pb-4">
              <Link href={`/${blogSegment(locale)}`} className={mobileLink}>
                {t("articles")}
              </Link>
              <LocaleSwitch to={other} label={t("language")} className={mobileLink} />
              {session ? (
                <>
                  <Link href="/account" className={mobileLink}>
                    {t("account")}
                  </Link>
                  <SignOutButton label={t("logout")} redirectTo={`/${locale}`} className={mobileLink} />
                </>
              ) : (
                <Link href="/login" className={mobileLink}>
                  {t("login")}
                </Link>
              )}
            </nav>
            <Link href="/progetta" className={buttonVariants({ className: "w-full" })}>
              {t("startWizard")}
            </Link>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
