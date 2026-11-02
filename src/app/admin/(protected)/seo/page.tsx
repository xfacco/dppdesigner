import { ErrorFlash } from "@/components/admin/flash";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { db } from "@/lib/db";
import { updateSiteSettings } from "./actions";

const hint = "text-xs text-muted-foreground";

export default async function SeoSettings({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const s = await db.siteSettings.findUnique({ where: { id: "site" } });

  return (
    <div>
      <PageHeader
        title="SEO"
        description="Dati dell'organizzazione e valori predefiniti per motori di ricerca, social e motori AI. Valgono per tutto il sito."
      />
      <ErrorFlash error={error} />
      <form action={updateSiteSettings} className="grid max-w-3xl gap-6">
        <Card className="grid gap-4">
          <p className="text-sm font-semibold">Organizzazione (schema.org Organization)</p>
          <Field>
            <Label htmlFor="organizationName">Nome</Label>
            <Input id="organizationName" name="organizationName" defaultValue={s?.organizationName ?? "DPP Designer"} required />
          </Field>
          <Field>
            <Label htmlFor="organizationUrl">Sito ufficiale</Label>
            <Input id="organizationUrl" name="organizationUrl" defaultValue={s?.organizationUrl ?? ""} placeholder="vuoto = indirizzo di questo sito" />
          </Field>
          <Field>
            <Label htmlFor="logoUrl">Logo (URL o percorso)</Label>
            <Input id="logoUrl" name="logoUrl" defaultValue={s?.logoUrl ?? ""} placeholder="vuoto = /logo.svg" />
          </Field>
          <Field>
            <Label htmlFor="sameAs">Profili ufficiali (uno per riga)</Label>
            <Textarea id="sameAs" name="sameAs" defaultValue={s?.sameAs ?? ""} rows={4} placeholder={"https://www.linkedin.com/company/…\nhttps://x.com/…"} />
            <p className={hint}>Diventano «sameAs»: collegano il sito ai profili social e aiutano Google e i motori AI a riconoscere l&apos;organizzazione come entità.</p>
          </Field>
        </Card>

        <Card className="grid gap-4">
          <p className="text-sm font-semibold">Condivisione e autore</p>
          <Field>
            <Label htmlFor="defaultOgImageUrl">Immagine di condivisione predefinita (1200×630)</Label>
            <Input id="defaultOgImageUrl" name="defaultOgImageUrl" defaultValue={s?.defaultOgImageUrl ?? ""} placeholder="https://… oppure /…" />
            <p className={hint}>Usata da social e app di messaggistica quando una pagina o un articolo non ha un&apos;immagine propria.</p>
          </Field>
          <Field>
            <Label htmlFor="twitterHandle">Account X (Twitter)</Label>
            <Input id="twitterHandle" name="twitterHandle" defaultValue={s?.twitterHandle ? `@${s.twitterHandle}` : ""} placeholder="@account" />
          </Field>
        </Card>

        <Card className="grid gap-4">
          <p className="text-sm font-semibold">Persona di riferimento e autore predefinito (E-E-A-T)</p>
          <p className={hint}>
            Compare come autore di articoli e pagine principali quando non ne è indicato un altro, ed è la persona (schema.org Person) della
            pagina Chi sono e il fondatore dell&apos;organizzazione nei dati strutturati.
          </p>
          <Field>
            <Label htmlFor="defaultAuthor">Nome</Label>
            <Input id="defaultAuthor" name="defaultAuthor" defaultValue={s?.defaultAuthor ?? ""} placeholder="es. Mario Rossi" />
          </Field>
          <Field>
            <Label htmlFor="defaultAuthorTitle">Ruolo</Label>
            <Input id="defaultAuthorTitle" name="defaultAuthorTitle" defaultValue={s?.defaultAuthorTitle ?? ""} placeholder="es. CTO & Innovation Manager" />
          </Field>
          <Field>
            <Label htmlFor="defaultAuthorUrl">Profilo (LinkedIn o pagina personale)</Label>
            <Input id="defaultAuthorUrl" name="defaultAuthorUrl" defaultValue={s?.defaultAuthorUrl ?? ""} placeholder="https://www.linkedin.com/in/…" />
          </Field>
        </Card>

        <div>
          <Button type="submit">Salva impostazioni</Button>
        </div>
      </form>
    </div>
  );
}
