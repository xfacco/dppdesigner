import { routing } from "@/i18n/routing";
import { getPost } from "@/server/blog";
import { postMarkdown } from "@/server/blog-markdown";
import { pageMarkdown } from "@/server/pages-markdown";

export const dynamic = "force-dynamic";

/** Versione Markdown di un articolo o di una pagina pubblicata: /md/<lingua>/<slug>.md (per i modelli linguistici). */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; file: string }> }) {
  const { locale, file } = await params;
  const slug = file.replace(/\.md$/, "");
  const valid = routing.locales.includes(locale as never) && file.endsWith(".md");
  const post = valid ? await getPost(locale, slug) : null;
  if (!post) {
    const page = valid ? await pageMarkdown(locale, slug) : null;
    if (!page) return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    return new Response(page, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
  }
  return new Response(await postMarkdown(locale, post), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Gli articoli esclusi dall'indicizzazione restano esclusi anche in questa versione
      ...(post.noindex ? { "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
