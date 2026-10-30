import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MarkdownBody, MonoLabel, RAIL, SectionRow } from "@/components/site/page-sections";
import { splitMarkdown } from "@/lib/markdown-sections";
import { getPageBySlug } from "@/server/content";
import { ContactForm } from "./contact-form";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPageBySlug(locale, slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description ?? undefined,
    alternates: {
      languages: Object.fromEntries(page.page.translations.map((t) => [t.locale, `/${t.locale}/${t.slug}`])),
    },
  };
}

export default async function ContentPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const page = await getPageBySlug(locale, slug);
  if (!page) notFound();

  const parts = splitMarkdown(page.body);
  const rest = [parts.intro, ...parts.sections.map((s) => `## ${s.title}\n${s.body}`)].filter(Boolean).join("\n\n");

  return (
    <article className={`${RAIL} pb-24 pt-12 md:pt-14`}>
      <header className="max-w-[820px] pb-10">
        <MonoLabel className="mb-5">DPP Designer</MonoLabel>
        <h1 className="m-0 text-[clamp(38px,5vw,57px)] font-medium leading-[1.08] tracking-[-0.05em] text-balance">
          {parts.title ?? page.title}
        </h1>
        {parts.lede && <p className="mt-5 max-w-[720px] text-lg leading-normal tracking-[-0.02em] md:text-xl">{parts.lede}</p>}
      </header>
      {rest && <MarkdownBody body={rest} />}
      {page.page.key === "contacts" && (
        <SectionRow title={page.title}>
          <ContactForm />
        </SectionRow>
      )}
    </article>
  );
}
