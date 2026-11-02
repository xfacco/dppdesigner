import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { blogPath, blogSegment } from "@/lib/blog";
import { db } from "@/lib/db";
import { deletePost, updatePost } from "../actions";

export default async function PostEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const post = await db.post.findUnique({ where: { id }, include: { translations: true } });
  if (!post) notFound();
  const tr = (l: string) => post.translations.find((t) => t.locale === l);

  return (
    <div>
      <PageHeader
        title={tr("it")?.title ?? tr("en")?.title ?? "Articolo"}
        description={post.status === "PUBLISHED" ? "Pubblicato" : "Bozza: non visibile sul sito"}
        actions={
          <>
            {post.status === "PUBLISHED" &&
              (["it", "en"] as const).map((l) =>
                tr(l) ? (
                  <Link key={l} href={blogPath(l, tr(l)!.slug)} target="_blank" className="self-center text-sm text-primary underline">
                    Apri {l.toUpperCase()}
                  </Link>
                ) : null,
              )}
            <Link href="/admin/posts" className="self-center text-sm text-muted-foreground hover:underline">
              ← Articoli
            </Link>
          </>
        }
      />
      <ErrorFlash error={error} />
      <form action={updatePost.bind(null, post.id)} className="grid gap-6">
        <Card className="flex flex-wrap items-end gap-4">
          <Field>
            <Label htmlFor="status">Stato</Label>
            <Select id="status" name="status" defaultValue={post.status} className="w-40">
              <option value="DRAFT">Bozza</option>
              <option value="PUBLISHED">Pubblicato</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="publishedAt">Data di pubblicazione</Label>
            <Input id="publishedAt" name="publishedAt" type="date" defaultValue={post.publishedAt?.toISOString().slice(0, 10)} className="w-44" />
          </Field>
          <Field>
            <Label htmlFor="author">Autore</Label>
            <Input id="author" name="author" defaultValue={post.author ?? ""} placeholder="facoltativo" className="w-56" />
          </Field>
          <p className="pb-2 text-xs text-muted-foreground">Senza data, alla pubblicazione si usa la data di oggi.</p>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {(["it", "en"] as const).map((l) => (
            <Card key={l} className="grid gap-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">{l === "it" ? "Italiano" : "English"}</p>
              <Field>
                <Label htmlFor={`title_${l}`}>Titolo</Label>
                <Input id={`title_${l}`} name={`title_${l}`} defaultValue={tr(l)?.title} />
              </Field>
              <Field>
                <Label htmlFor={`slug_${l}`}>Slug (URL)</Label>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  /{l}/{blogSegment(l)}/
                  <Input id={`slug_${l}`} name={`slug_${l}`} defaultValue={tr(l)?.slug} placeholder="dal titolo" />
                </div>
              </Field>
              <Field>
                <Label htmlFor={`excerpt_${l}`}>Sommario (anteprima e meta description)</Label>
                <Textarea id={`excerpt_${l}`} name={`excerpt_${l}`} defaultValue={tr(l)?.excerpt ?? ""} rows={2} maxLength={300} />
              </Field>
              <Field>
                <Label htmlFor={`body_${l}`}>Testo (Markdown)</Label>
                <Textarea id={`body_${l}`} name={`body_${l}`} defaultValue={tr(l)?.body} rows={24} className="font-mono text-xs" />
              </Field>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Un articolo compare nella lingua in cui ha un titolo. Lasciando vuoto il titolo di una lingua, la traduzione viene rimossa. Usa
          titoli di sezione con <code>##</code>.
        </p>
        <div className="flex gap-2">
          <Button type="submit">Salva articolo</Button>
          <Button formAction={deletePost.bind(null, post.id)} variant="ghost" className="text-destructive">
            Elimina articolo
          </Button>
        </div>
      </form>
    </div>
  );
}
