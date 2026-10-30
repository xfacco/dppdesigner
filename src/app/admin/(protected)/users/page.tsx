import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fmtDate, PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { deleteUserData } from "@/server/privacy";

async function setRole(userId: string, form: FormData) {
  "use server";
  const session = await requireAdmin();
  if (userId === session.user.id) return; // un admin non può togliersi il ruolo da solo
  const role = z.enum(["USER", "EDITOR", "ADMIN"]).parse(form.get("role"));
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

async function removeUser(userId: string) {
  "use server";
  const session = await requireAdmin();
  if (userId === session.user.id) return;
  await deleteUserData(userId);
  revalidatePath("/admin/users");
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireAdmin();
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Utenti"
        description="Ruoli: USER (cliente), EDITOR (contenuti e wizard), ADMIN (tutto, inclusi utenti). L'eliminazione cancella i dati personali; i progetti restano anonimi."
      />
      <form className="mb-4 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Cerca email o nome" className="max-w-xs" />
        <Button type="submit" variant="outline">
          Cerca
        </Button>
      </form>
      <div className="rounded-lg border bg-card">
        <Table>
          <thead>
            <tr>
              <Th>Utente</Th>
              <Th>Ruolo</Th>
              <Th>Ultimo accesso</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>
                  <span className="font-medium">{u.name}</span>
                  <span className="block text-xs text-muted-foreground">{u.email}</span>
                </Td>
                <Td>
                  {u.id === session.user.id ? (
                    <span className="text-sm">{u.role} (tu)</span>
                  ) : (
                    <form action={setRole.bind(null, u.id)} className="flex gap-2">
                      <Select name="role" defaultValue={u.role} className="h-8 w-32">
                        <option value="USER">USER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                      <Button type="submit" size="sm" variant="outline">
                        Salva
                      </Button>
                    </form>
                  )}
                </Td>
                <Td className="text-muted-foreground">{fmtDate(u.lastSeenAt)}</Td>
                <Td className="text-right">
                  {u.id !== session.user.id && (
                    <details className="inline-block text-left">
                      <summary className="cursor-pointer text-sm text-destructive">Elimina</summary>
                      <form action={removeUser.bind(null, u.id)} className="mt-2">
                        <Button type="submit" size="sm" variant="destructive">
                          Conferma eliminazione
                        </Button>
                      </form>
                    </details>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
