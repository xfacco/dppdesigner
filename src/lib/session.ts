import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export type AppRole = "USER" | "EDITOR" | "ADMIN";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export function roleOf(session: Awaited<ReturnType<typeof getSession>>): AppRole | null {
  return (session?.user.role as AppRole | undefined) ?? null;
}

/** Per pagine e Server Action dell'area admin. Il controllo avviene sempre lato server. */
export async function requireStaff(roles: AppRole[] = ["EDITOR", "ADMIN"]) {
  const session = await getSession();
  const role = roleOf(session);
  if (!session || !role || !roles.includes(role)) redirect("/admin/login");
  return session;
}

export const requireAdmin = () => requireStaff(["ADMIN"]);
