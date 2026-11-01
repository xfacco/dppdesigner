import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AsciiGlobe } from "@/components/site/ascii-globe";
import { MarkdownBody, MonoLabel, RAIL } from "@/components/site/page-sections";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { splitMarkdown } from "@/lib/markdown-sections";
import { getMenu, getPageByKey } from "@/server/content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageByKey(locale, "home");
  return {
    description: page?.description ?? undefined,
    alternates: { languages: { it: "/it", en: "/en" } },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [page, t, tHome, menu] = await Promise.all([
    getPageByKey(locale, "home"),
    getTranslations("wizard"),
    getTranslations("home"),
    getMenu(locale),
  ]);
  const parts = splitMarkdown(page?.body ?? "");
  // Il resto del testo (dopo titolo e sottotitolo) va nelle sezioni sotto l'apertura
  const rest = [parts.intro, ...parts.sections.map((s) => `## ${s.title}\n${s.body}`)].filter(Boolean).join("\n\n");
  const whatIs = menu.find((m) => m.key === "what_is_dpp");

  return (
    <div className={`${RAIL} pb-24`}>
      {/* Apertura: testo a sinistra, globo a destra */}
      <section className="grid items-center gap-4 py-11 md:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)] md:gap-[30px] md:pb-12 md:pt-14">
        <div className="relative z-10">
          <MonoLabel className="mb-6">{tHome("byline")}</MonoLabel>
          <h1 className="mb-7 text-[clamp(44px,6.2vw,82px)] font-medium leading-[0.98] tracking-[-0.065em] text-balance">
            {parts.title ?? page?.title}
          </h1>
          {parts.lede && <p className="max-w-[400px] text-[19px] leading-normal tracking-[-0.025em] text-muted-foreground md:text-[21px]">{parts.lede}</p>}
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link href="/progetta" className={buttonVariants({ size: "lg" })}>
              {t("start")}
            </Link>
            {whatIs && (
              <Link href={`/${whatIs.slug}`} className={buttonVariants({ size: "lg", variant: "outline" })}>
                {tHome("secondary")}
              </Link>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[560px] md:max-w-none">
          <AsciiGlobe label={tHome("globe")} ring={tHome("ring")} />
        </div>
      </section>

      {rest && <MarkdownBody body={rest} />}
    </div>
  );
}
