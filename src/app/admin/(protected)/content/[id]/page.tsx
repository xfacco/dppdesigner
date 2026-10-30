import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { db } from "@/lib/db";
import { SYSTEM_PAGES } from "@/server/content";
import { deletePage, updatePage } from "../actions";

export default async function ContentEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const page = await db.page.findUnique({ where: { id }, include: { translations: true } });
  if (!page) notFound();
  const tr = (l: string) => page.translations.find((t) => t.locale === l);
  const system = SYSTEM_PAGES[page.key];
  const isSystem = Boolean(system);

  return (
    <div>
      <PageHeader
        title={tr("it")?.title ?? page.key}
        description={<span className="font-mono">{page.key}</span>}
        actions={
          <>
            {(["it", "en"] as const).map((l) =>
              tr(l) ? (
                <Link key={l} href={system ? `/${l}${system.path}` : `/${l}/${tr(l)!.slug}`} target="_blank" className="self-center text-sm text-primary underline">
                  Apri {l.toUpperCase()}
                </Link>
              ) : null,
            )}
            <Link href="/admin/content" className="self-center text-sm text-muted-foreground hover:underline">
              ← Contenuti
            </Link>
          </>
        }
      />
      <ErrorFlash error={error} />
      {system && (
        <p className="mb-6 rounded-md bg-accent/50 px-4 py-3 text-sm">
          Pagina di sistema «{system.label}»: è sempre servita su <code>/it{system.path}</code> e <code>/en{system.path}</code>, non
          compare nel menu e non si può eliminare.
          {page.key === "wizard_intro" &&
            " Sotto il testo vengono aggiunti automaticamente i pulsanti per iniziare e l'elenco degli step del wizard pubblicato."}
          {page.status === "DRAFT" && " Finché è in bozza, il sito mostra il testo predefinito."}
        </p>
      )}
      <form action={updatePage.bind(null, page.id)} className="grid gap-6">
        <Card className="flex flex-wrap items-end gap-4">
          <Field>
            <Label htmlFor="status">Stato</Label>
            <Select id="status" name="status" defaultValue={page.status} className="w-40">
              <option value="DRAFT">Bozza</option>
              <option value="PUBLISHED">Pubblicata</option>
            </Select>
          </Field>
          {!isSystem && (
            <>
              <Field>
                <Label htmlFor="position">Ordine nel menu</Label>
                <Input id="position" name="position" type="number" defaultValue={page.position} className="w-28" />
              </Field>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <Checkbox name="showInMenu" defaultChecked={page.showInMenu} />
                Mostra nel menu
              </label>
            </>
          )}
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {(["it", "en"] as const).map((l) => (
            <Card key={l} className="grid gap-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">{l === "it" ? "Italiano" : "English"}</p>
              <Field>
                <Label htmlFor={`title_${l}`}>Titolo</Label>
                <Input id={`title_${l}`} name={`title_${l}`} defaultValue={tr(l)?.title} required={l === "it"} />
              </Field>
              {!isSystem && (
                <Field>
                  <Label htmlFor={`slug_${l}`}>Slug (URL)</Label>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    /{l}/
                    <Input id={`slug_${l}`} name={`slug_${l}`} defaultValue={tr(l)?.slug} />
                  </div>
                </Field>
              )}
              <Field>
                <Label htmlFor={`description_${l}`}>Meta description (SEO)</Label>
                <Input id={`description_${l}`} name={`description_${l}`} defaultValue={tr(l)?.description ?? ""} maxLength={300} />
              </Field>
              <Field>
                <Label htmlFor={`body_${l}`}>Testo (Markdown)</Label>
                <Textarea id={`body_${l}`} name={`body_${l}`} defaultValue={tr(l)?.body} rows={22} className="font-mono text-xs" />
              </Field>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Lasciando vuoto il titolo di una lingua, la traduzione viene rimossa.</p>
        <div className="flex gap-2">
          <Button type="submit">Salva pagina</Button>
          {!isSystem && (
            <Button formAction={deletePage.bind(null, page.id)} variant="ghost" className="text-destructive">
              Elimina pagina
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
