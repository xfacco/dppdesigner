import { routing } from "@/i18n/routing";
import { getPost } from "@/server/blog";
import { postMarkdown } from "@/server/blog-markdown";

export const dynamic = "force-dynamic";

/** Versione Markdown di un articolo pubblicato: /md/<lingua>/<slug>.md (per i modelli linguistici). */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; file: string }> }) {
  const { locale, file } = await params;
  const slug = file.replace(/\.md$/, "");
  const post = routing.locales.includes(locale as never) && file.endsWith(".md") ? await getPost(locale, slug) : null;
  if (!post) return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(await postMarkdown(locale, post), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Gli articoli esclusi dall'indicizzazione restano esclusi anche in questa versione
      ...(post.noindex ? { "X-Robots-Tag": "noindex" } : {}),
    },
  });
}
