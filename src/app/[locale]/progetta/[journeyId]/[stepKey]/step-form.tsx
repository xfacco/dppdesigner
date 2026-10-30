"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch, type FieldError as RhfFieldError } from "react-hook-form";
import { z } from "zod";
import { Markdown } from "@/components/site/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, Label, Textarea } from "@/components/ui/form";
import { Link, useRouter } from "@/i18n/navigation";
import { answerSchema, DEFAULT_TEXT_MAX, type StepDef } from "@/lib/wizard/engine";
import type { AnswerValue } from "@/lib/wizard/rules";
import { cn } from "@/lib/utils";
import { saveStep } from "../../actions";

type Props = {
  journeyId: string;
  step: StepDef;
  initialValue?: unknown;
  prevHref: string;
  isLast: boolean;
  /** Chiavi delle opzioni consigliate dai suggerimenti dello step */
  suggested?: string[];
  /** Solo per le griglie: righe con consiglio, opzioni consigliate e obbligatorie */
  matrixRows?: MatrixRow[];
};

export type MatrixRow = { key: string; label: string; notes: string[]; suggested: string[]; mandatory: string[] };

type FormValues = { value: AnswerValue };

function defaultValue(step: StepDef, initial: unknown): AnswerValue | undefined {
  if (initial !== undefined) return initial as AnswerValue;
  if (step.type === "MULTI_CHOICE") return [];
  if (step.type === "MATRIX") return {};
  if (step.type === "TEXT" || step.type === "SINGLE_CHOICE") return "";
  if (step.type === "FIELDS") return Object.fromEntries((step.config.fields ?? []).map((f) => [f.key, ""]));
  return undefined;
}

const toNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

