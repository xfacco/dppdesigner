import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPageByKey } from "@/server/content";
import { AuthShell } from "../auth-shell";
import { WIZARD_START } from "../safe-next";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ next }, t, privacy, marketing] = await Promise.all([
    searchParams,
    getTranslations("auth"),
    getPageByKey(locale, "privacy"),
    getPageByKey(locale, "marketing"),
  ]);
  // Chi arriva dal wizard deve registrarsi prima di compilarlo
  const fromWizard = next?.startsWith(WIZARD_START) ?? false;
  const href = (page: { slug: string } | null) => (page ? `/${locale}/${page.slug}` : null);
  return (
    <AuthShell title={t("registerTitle")} intro={t(fromWizard ? "registerIntroWizard" : "registerIntro")}>
      <RegisterForm next={next} links={{ privacy: href(privacy), marketing: href(marketing) }} />
    </AuthShell>
  );
}
