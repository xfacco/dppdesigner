"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  CONSENT_CHANGED_EVENT,
  cookiesIn,
  OPEN_PREFERENCES_EVENT,
  OPTIONAL_CATEGORIES,
  parseConsent,
  serializeConsent,
  type OptionalCategory,
} from "@/lib/cookie-consent";

type Choice = Record<OptionalCategory, boolean>;
const NONE: Choice = { analytics: false, marketing: false };
const ALL: Choice = { analytics: true, marketing: true };

/**
 * Banner dei cookie e pannello delle preferenze.
 * - Il banner compare finché non c'è una scelta valida (cookie dpp_consent, 6 mesi).
 * - "Accetta tutti" e "Rifiuta" hanno la stessa evidenza, come chiede il Garante privacy.
 * - Le preferenze si riaprono con l'evento OPEN_PREFERENCES_EVENT (footer e Cookie policy).
 * - A ogni scelta viene emesso CONSENT_CHANGED_EVENT, a cui potranno agganciarsi script facoltativi.
 */
export function CookieConsent({ policyHref }: { policyHref: string | null }) {
  const t = useTranslations("cookies");
  const [showBanner, setShowBanner] = useState(false);
  const [choice, setChoice] = useState<Choice>(NONE);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const current = parseConsent(document.cookie);
    if (current) setChoice({ analytics: current.analytics, marketing: current.marketing });
    else setShowBanner(true);
    const open = () => {
      const c = parseConsent(document.cookie);
      if (c) setChoice({ analytics: c.analytics, marketing: c.marketing });
      dialog.current?.showModal();
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  const save = (c: Choice) => {
    document.cookie = serializeConsent(c, location.protocol === "https:");
    setChoice(c);
    setShowBanner(false);
    dialog.current?.close();
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: c }));
  };

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-labelledby="cookie-banner-title"
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-5"
        >
          <div className="mx-auto grid max-w-3xl gap-4 rounded-xl border bg-background p-5 shadow-lg sm:p-6">
            <div className="grid gap-1.5">
              <p id="cookie-banner-title" className="m-0 font-semibold">
                {t("bannerTitle")}
              </p>
              <p className="m-0 text-sm text-muted-foreground">
                {t("bannerText")}{" "}
                {policyHref && (
                  <Link href={policyHref} className="text-foreground underline underline-offset-4">
                    {t("policy")}
                  </Link>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => save(NONE)}>{t("rejectAll")}</Button>
              <Button onClick={() => save(ALL)}>{t("acceptAll")}</Button>
              <Button variant="ghost" onClick={() => dialog.current?.showModal()} className="sm:ml-auto">
                {t("customize")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="cookie-prefs-title"
        className="m-auto w-[min(calc(100%-24px),640px)] rounded-xl border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
      >
        <form
          method="dialog"
          className="grid max-h-[85vh] gap-5 overflow-y-auto p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save(choice);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 id="cookie-prefs-title" className="m-0 text-xl font-semibold tracking-tight">
              {t("preferencesTitle")}
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label={t("close")} className="-m-1 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground">
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
          <p className="m-0 text-sm text-muted-foreground">{t("preferencesIntro")}</p>

          <fieldset className="grid gap-3">
            <legend className="sr-only">{t("preferencesTitle")}</legend>
            <Category title={t("categories.necessary.title")} text={t("categories.necessary.text")} status={t("alwaysOn")} />
            {OPTIONAL_CATEGORIES.map((c) => (
              <Category
                key={c}
                title={t(`categories.${c}.title`)}
                text={t(`categories.${c}.text`)}
                note={cookiesIn(c).length === 0 ? t("noServices") : undefined}
                toggle={{ checked: choice[c], onChange: (v) => setChoice((x) => ({ ...x, [c]: v })) }}
              />
            ))}
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => save(NONE)}>
              {t("rejectAll")}
            </Button>
            <Button type="button" variant="outline" onClick={() => save(ALL)}>
              {t("acceptAll")}
            </Button>
            <Button type="submit" className="sm:ml-auto">
              {t("save")}
            </Button>
          </div>
          {policyHref && (
            <Link href={policyHref} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              {t("policy")}
            </Link>
          )}
        </form>
      </dialog>
    </>
  );
}

function Category({
  title,
  text,
  status,
  note,
  toggle,
}: {
  title: string;
  text: string;
  status?: string;
  note?: string;
  toggle?: { checked: boolean; onChange: (v: boolean) => void };
}) {
  const id = `cookie-cat-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className="grid gap-1 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={toggle ? id : undefined} className="font-medium">
          {title}
        </label>
        {toggle ? (
          <input
            id={id}
            type="checkbox"
            role="switch"
            checked={toggle.checked}
            onChange={(e) => toggle.onChange(e.target.checked)}
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-muted-foreground/30 transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-background before:shadow before:transition-transform checked:bg-primary checked:before:translate-x-[18px]"
          />
        ) : (
          <span className="text-xs font-medium text-primary">{status}</span>
        )}
      </div>
      <p className="m-0 text-sm text-muted-foreground">{text}</p>
      {note && <p className="m-0 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Link "Preferenze cookie": riapre il pannello delle preferenze. */
export function CookiePreferencesButton({ className, label }: { className?: string; label: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))} className={className}>
      {label}
    </button>
  );
}
