import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/form";
import { Link, redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { startJourney } from "../progetta/actions";
import { deleteAccount, hideJourney } from "./actions";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?next=/account", locale });

  const [t, tAuth, format, journeys] = await Promise.all([
    getTranslations("account"),
    getTranslations("auth"),
    getFormatter(),
    // I progetti "eliminati" dall'utente restano nel database ma non si mostrano qui
    db.journey.findMany({
      where: { userId: session.user.id, isPreview: false, hiddenByUserAt: null },
      orderBy: { updatedAt: "desc" },
      include: { answers: { where: { stepKey: "sample_product" }, select: { value: true } } },
    }),
  ]);
  const productName = (j: (typeof journeys)[number]) => {
    const v = j.answers[0]?.value as { name?: unknown } | undefined;
    return typeof v?.name === "string" && v.name.trim() ? v.name.trim() : null;
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <CardTitle>{t("journeys")}</CardTitle>
          <form action={startJourney}>
            <Button type="submit" size="sm" variant="outline">
              {t("newJourney")}
            </Button>
          </form>
        </div>
        {journeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noJourneys")}</p>
        ) : (
          <ul className="divide-y">
            {journeys.map((j) => (
              <li key={j.id} className="grid gap-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-1">
                    {productName(j) && <span className="font-medium">{productName(j)}</span>}
                    <div className="flex items-center gap-2">
                      <Badge tone={j.status === "COMPLETED" ? "primary" : "muted"}>{t(`status.${j.status}`)}</Badge>
                      {j.score !== null && <span className="text-sm tabular-nums">{j.score}/100</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("updated", { date: format.dateTime(j.updatedAt, { dateStyle: "medium" }) })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/progetta/${j.id}`} className={buttonVariants({ size: "sm" })}>
                      {t("open")}
                    </Link>
                    {/* Conferma sul posto, senza finestre di dialogo */}
                    <details className="group relative">
                      <summary
                        className={buttonVariants({ size: "sm", variant: "ghost", className: "list-none text-destructive [&::-webkit-details-marker]:hidden" })}
                      >
                        {t("deleteJourney")}
                      </summary>
                      <div className="absolute right-0 z-10 mt-2 w-64 rounded-md border bg-card p-3 text-sm shadow-lg">
                        <p>{t("deleteJourneyConfirm")}</p>
                        <form action={hideJourney.bind(null, j.id)} className="mt-3">
                          <Button type="submit" size="sm" variant="destructive">
                            {t("deleteJourneyYes")}
                          </Button>
                        </form>
                      </div>
                    </details>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>{t("profile")}</CardTitle>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{tAuth("email")}</dt>
          <dd>{session.user.email}</dd>
          <dt className="text-muted-foreground">{tAuth("name")}</dt>
          <dd>{session.user.name || "—"}</dd>
          {session.user.company && (
            <>
              <dt className="text-muted-foreground">{tAuth("company")}</dt>
              <dd>{session.user.company}</dd>
            </>
          )}
        </dl>
      </Card>

      <Card>
        <CardTitle>{t("privacy")}</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">{t("retention")}</p>
        <a href="/api/account/export" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
          {t("export")}
        </a>
        <form action={deleteAccount} className="mt-6 grid gap-3 border-t pt-6">
          <Label htmlFor="confirm">{t("deleteConfirm")}</Label>
          <div className="flex flex-wrap gap-3">
            <Input id="confirm" name="confirm" placeholder={t("deleteWord")} className="max-w-48" autoComplete="off" />
            <Button type="submit" variant="destructive">
              {t("delete")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
