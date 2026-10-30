import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "../auth-shell";
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
  const [{ next }, t] = await Promise.all([searchParams, getTranslations("auth")]);
  return (
    <AuthShell title={t("registerTitle")} intro={t("registerIntro")}>
      <RegisterForm next={next} />
    </AuthShell>
  );
}