export function StepForm({ journeyId, step, initialValue, prevHref, isLast, suggested = [], matrixRows = [] }: Props) {
  const t = useTranslations("wizard");
  const locale = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // Per la griglia lo schema ha bisogno di sapere quali righe ci sono
  const schemaAnswers = step.type === "MATRIX" && step.config.rowsFrom ? { [step.config.rowsFrom]: matrixRows.map((r) => r.key) } : {};
  const { register, handleSubmit, formState, control, setValue } = useForm<FormValues>({
    resolver: zodResolver(z.object({ value: answerSchema(step, schemaAnswers) })) as never,
    defaultValues: { value: defaultValue(step, initialValue) },
  });
  // Valori correnti della griglia: servono ai pulsanti "una scelta per riga" e
  // all'avviso quando si toglie un'opzione obbligatoria per legge
  const watched = useWatch({ control, name: "value" });
  const matrixValues = step.type === "MATRIX" ? (watched as Record<string, string[] | false> | undefined) : undefined;
  const rowValue = (row: string) => {
    const v = matrixValues?.[row];
    return Array.isArray(v) ? v : [];
  };
  const singlePerRow = step.type === "MATRIX" && step.config.multiple === false;

  const errorText = (err?: RhfFieldError | Record<string, unknown>) => {
    if (!err) return null;
    const message = (err as RhfFieldError).message;
    return message === "required" || (err as RhfFieldError).type === "invalid_type"
      ? t("errors.required")
      : t("errors.invalid");
  };

  const onSubmit = handleSubmit(async ({ value }) => {
    setServerError(null);
    const res = await saveStep(journeyId, step.key, value);
    if (!res.ok) {
      setServerError(res.error === "not_found" ? t("errors.notFound") : t("errors.invalid"));
      return;
    }
    const target = res.next ? res.next : res.completed ? "summary" : "";
    router.push(`/progetta/${journeyId}${target ? `/${target}` : ""}`);
  });

  const valueError = formState.errors.value as RhfFieldError | undefined;
  const fieldErrors = (formState.errors.value ?? {}) as Record<string, RhfFieldError | undefined>;

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby="step-title" className="grid gap-8">
      {step.type === "MATRIX" && (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">{singlePerRow ? t("matrixHintSingle") : t("matrixHint")}</p>
          {/* Intestazione delle colonne, solo su schermi larghi */}
          <div
            aria-hidden
            className="hidden gap-2 px-4 text-xs font-medium uppercase text-muted-foreground md:grid md:[grid-template-columns:var(--cols)]"
            style={{ "--cols": `minmax(0,1.6fr) repeat(${step.options.length}, minmax(0,1fr))` } as React.CSSProperties}
          >
            <span>{t("matrixRow")}</span>
            {step.options.map((o) => (
              <span key={o.key} className="text-center">
                {o.label}
              </span>
            ))}
          </div>
          {matrixRows.length === 0 && <p className="text-sm text-destructive">{t("matrixNoRows")}</p>}
          {matrixRows.map((row) => (
            <fieldset
              key={row.key}
              className="grid gap-3 rounded-md border p-4 md:items-center md:gap-2 md:[grid-template-columns:var(--cols)]"
              style={{ "--cols": `minmax(0,1.6fr) repeat(${step.options.length}, minmax(0,1fr))` } as React.CSSProperties}
            >
              <legend className="sr-only">{row.label}</legend>
              <div className="grid gap-1 md:pr-2">
                <span className="font-medium">{row.label}</span>
                {row.notes.map((n, i) => (
                  <Markdown key={i} className="step-references text-xs text-muted-foreground">
                    {n}
                  </Markdown>
                ))}
                <FieldError>{errorText(fieldErrors[row.key])}</FieldError>
                {row.mandatory.some((k) => !rowValue(row.key).includes(k)) && (
                  <p role="alert" className="rounded-md bg-warning/20 px-2 py-1 text-xs">
                    {t("mandatoryWarning", {
                      options: row.mandatory.map((k) => step.options.find((o) => o.key === k)?.label ?? k).join(", "),
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:contents">
                {step.options.map((o) => {
                  const required = row.mandatory.includes(o.key);
                  return (
                    <label
                      key={o.key}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted md:justify-center md:border-transparent",
                        "has-[:checked]:border-primary has-[:checked]:bg-accent",
                      )}
                    >
                      {singlePerRow ? (
                        // Una scelta per riga: il valore resta un elenco (di un solo elemento)
                        <input
                          type="radio"
                          name={`row-${row.key}`}
                          value={o.key}
                          className="h-4 w-4 accent-primary"
                          checked={rowValue(row.key).includes(o.key)}
                          onChange={() =>
                            setValue(`value.${row.key}` as "value", [o.key], { shouldDirty: true, shouldValidate: formState.isSubmitted })
                          }
                        />
                      ) : (
                        <Checkbox value={o.key} {...register(`value.${row.key}` as "value")} />
                      )}
                      <span className="md:sr-only">{o.label}</span>
                      {required ? (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">{t("mandatory")}</span>
                      ) : (
                        row.suggested.includes(o.key) && (
                          <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-accent-foreground">{t("suggested")}</span>
                        )
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {(step.type === "SINGLE_CHOICE" || step.type === "MULTI_CHOICE") && (
        <fieldset className="grid gap-3">
          <legend className="sr-only">{step.type === "SINGLE_CHOICE" ? t("selectOne") : t("selectMany")}</legend>
          <p className="text-sm text-muted-foreground" aria-hidden>
            {step.type === "SINGLE_CHOICE" ? t("selectOne") : t("selectMany")}
          </p>
          {step.options.map((o) => (
            <label
              key={o.key}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors hover:bg-muted",
                "has-[:checked]:border-primary has-[:checked]:bg-accent",
              )}
            >
              {step.type === "SINGLE_CHOICE" ? (
                <input type="radio" value={o.key} className="mt-1 accent-primary" {...register("value")} />
              ) : (
                <Checkbox value={o.key} className="mt-1" {...register("value")} />
              )}
              <span className="grid gap-1">
                <span className="font-medium">
                  {o.label}
                  {suggested.includes(o.key) && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-primary px-2 py-0.5 align-middle text-xs font-medium text-primary-foreground">
                      {t("suggested")}
                    </span>
                  )}
                </span>
                {o.description && <span className="text-sm text-muted-foreground">{o.description}</span>}
              </span>
            </label>
          ))}
          <FieldError>{errorText(valueError)}</FieldError>
        </fieldset>
      )}

      {step.type === "NUMBER" && (
        <Field>
          <Label htmlFor="value" className="sr-only">
            {step.title}
          </Label>
          <Input
            id="value"
            type="number"
            inputMode="numeric"
            min={step.config.min}
            max={step.config.max}
            className="max-w-xs"
            aria-invalid={!!valueError}
            {...register("value", { setValueAs: toNumber })}
          />
          <FieldError>{errorText(valueError)}</FieldError>
        </Field>
      )}

      {step.type === "TEXT" && (
        <Field>
          <Label htmlFor="value" className="sr-only">
            {step.title}
          </Label>
          <Textarea
            id="value"
            maxLength={step.config.maxLength ?? DEFAULT_TEXT_MAX}
            aria-invalid={!!valueError}
            aria-describedby="value-hint"
            {...register("value")}
          />
          <p id="value-hint" className="text-sm text-muted-foreground">
            {t("noPersonalData")}
          </p>
          <FieldError>{errorText(valueError)}</FieldError>
        </Field>
      )}

      {step.type === "FIELDS" && (
        <div className="grid gap-5">
          {(step.config.fields ?? []).map((f) => {
            const label = f.label[locale] ?? f.label.it ?? f.key;
            return (
              <Field key={f.key}>
                <Label htmlFor={`f-${f.key}`}>
                  {label}
                  {!f.required && <span className="ml-1 font-normal text-muted-foreground">({t("optional")})</span>}
                </Label>
                <Input
                  id={`f-${f.key}`}
                  type={f.type === "number" ? "number" : "text"}
                  maxLength={f.type === "text" ? (step.config.maxLength ?? DEFAULT_TEXT_MAX) : undefined}
                  aria-invalid={!!fieldErrors[f.key]}
                  {...register(`value.${f.key}` as "value", f.type === "number" ? { setValueAs: (v) => toNumber(v) ?? "" } : {})}
                />
                <FieldError>{errorText(fieldErrors[f.key])}</FieldError>
              </Field>
            );
          })}
          <p className="text-sm text-muted-foreground">{t("noPersonalData")}</p>
        </div>
      )}

      {step.help && <p className="text-sm text-muted-foreground">{step.help}</p>}
      {serverError && <FieldError>{serverError}</FieldError>}

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        <Link href={prevHref} className={buttonVariants({ variant: "ghost" })}>
          {t("back")}
        </Link>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? t("saving") : isLast ? t("finish") : t("next")}
        </Button>
      </div>
    </form>
  );
}
