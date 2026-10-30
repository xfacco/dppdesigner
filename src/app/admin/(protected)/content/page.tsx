import Link from "next/link";
import { ErrorFlash } from "@/components/admin/flash";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";
import { SYSTEM_PAGES } from "@/server/content";
import { createPage } from "./actions";

export default async function ContentList({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const pages = await db.page.findMany({ orderBy: { position: "asc" }, include: { translations: true } });

  return (
    <div>
      <PageHeader
        title="Contenuti"
        description="Pagine del sito in italiano e inglese. Il testo è in Markdown."
        actions={
          <form action={createPage} className="flex gap-2">
            <Input name="key" placeholder="chiave nuova pagina" required className="w-48" />
            <Button type="submit">Nuova pagina</Button>
          </form>
        }
      />
      <ErrorFlash error={error} />
      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Pagina</Th>
              <Th>Stato</Th>
              <Th>Menu</Th>
              <Th>Lingue</Th>
              <Th>Aggiornata</Th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const it = p.translations.find((t) => t.locale === "it");
              return (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/admin/content/${p.id}`} className="font-medium hover:underline">
                      {it?.title ?? p.key}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">{p.key}</span>
                  </Td>
                  <Td>
                    <Badge tone={p.status === "PUBLISHED" ? "primary" : "warning"}>{p.status === "PUBLISHED" ? "Pubblicata" : "Bozza"}</Badge>
                  </Td>
                  <Td>
                    {SYSTEM_PAGES[p.key] ? (
                      <Badge>sistema · /{SYSTEM_PAGES[p.key].path.replace(/^\//, "") || "home"}</Badge>
                    ) : p.showInMenu ? (
                      `#${p.position}`
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {["it", "en"].map((l) => (
                      <Badge key={l} tone={p.translations.some((t) => t.locale === l) ? "primary" : "warning"} className="mr-1 uppercase">
                        {l}
                      </Badge>
                    ))}
                  </Td>
                  <Td className="text-muted-foreground">{fmtDate(p.updatedAt)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
