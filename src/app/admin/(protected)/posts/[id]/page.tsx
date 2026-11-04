import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { blogMarkdownPath, blogPath, blogSegment } from "@/lib/blog";
import { db } from "@/lib/db";
import { deletePost, updatePost } from "../actions";

const day = (d: Date | null) => d?.toISOString().slice(0, 10);
const hint = "text-xs text-muted-foreground";

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
  // Step della versione pubblicata, poi quelli presenti solo nella bozza (le chiavi valgono per tutte le versioni)
  const versions = await db.wizardVersion.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    orderBy: { number: "asc" },
    include: { steps: { orderBy: { position: "asc" }, include: { translations: { where: { locale: "it" } } } } },
  });
  const stepOptions = new Map<string, string>();
  for (const v of [...versions].sort((a, b) => (a.status === "PUBLISHED" ? -1 : b.status === "PUBLISHED" ? 1 : 0)))
    for (const s of v.steps) if (!stepOptions.has(s.key)) stepOptions.set(s.key, s.translations[0]?.title ?? s.key);
  // Chiavi collegate che non esistono più nel wizard: restano visibili per poterle togliere
  for (const k of post.stepKeys) if (!stepOptions.has(k)) stepOptions.set(k, `${k} (non più nel wizard)`);

  return (
    <div>
      <PageHeader
        title={tr("it")?.title ?? tr("en")?.title ?? "Articolo"}
        description={post.status === "PUBLISHED" ? (post.noindex ? "Pubblicato, escluso dai motori di ricerca" : "Pubblicato") : "Bozza: non visibile sul sito"}
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
        {/* ─── Pubblicazione ─── */}
        <Card className="grid gap-4">
          <p className="text-sm font-semibold">Pubblicazione</p>
          <div className="flex flex-wrap items-end gap-4">
            <Field>
              <Label htmlFor="status">Stato</Label>
              <Select id="status" name="status" defaultValue={post.status} className="w-40">
                <option value="DRAFT">Bozza</option>
                <option value="PUBLISHED">Pubblicato</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="publishedAt">Data di pubblicazione</Label>
              <Input id="publishedAt" name="publishedAt" type="date" defaultValue={day(post.publishedAt)} className="w-44" />
            </Field>
            <Field>
              <Label htmlFor="reviewedAt">Ultima revisione dei contenuti</Label>
              <Input id="reviewedAt" name="reviewedAt" type="date" defaultValue={day(post.reviewedAt)} className="w-44" />
            </Field>
          </div>
          <p className={hint}>
            Senza data, alla pubblicazione si usa quella di oggi. La data di revisione diventa la «data di modifica» per Google e i motori AI: aggiornala
            quando rivedi davvero i contenuti (se vuota si usa l&apos;ultimo salvataggio).
          </p>
        </Card>

        {/* ─── Autore ─── */}
        <Card className="grid gap-4">
          <p className="text-sm font-semibold">Autore (autorevolezza, E-E-A-T)</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Field>
              <Label htmlFor="author">Nome</Label>
              <Input id="author" name="author" defaultValue={post.author ?? ""} placeholder="vuoto = autore predefinito (Admin → SEO)" />
            </Field>
            <Field>
              <Label htmlFor="authorTitle">Ruolo / competenza</Label>
              <Input id="authorTitle" name="authorTitle" defaultValue={post.authorTitle ?? ""} placeholder="es. Consulente ESPR e DPP" />
            </Field>
            <Field>
              <Label htmlFor="authorUrl">Profilo (LinkedIn o pagina autore)</Label>
              <Input id="authorUrl" name="authorUrl" defaultValue={post.authorUrl ?? ""} placeholder="https://www.linkedin.com/in/…" />
            </Field>
          </div>
          <p className={hint}>Nome, ruolo e profilo compaiono nell&apos;articolo e nei dati strutturati (Person): aiutano Google e i motori AI a fidarsi della fonte.</p>
        </Card>

        {/* ─── Classificazione e indicizzazione ─── */}
        <Card className="grid gap-4">
          <p className="text-sm font-semibold">Classificazione e indicizzazione</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" defaultValue={post.category ?? ""} placeholder="es. Normativa" />
            </Field>
            <Field>
              <Label htmlFor="tags">Tag (separati da virgola)</Label>
              <Input id="tags" name="tags" defaultValue={post.tags.join(", ")} placeholder="ESPR, batterie, QR code" />
            </Field>
            <Field>
              <Label htmlFor="coverImageUrl">Immagine di copertina (URL o percorso)</Label>
              <Input id="coverImageUrl" name="coverImageUrl" defaultValue={post.coverImageUrl ?? ""} placeholder="https://… oppure /immagini/…" />
            </Field>
            <Field>
              <Label htmlFor="canonicalUrl">URL canonico esterno</Label>
              <Input id="canonicalUrl" name="canonicalUrl" defaultValue={post.canonicalUrl ?? ""} placeholder="solo se l'articolo è già pubblicato altrove" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="noindex" defaultChecked={post.noindex} />
            Escludi dai motori di ricerca (noindex): resta visibile sul sito, ma non va in sitemap, llms.txt e risultati di ricerca
          </label>
          <p className={hint}>
            Categoria e tag servono per gli articoli correlati e diventano articleSection e keywords nei dati strutturati. L&apos;immagine di copertina è
            anche l&apos;immagine di condivisione (consigliata 1200×630).
          </p>
        </Card>

        {/* ─── Step del wizard ─── */}
        <Card className="grid gap-3">
          <p className="text-sm font-semibold">Approfondimento degli step del wizard</p>
          <p className={hint}>
            Negli step selezionati l&apos;articolo compare nel riquadro «Articoli di approfondimento», con un link che si apre in una nuova scheda.
            Il collegamento vale per tutte le versioni del wizard.
          </p>
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {[...stepOptions].map(([key, title]) => (
              <label key={key} className="flex items-start gap-2 text-sm">
                <Checkbox name="stepKeys" value={key} defaultChecked={post.stepKeys.includes(key)} className="mt-0.5" />
                <span>
                  {title} <span className="font-mono text-xs text-muted-foreground">{key}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {(["it", "en"] as const).map((l) => (
            <Card key={l} className="grid content-start gap-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">{l === "it" ? "Italiano" : "English"}</p>
              <Field>
                <Label htmlFor={`title_${l}`}>Titolo (H1)</Label>
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
                <Label htmlFor={`excerpt_${l}`}>Sommario</Label>
                <Textarea id={`excerpt_${l}`} name={`excerpt_${l}`} defaultValue={tr(l)?.excerpt ?? ""} rows={2} maxLength={300} />
                <p className={hint}>Sotto il titolo e nell&apos;elenco: una o due frasi che rispondono subito alla domanda dell&apos;articolo.</p>
              </Field>

              <details className="rounded-md border px-3 py-2" open={Boolean(tr(l)?.seoTitle || tr(l)?.seoDescription)}>
                <summary className="cursor-pointer text-sm font-medium">SEO: titolo e descrizione per i risultati di ricerca</summary>
                <div className="mt-3 grid gap-3">
                  <Field>
                    <Label htmlFor={`seoTitle_${l}`}>Meta title (≈ 60 caratteri)</Label>
                    <Input id={`seoTitle_${l}`} name={`seoTitle_${l}`} defaultValue={tr(l)?.seoTitle ?? ""} maxLength={70} placeholder="vuoto = titolo" />
                  </Field>
                  <Field>
                    <Label htmlFor={`seoDescription_${l}`}>Meta description (≈ 155 caratteri)</Label>
                    <Textarea id={`seoDescription_${l}`} name={`seoDescription_${l}`} defaultValue={tr(l)?.seoDescription ?? ""} rows={2} maxLength={300} placeholder="vuoto = sommario" />
                  </Field>
                  <Field>
                    <Label htmlFor={`coverImageAlt_${l}`}>Testo alternativo dell&apos;immagine</Label>
                    <Input id={`coverImageAlt_${l}`} name={`coverImageAlt_${l}`} defaultValue={tr(l)?.coverImageAlt ?? ""} />
                  </Field>
                </div>
              </details>

              <Field>
                <Label htmlFor={`keyTakeaways_${l}`}>In breve: punti chiave (uno per riga)</Label>
                <Textarea id={`keyTakeaways_${l}`} name={`keyTakeaways_${l}`} defaultValue={tr(l)?.keyTakeaways ?? ""} rows={4} />
                <p className={hint}>Non compare nella pagina: va nei dati strutturati (abstract) e nella versione Markdown per le AI. Frasi brevi e autosufficienti, con numeri e date: è la parte che i motori AI citano più volentieri.</p>
              </Field>
              <Field>
                <Label htmlFor={`body_${l}`}>Testo (Markdown)</Label>
                <Textarea id={`body_${l}`} name={`body_${l}`} defaultValue={tr(l)?.body} rows={24} className="font-mono text-xs" />
                <p className={hint}>
                  Usa titoli <code>##</code> formulati come domande o affermazioni chiare: diventano l&apos;indice dell&apos;articolo, con un link diretto a ogni
                  sezione. Paragrafi brevi, elenchi e tabelle aiutano lettori e motori AI.
                </p>
              </Field>
              <Field>
                <Label htmlFor={`faq_${l}`}>Domande frequenti</Label>
                <Textarea
                  id={`faq_${l}`}
                  name={`faq_${l}`}
                  defaultValue={tr(l)?.faq ?? ""}
                  rows={6}
                  placeholder={"Cos'è il Digital Product Passport?\nUn passaporto digitale che…\n\nQuando diventa obbligatorio?\nDipende dalla categoria di prodotto…"}
                />
                <p className={hint}>Una domanda per blocco: prima riga la domanda, sotto la risposta; separa i blocchi con una riga vuota. Diventano la sezione «Domande frequenti» e i dati FAQPage.</p>
              </Field>
              <Field>
                <Label htmlFor={`sources_${l}`}>Fonti (Titolo | URL, una per riga, oppure Markdown)</Label>
                <Textarea
                  id={`sources_${l}`}
                  name={`sources_${l}`}
                  defaultValue={tr(l)?.sources ?? ""}
                  rows={6}
                  placeholder={"Regolamento (UE) 2024/1781 (ESPR) | https://eur-lex.europa.eu/eli/reg/2024/1781/oj/ita\n\noppure in Markdown:\n* [Regolamento (UE) 2024/1781 (ESPR)](https://eur-lex.europa.eu/eli/reg/2024/1781/oj/ita)\n  Descrizione facoltativa sulla riga sotto."}
                />
                <p className={hint}>Elencate in fondo all&apos;articolo e come «citation» nei dati strutturati: fonti ufficiali rendono l&apos;articolo più citabile. In Markdown il testo sotto un link diventa la sua descrizione; titoli (###) e separatori (---) vengono ignorati.</p>
              </Field>
              {post.status === "PUBLISHED" && tr(l) && (
                <p className={hint}>
                  Versione per i modelli AI:{" "}
                  <a href={blogMarkdownPath(l, tr(l)!.slug)} target="_blank" className="underline">
                    {blogMarkdownPath(l, tr(l)!.slug)}
                  </a>
                </p>
              )}
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Un articolo compare nella lingua in cui ha un titolo. Lasciando vuoto il titolo di una lingua, la traduzione viene rimossa. Organizzazione,
          logo, profili social e immagine di condivisione predefinita si impostano in{" "}
          <Link href="/admin/seo" className="underline">
            Admin → SEO
          </Link>
          .
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
