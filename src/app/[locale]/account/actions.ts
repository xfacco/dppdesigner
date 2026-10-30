"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { deleteUserData } from "@/server/privacy";

/**
 * "Elimina" un progetto dall'area personale: viene solo nascosto all'utente.
 * I dati restano nel database e l'admin li vede come "nascosti dall'utente".
 */
export async function hideJourney(journeyId: string) {
  const session = await getSession();
  if (!session) return;
  await db.journey.updateMany({
    where: { id: journeyId, userId: session.user.id, hiddenByUserAt: null },
    data: { hiddenByUserAt: new Date() },
  });
  revalidatePath(`/${await getLocale()}/account`);
}

export async function deleteAccount(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const confirm = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirm !== "ELIMINA" && confirm !== "DELETE") return;

  await deleteUserData(session.user.id);
  redirect(`/${await getLocale()}`);
}
