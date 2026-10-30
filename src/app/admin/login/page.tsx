import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getSession, roleOf } from "@/lib/session";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const session = await getSession();
  const role = roleOf(session);
  if (role === "ADMIN" || role === "EDITOR") redirect("/admin");

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <Card>
        <h1 className="text-xl font-semibold">Area amministrazione</h1>
        {session && (
          <p className="mt-2 text-sm text-destructive">Il tuo account non ha accesso all&apos;area admin.</p>
        )}
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </Card>
    </div>
  );
}
