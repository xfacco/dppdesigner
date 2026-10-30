"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Label } from "@/components/ui/form";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  if (done)
    return (
      <p className="text-sm">
        {t("resetDone")}{" "}
        <Link href="/login" className="text-primary underline">
          {t("submitLogin")}
        </Link>
      </p>
    );

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(false);
        const newPassword = String(new FormData(e.currentTarget).get("password") ?? "");
        const res = await authClient.resetPassword({ newPassword, token });
        setPending(false);
        if (res.error) setError(true);
        else setDone(true);
      }}
    >
      <Field>
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </Field>
      {error && <FieldError>{t("errors.generic")}</FieldError>}
      <Button type="submit" disabled={pending}>
        {t("resetSubmit")}
      </Button>
    </form>
  );
}
