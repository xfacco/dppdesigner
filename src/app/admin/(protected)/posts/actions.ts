"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PrismaPromise } from "@/generated/prisma/internal/prismaNamespace";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { LOCALES } from "@/server/wizard-admin";
import { guarded } from "../guarded";

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: solo minuscole, numeri e trattini");

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Slug da un titolo: minuscole senza accenti, parole separate da trattini. */
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "articolo";

export async function createPost(form: FormData) {
  await requireStaff();
  await guarded("/admin/posts", async () => {
    const title = z.string().trim().min(1, "Titolo obbligatorio").parse(str(form, "title"));
    // Slug unico anche se esiste già un articolo con lo stesso titolo
    let slug = slugify(title);
    for (let n = 2; await db.postTranslation.findFirst({ where: { locale: "it", slug } }); n++) slug = `${slugify(title)}-${n}`;
    const post = await db.post.create({ data: { translations: { create: [{ locale: "it", slug, title, body: "" }] } } });
    return `/admin/posts/${post.id}`;
  });
}

export async function updatePost(postId: string, form: FormData) {
  await requireStaff();
  const back = `/admin/posts/${postId}`;
  await guarded(back, async () => {
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    const status = z.enum(["DRAFT", "PUBLISHED"]).parse(str(form, "status"));
    const date = str(form, "publishedAt");
    // Alla prima pubblicazione senza data si usa oggi
    const publishedAt = date ? new Date(`${date}T09:00:00Z`) : status === "PUBLISHED" ? (post.publishedAt ?? new Date()) : null;

    await db.$transaction([
      db.post.update({
        where: { id: postId },
        data: { status, publishedAt, author: str(form, "author") || null },
      }),
      ...LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
        const title = str(form, `title_${locale}`);
        if (!title) return [db.postTranslation.deleteMany({ where: { postId, locale } })];
        const data = {
          slug: slugSchema.parse(str(form, `slug_${locale}`) || slugify(title)),
          title,
          excerpt: str(form, `excerpt_${locale}`) || null,
          body: str(form, `body_${locale}`),
        };
        return [
          db.postTranslation.upsert({
            where: { postId_locale: { postId, locale } },
            create: { postId, locale, ...data },
            update: data,
          }),
        ];
      }),
    ]);
    // Le pagine pubbliche leggono gli articoli dal DB: si aggiornano subito
    revalidatePath("/[locale]", "layout");
  });
}

export async function deletePost(postId: string) {
  await requireStaff();
  await guarded("/admin/posts", async () => {
    await db.post.delete({ where: { id: postId } });
    revalidatePath("/[locale]", "layout");
    return "/admin/posts";
  });
}
