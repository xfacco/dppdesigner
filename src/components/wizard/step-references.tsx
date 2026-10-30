import { getTranslations } from "next-intl/server";
import { Markdown } from "@/components/site/markdown";

function Icon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 3h7l3 3v11H5z" strokeLinejoin="round" />
      <path d="M8 9h4M8 12h4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Riquadro "Riferimenti normativi" di uno step. Su schermi larghi è sempre aperto (colonna destra);
 * su mobile è chiuso e si apre con la freccia.
 */
export async function StepReferences({ markdown }: { markdown: string }) {
  const t = await getTranslations("wizard.references");
  const body = (
    <>
      <Markdown className="step-references mt-2 text-sm">{markdown}</Markdown>
      <p className="mt-3 text-xs text-muted-foreground">{t("note")}</p>
    </>
  );

  return (
    <>
      {/* Mobile e tablet: chiuso, si apre con la freccia */}
      <details className="group rounded-lg border bg-muted/40 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <Icon />
          {t("title")}
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="border-t px-4 pb-4">{body}</div>
      </details>

      {/* Desktop: sempre aperto nella colonna destra */}
      <section aria-labelledby="step-references" className="hidden rounded-lg border bg-muted/40 px-5 py-4 lg:block">
        <h2 id="step-references" className="flex items-center gap-2 text-sm font-semibold">
          <Icon />
          {t("title")}
        </h2>
        {body}
      </section>
    </>
  );
}
