import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "../auth-shell";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ token }, t] = await Promise.all([searchParams, getTranslations("auth")]);
  return (
    <AuthShell title={t("resetTitle")}>
      {token ? <ResetForm token={token} /> : <p className="text-sm">{t("errors.generic")}</p>}
    </AuthShell>
  );
}
