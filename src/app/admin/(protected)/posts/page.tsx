import Link from "next/link";
import { ErrorFlash } from "@/components/admin/flash";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";
import { createPost } from "./actions";

export default async function PostList({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const posts = await db.post.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    include: { translations: true },
  });

  return (
    <div>
      <PageHeader
        title="Articoli"
        description="Il blog del sito, in italiano e inglese: /it/articoli e /en/articles. Il testo è in Markdown."
        actions={
          <form action={createPost} className="flex gap-2">
            <Input name="title" placeholder="Titolo del nuovo articolo" required className="w-64" />
            <Button type="submit">Nuovo articolo</Button>
          </form>
        }
      />
      <ErrorFlash error={error} />
      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Articolo</Th>
              <Th>Stato</Th>
              <Th>Data</Th>
              <Th>Lingue</Th>
              <Th>Aggiornato</Th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-muted-foreground">
                  Nessun articolo: scrivi il titolo qui sopra e premi «Nuovo articolo».
                </Td>
              </tr>
            )}
            {posts.map((p) => {
              const it = p.translations.find((t) => t.locale === "it") ?? p.translations[0];
              return (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/admin/posts/${p.id}`} className="font-medium hover:underline">
                      {it?.title ?? "—"}
                    </Link>
                    {p.author && <span className="block text-xs text-muted-foreground">{p.author}</span>}
                  </Td>
                  <Td>
                    <Badge tone={p.status === "PUBLISHED" ? "primary" : "warning"}>{p.status === "PUBLISHED" ? "Pubblicato" : "Bozza"}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">{p.publishedAt ? fmtDate(p.publishedAt) : "—"}</Td>
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
