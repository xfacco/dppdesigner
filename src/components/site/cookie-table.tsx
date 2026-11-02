import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { CONSENT_COOKIE, cookiesIn, OPTIONAL_CATEGORIES, parseConsent, type CookieCategory } from "@/lib/cookie-consent";
import { CookiePreferencesButton } from "./cookie-consent";

/**
 * Parte automatica della Cookie policy: l'elenco dei cookie (dalla stessa configurazione del banner,
 * quindi sempre aggiornato), la scelta attuale del visitatore e il pulsante per cambiarla.
 */
export async function CookieTable({ locale }: { locale: string }) {
  const t = await getTranslations("cookies");
  const l = locale === "en" ? "en" : "it";
  const raw = (await cookies()).get(CONSENT_COOKIE)?.value;
  const consent = raw ? parseConsent(`${CONSENT_COOKIE}=${raw}`) : null;
  const state = (v: boolean) => (v ? t("allowed") : t("denied"));
  const categories: CookieCategory[] = ["necessary", ...OPTIONAL_CATEGORIES];

  return (
    <div className="grid gap-8">
      <div className="grid gap-3 rounded-lg border bg-muted/40 p-5">
        <p className="m-0 font-medium">{t("yourChoice")}</p>
        <p className="m-0 text-sm text-muted-foreground">
          {consent ? t("choiceSummary", { analytics: state(consent.analytics), marketing: state(consent.marketing) }) : t("choiceNone")}
        </p>
        <CookiePreferencesButton
          label={t("openPreferences")}
          className="w-fit cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground transition-colors hover:bg-ink/85"
        />
      </div>

      <div className="grid gap-6">
        <h2 className="m-0 text-xl font-normal tracking-[-0.025em]">{t("listTitle")}</h2>
        {categories.map((c) => {
          const items = cookiesIn(c);
          return (
            <section key={c} className="grid gap-2">
              <h3 className="m-0 text-base font-semibold">{t(`categories.${c}.title`)}</h3>
              <p className="m-0 text-sm text-muted-foreground">{t(`categories.${c}.text`)}</p>
              {items.length === 0 ? (
                <p className="m-0 text-sm text-muted-foreground">{t("noServices")}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("table.name")}</th>
                        <th className="px-3 py-2 font-medium">{t("table.type")}</th>
                        <th className="px-3 py-2 font-medium">{t("table.purpose")}</th>
                        <th className="px-3 py-2 font-medium">{t("table.duration")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.name} className="border-t align-top">
                          <td className="px-3 py-2 font-mono text-xs">{i.name}</td>
                          <td className="px-3 py-2">{t(`table.${i.storage}`)}</td>
                          <td className="px-3 py-2">
                            {i.purpose[l]} <span className="text-muted-foreground">({i.provider})</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{i.duration[l]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
