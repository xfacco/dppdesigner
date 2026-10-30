"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Label } from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { claimAfterLogin } from "../actions";
import { safeNext } from "../safe-next";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email(data);
    if (signInError) {
      setError(signInError.status === 401 ? t("errors.invalidCredentials") : t("errors.generic"));
      return;
    }
    await claimAfterLogin();
    router.push(safeNext(next));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Field>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field>
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" disabled={formState.isSubmitting}>
        {t("submitLogin")}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-primary underline">
          {t("noAccount")}
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground underline">
          {t("forgot")}
        </Link>
      </div>
    </form>
  );
}
