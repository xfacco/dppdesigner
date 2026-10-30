"use server";

import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { contactSchema, type ContactInput } from "@/lib/schemas";

export async function sendContactMessage(input: ContactInput) {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  // Bot che compilano il campo nascosto: risposta positiva senza salvare nulla
  if (parsed.data.website) return { ok: true as const };

  const { name, email, company, message } = parsed.data;
  await db.contactMessage.create({
    data: { name, email, company: company || null, message, locale: await getLocale() },
  });
  return { ok: true as const };
}
