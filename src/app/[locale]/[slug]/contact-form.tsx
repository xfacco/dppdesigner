"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { contactSchema, type ContactInput } from "@/lib/schemas";
import { sendContactMessage } from "./actions";

export function ContactForm() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const { register, handleSubmit, formState } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  if (sent) return <Card>{t("sent")}</Card>;

  return (
    <Card>
      <CardTitle className="mb-6">{t("title")}</CardTitle>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={handleSubmit(async (data) => {
          const res = await sendContactMessage(data);
          if (res.ok) setSent(true);
          else setFailed(true);
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="c-name">{t("name")}</Label>
            <Input id="c-name" autoComplete="name" aria-invalid={!!formState.errors.name} {...register("name")} />
          </Field>
          <Field>
            <Label htmlFor="c-email">{t("email")}</Label>
            <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register("email")} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="c-company">{t("company")}</Label>
          <Input id="c-company" autoComplete="organization" {...register("company")} />
        </Field>
        <Field>
          <Label htmlFor="c-message">{t("message")}</Label>
          <Textarea id="c-message" rows={5} aria-invalid={!!formState.errors.message} {...register("message")} />
        </Field>
        <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register("website")} />
        <label className="flex items-start gap-2 text-sm">
          <Checkbox className="mt-0.5" {...register("privacy")} />
          <span>{t("privacy")}</span>
        </label>
        {(failed || Object.keys(formState.errors).length > 0) && <FieldError>{t("error")}</FieldError>}
        <div>
          <Button type="submit" disabled={formState.isSubmitting}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
