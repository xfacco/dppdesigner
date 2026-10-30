"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";

export function ForgotForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  if (sent) return <p className="text-sm">{t("forgotSent")}</p>;

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const email = String(new FormData(e.currentTarget).get("email") ?? "");
        // La risposta è la stessa che l'email esista o meno
        await authClient.requestPasswordReset({ email, redirectTo: `/${locale}/reset-password` });
        setSent(true);
      }}
    >
      <Field>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("forgotSubmit")}
      </Button>
    </form>
  );
}
