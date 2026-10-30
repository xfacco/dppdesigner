import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { ZodError } from "zod";

function messageOf(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "Chiave o slug già in uso.";
  if (e instanceof ZodError) return e.issues.map((i) => `${i.path.join(".") || "valore"}: ${i.message}`).join("; ");
  if (e instanceof Error) return e.message;
  return "Operazione non riuscita.";
}

/**
 * Esegue una mutazione admin: in caso di errore torna alla pagina con ?error=…,
 * altrimenti invalida la pagina (o va a `then` se indicato).
 */
export async function guarded(back: string, fn: () => Promise<string | void>) {
  let error: string | null = null;
  let then: string | void = undefined;
  try {
    then = await fn();
  } catch (e) {
    error = messageOf(e);
  }
  revalidatePath(back);
  if (error) redirect(`${back}?error=${encodeURIComponent(error)}`);
  if (then) redirect(then);
}
