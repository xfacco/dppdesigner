"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { askStepAi, askStepExpert } from "@/app/[locale]/progetta/actions";
import { Markdown } from "@/components/site/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { FieldError, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { QuestionView } from "@/server/questions";

type Channel = "AI" | "EXPERT";

export function StepAssistant({
  journeyId,
  stepKey,
  initial,
  aiEnabled,
}: {
  journeyId: string;
  stepKey: string;
  initial: QuestionView[];
  aiEnabled: boolean;
}) {
  const t = useTranslations("wizard.assistant");
  const tw = useTranslations("wizard");
  const locale = useLocale();
  const [questions, setQuestions] = useState(initial);
  const [channel, setChannel] = useState<Channel>(aiEnabled ? "AI" : "EXPERT");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });

  const submit = () => {
    setError(null);
    const question = text.trim();
    if (question.length < 3 || question.length > 1000) return setError(t("errors.invalid"));
    startTransition(async () => {
      const res = channel === "AI" ? await askStepAi(journeyId, stepKey, question) : await askStepExpert(journeyId, stepKey, question);
      if (res.ok) {
        setQuestions((q) => [...q, res.question]);
        setText("");
      } else if (res.error === "limit") {
        setError(channel === "AI" ? t("errors.limit") : t("errors.limitExpert"));
      } else {
        setError(t(`errors.${res.error === "disabled" ? "unavailable" : res.error}`));
      }
    });
  };

  return (
    <details className="group rounded-lg border bg-accent/40" open={questions.length > 0}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <svg aria-hidden viewBox="0 0 20 20" className="h-6 w-6 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 5h12v8H9l-4 3v-3H4z" strokeLinejoin="round" />
        </svg>
        <span className="grid">
          <span className="font-medium">{t("title")}</span>
          <span className="text-sm text-muted-foreground">{t("ctaHint")}</span>
        </span>
        {questions.some((q) => q.status === "OPEN") && <Badge tone="warning">{t("pendingShort")}</Badge>}
        <span className={cn(buttonVariants(), "ml-auto group-open:hidden")}>{t("cta")}</span>
      </summary>

      <div className="grid gap-4 border-t bg-card px-5 py-4">
        <p className="text-sm text-muted-foreground">{t("intro")}</p>

        {questions.length > 0 && (
          <ol className="grid gap-4" aria-live="polite">
            {questions.map((q) => (
              <li key={q.id} className="grid gap-2">
                <div className="ml-auto max-w-[90%] rounded-lg bg-accent px-3 py-2 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("you")} → {q.channel === "AI" ? t("ai") : t("expert")} · {fmt.format(new Date(q.createdAt))}
                  </p>
                  <p className="whitespace-pre-wrap">{q.question}</p>
                </div>
                <div className="max-w-[90%] rounded-lg border px-3 py-2 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {q.channel === "AI" ? t("ai") : t("expert")}
                    {q.answeredAt && ` · ${fmt.format(new Date(q.answeredAt))}`}
                  </p>
                  {q.answer ? (
                    <Markdown className="step-references text-sm">{q.answer}</Markdown>
                  ) : (
                    <p className="text-muted-foreground">{t("pending")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        <div role="tablist" aria-label={t("title")} className="flex gap-1 rounded-md bg-muted p-1 text-sm">
          {(["AI", "EXPERT"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={channel === c}
              disabled={c === "AI" && !aiEnabled}
              onClick={() => {
                setChannel(c);
                setError(null);
              }}
              className={cn(
                "flex-1 cursor-pointer rounded px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                channel === c ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "AI" ? t("tabAi") : t("tabExpert")}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {channel === "AI" ? t("aiNote") : t("expertNote")}
          {!aiEnabled && ` ${t("aiDisabled")}`}
        </p>

        <div className="grid gap-2">
          <label htmlFor={`ask-${stepKey}`} className="sr-only">
            {t("placeholder")}
          </label>
          <Textarea
            id={`ask-${stepKey}`}
            value={text}
            maxLength={1000}
            rows={3}
            placeholder={t("placeholder")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            aria-describedby={`ask-${stepKey}-hint`}
          />
          <p id={`ask-${stepKey}-hint`} className="text-xs text-muted-foreground">
            {tw("noPersonalData")}
          </p>
          <FieldError>{error}</FieldError>
          <div>
            <Button type="button" onClick={submit} disabled={pending || !text.trim()}>
              {pending ? (channel === "AI" ? t("thinking") : t("sending")) : channel === "AI" ? t("sendAi") : t("sendExpert")}
            </Button>
          </div>
        </div>
      </div>
    </details>
  );
}
