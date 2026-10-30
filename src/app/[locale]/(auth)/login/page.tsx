import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({
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
    <AuthShell title={t("loginTitle")}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
