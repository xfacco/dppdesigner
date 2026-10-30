"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PrismaPromise } from "@/generated/prisma/internal/prismaNamespace";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { RESERVED_SLUGS, SYSTEM_PAGES } from "@/server/content";
import { keySchema, LOCALES } from "@/server/wizard-admin";
import { guarded } from "../guarded";

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: solo minuscole, numeri e trattini")
  .refine((s) => !RESERVED_SLUGS.includes(s), "Slug riservato a una pagina dell'applicazione");

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function createPage(form: FormData) {
  await requireStaff();
  await guarded("/admin/content", async () => {
    const key = keySchema.parse(str(form, "key").replace(/-/g, "_"));
    const page = await db.page.create({
      data: { key, position: await db.page.count(), translations: { create: [{ locale: "it", slug: slugSchema.parse(key.replace(/_/g, "-")), title: key, body: "" }] } },
    });
    return `/admin/content/${page.id}`;
  });
}

export async function updatePage(pageId: string, form: FormData) {
  await requireStaff();
  const back = `/admin/content/${pageId}`;
  await guarded(back, async () => {
    const page = await db.page.findUniqueOrThrow({ where: { id: pageId } });
    await db.$transaction([
      db.page.update({
        where: { id: pageId },
        data: {
          status: z.enum(["DRAFT", "PUBLISHED"]).parse(str(form, "status")),
          showInMenu: form.get("showInMenu") === "on",
          position: z.coerce.number().int().parse(str(form, "position") || "0"),
        },
      }),
      ...LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
        const title = str(form, `title_${locale}`);
        if (!title) return [db.pageTranslation.deleteMany({ where: { pageId, locale } })];
        const data = {
          // Le pagine di sistema hanno un percorso fisso: lo slug serve solo come identificativo
          slug: SYSTEM_PAGES[page.key] ? `${page.key.replace(/_/g, "-")}-${locale}` : slugSchema.parse(str(form, `slug_${locale}`)),
          title,
          description: str(form, `description_${locale}`) || null,
          body: str(form, `body_${locale}`),
        };
        return [
          db.pageTranslation.upsert({
            where: { pageId_locale: { pageId, locale } },
            create: { pageId, locale, ...data },
            update: data,
          }),
        ];
      }),
    ]);
    // Le pagine pubbliche leggono i contenuti dal DB: si aggiornano subito
    revalidatePath("/[locale]", "layout");
  });
}

export async function deletePage(pageId: string) {
  await requireStaff();
  await guarded("/admin/content", async () => {
    const page = await db.page.findUniqueOrThrow({ where: { id: pageId } });
    if (SYSTEM_PAGES[page.key]) throw new Error("Le pagine di sistema non possono essere eliminate.");
    await db.page.delete({ where: { id: pageId } });
    revalidatePath("/[locale]", "layout");
    return "/admin/content";
  });
}
