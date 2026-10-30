"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, Label } from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/lib/schemas";
import { completeRegistration } from "../actions";
import { safeNext } from "../safe-next";

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { marketing: false },
  });
  const errors = formState.errors;

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      company: data.company || undefined,
      jobTitle: data.jobTitle || undefined,
      phone: data.phone || undefined,
      locale,
      callbackURL: `/${locale}/account`,
    });
    if (signUpError) {
      setError(signUpError.code === "USER_ALREADY_EXISTS" ? t("errors.exists") : t("errors.generic"));
      return;
    }
    await completeRegistration({ marketing: data.marketing });
    router.push(safeNext(next));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Field>
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field>
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby="password-hint"
          {...register("password")}
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          {t("passwordHint")}
        </p>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="company">{t("company")}</Label>
          <Input id="company" autoComplete="organization" {...register("company")} />
        </Field>
        <Field>
          <Label htmlFor="jobTitle">{t("jobTitle")}</Label>
          <Input id="jobTitle" autoComplete="organization-title" {...register("jobTitle")} />
        </Field>
      </div>
      <Field>
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox className="mt-0.5" aria-invalid={!!errors.privacy} {...register("privacy")} />
        <span>{t("privacyConsent")}</span>
      </label>
      {errors.privacy && <FieldError>{t("errors.privacyRequired")}</FieldError>}
      <label className="flex items-start gap-2 text-sm">
        <Checkbox className="mt-0.5" {...register("marketing")} />
        <span>{t("marketingConsent")}</span>
      </label>
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" disabled={formState.isSubmitting}>
        {t("submitRegister")}
      </Button>
      <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-sm text-primary underline">
        {t("haveAccount")}
      </Link>
    </form>
  );
}
