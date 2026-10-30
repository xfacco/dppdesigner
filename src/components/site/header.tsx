import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getMenu } from "@/server/content";
import { LocaleSwitch } from "./locale-switch";
import { Logo } from "./logo";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader({ locale }: { locale: string }) {
  const [t, menu, session] = await Promise.all([getTranslations("nav"), getMenu(locale), getSession()]);
  const other = locale === "it" ? "en" : "it";
  const navLink = "text-[13px] text-muted-foreground transition-colors hover:text-foreground";

  return (
    <header className="bg-background">
      <div className="mx-auto flex min-h-[76px] w-[min(calc(100%-40px),1200px)] flex-wrap items-center gap-x-8 gap-y-3 py-4 sm:w-[min(calc(100%-80px),1200px)]">
        <Link href="/" className="inline-flex items-center gap-4 whitespace-nowrap" aria-label="DPP Designer — Home">
          <Logo />
          <span aria-hidden className="hidden h-5 w-px bg-border lg:block" />
          <span className="hidden text-[15px] font-bold leading-tight tracking-[-0.025em] lg:block">{t("tagline")}</span>
        </Link>

        <nav aria-label={t("menu")} className="order-3 flex w-full flex-wrap gap-x-6 gap-y-2 md:order-none md:ml-auto md:w-auto md:gap-x-7">
          {menu.map((item) => (
            <Link key={item.key} href={`/${item.slug}`} className={navLink}>
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 md:ml-0">
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
          <ThemeToggle labels={{ toDark: t("themeDark"), toLight: t("themeLight") }} />
          {/* Su telefono il pulsante c'è già nell'apertura delle pagine: qui occuperebbe troppo spazio */}
          <Link href="/progetta" className={buttonVariants({ size: "sm", className: "max-sm:hidden" })}>
            {t("startWizard")}
          </Link>
        </div>
      </div>
    </header>
  );
}
