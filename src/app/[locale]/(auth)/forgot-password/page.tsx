import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "../auth-shell";
import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("forgotTitle")} intro={t("forgotIntro")}>
      <ForgotForm />
    </AuthShell>
  );
}
