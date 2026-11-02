"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { guarded } from "../guarded";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optionalUrl = z
  .string()
  .trim()
  .refine((u) => !u || /^https?:\/\//.test(u) || u.startsWith("/"), "Indirizzo: deve iniziare con https:// oppure /")
  .transform((u) => u || null);

export async function updateSiteSettings(form: FormData) {
  await requireStaff();
  await guarded("/admin/seo", async () => {
    const sameAs = str(form, "sameAs")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const bad = sameAs.find((u) => !/^https?:\/\//.test(u));
    if (bad) throw new Error(`Profilo non valido: ${bad} (serve l'indirizzo completo https://…)`);
    const data = {
      organizationName: z.string().trim().min(1, "Nome obbligatorio").parse(str(form, "organizationName")),
      organizationUrl: optionalUrl.parse(str(form, "organizationUrl")),
      logoUrl: optionalUrl.parse(str(form, "logoUrl")),
      sameAs: sameAs.join("\n") || null,
      defaultOgImageUrl: optionalUrl.parse(str(form, "defaultOgImageUrl")),
      twitterHandle: str(form, "twitterHandle").replace(/^@/, "") || null,
      defaultAuthor: str(form, "defaultAuthor") || null,
      defaultAuthorTitle: str(form, "defaultAuthorTitle") || null,
      defaultAuthorUrl: optionalUrl.parse(str(form, "defaultAuthorUrl")),
    };
    await db.siteSettings.upsert({ where: { id: "site" }, create: { id: "site", ...data }, update: data });
    revalidatePath("/[locale]", "layout");
  });
}
