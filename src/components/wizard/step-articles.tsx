import { getTranslations } from "next-intl/server";
import { blogPath } from "@/lib/blog";
import type { PostView } from "@/server/blog";

/**
 * Riquadro "Articoli di approfondimento" di uno step: compare solo se ci sono articoli collegati
 * (Admin → Wizard → step, oppure Admin → Articoli). I link si aprono in una nuova scheda,
 * così chi sta compilando non perde il punto in cui si trova.
 */
export async function StepArticles({ locale, posts }: { locale: string; posts: PostView[] }) {
  if (posts.length === 0) return null;
  const t = await getTranslations("wizard.articles");
  return (
    <section aria-labelledby="step-articles" className="min-w-0 rounded-lg border bg-muted/40 px-5 py-4">
      <h2 id="step-articles" className="flex items-center gap-2 text-sm font-semibold">
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 4.5h8.5A3.5 3.5 0 0 1 16 8v7.5H7.5A3.5 3.5 0 0 1 4 12z" strokeLinejoin="round" />
          <path d="M7 8h6M7 11h4" strokeLinecap="round" />
        </svg>
        {t("title")}
      </h2>
      <ul className="mt-3 grid gap-3">
        {posts.map((p) => (
          <li key={p.id}>
            <a
              href={blogPath(locale, p.slug)}
              target="_blank"
              rel="noopener"
              className="group inline-flex max-w-full items-start gap-1.5 break-words text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {p.title}
              <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 4H4v12h12v-4M11 4h5v5M16 4l-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only"> {t("newTab")}</span>
            </a>
            {p.excerpt && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.excerpt}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
