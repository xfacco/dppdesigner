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
import { safeNext, WIZARD_START } from "../safe-next";

/** Link alle pagine informative: si aprono in una nuova scheda per non perdere il form compilato. */
export type LegalLinks = { privacy: string | null; marketing: string | null };

export function RegisterForm({ next, links }: { next?: string; links: LegalLinks }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { marketing: false },
  });
  const errors = formState.errors;
  const legalLink = (href: string | null) => (chunks: React.ReactNode) =>
    href ? (
      <a href={href} target="_blank" rel="noopener" className="text-primary underline underline-offset-2">
        {chunks}
      </a>
    ) : (
      chunks
    );

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({
      name: data.name ?? "",
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
    const result = await completeRegistration({ marketing: data.marketing, startWizard: next === WIZARD_START });
    router.push(result.ok && result.journeyId ? `/progetta/${result.journeyId}` : safeNext(next));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Field>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && <FieldError id="email-error">{t("errors.email")}</FieldError>}
      </Field>
      <Field>
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!errors.password}
          aria-describedby="password-hint"
          {...register("password")}
        />
        <p id="password-hint" className={errors.password ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {t("passwordHint")}
        </p>
      </Field>

      <fieldset className="grid gap-4 border-t pt-4">
        <legend className="pr-2 text-sm text-muted-foreground">{t("optionalFields")}</legend>
        <Field>
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" autoComplete="name" {...register("name")} />
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
      </fieldset>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox className="mt-0.5" {...register("marketing")} />
        <span>{t.rich("marketingConsent", { link: legalLink(links.marketing) })}</span>
      </label>
      <p className="text-xs text-muted-foreground">{t.rich("privacyNotice", { link: legalLink(links.privacy) })}</p>
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
