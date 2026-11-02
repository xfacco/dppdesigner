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

const optionalUrl = z
  .string()
  .trim()
  .refine((u) => !u || /^https?:\/\//.test(u) || u.startsWith("/"), "Indirizzo: deve iniziare con https:// oppure /")
  .transform((u) => u || null);

export async function updatePost(postId: string, form: FormData) {
  await requireStaff();
  const back = `/admin/posts/${postId}`;
  await guarded(back, async () => {
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    const status = z.enum(["DRAFT", "PUBLISHED"]).parse(str(form, "status"));
    const date = str(form, "publishedAt");
    const reviewed = str(form, "reviewedAt");
    // Alla prima pubblicazione senza data si usa oggi
    const publishedAt = date ? new Date(`${date}T09:00:00Z`) : status === "PUBLISHED" ? (post.publishedAt ?? new Date()) : null;
    const tags = [...new Set(str(form, "tags").split(",").map((t) => t.trim()).filter(Boolean))];
    const stepKeys = [...new Set(form.getAll("stepKeys").map(String).filter(Boolean))];

    await db.$transaction([
      db.post.update({
        where: { id: postId },
        data: {
          status,
          publishedAt,
          reviewedAt: reviewed ? new Date(`${reviewed}T09:00:00Z`) : null,
          author: str(form, "author") || null,
          authorTitle: str(form, "authorTitle") || null,
          authorUrl: optionalUrl.parse(str(form, "authorUrl")),
          coverImageUrl: optionalUrl.parse(str(form, "coverImageUrl")),
          category: str(form, "category") || null,
          tags,
          noindex: form.get("noindex") === "on",
          canonicalUrl: optionalUrl.parse(str(form, "canonicalUrl")),
          stepKeys,
        },
      }),
      ...LOCALES.flatMap((locale): PrismaPromise<unknown>[] => {
        const title = str(form, `title_${locale}`);
        if (!title) return [db.postTranslation.deleteMany({ where: { postId, locale } })];
        const data = {
          slug: slugSchema.parse(str(form, `slug_${locale}`) || slugify(title)),
          title,
          excerpt: str(form, `excerpt_${locale}`) || null,
          body: str(form, `body_${locale}`),
          seoTitle: str(form, `seoTitle_${locale}`) || null,
          seoDescription: str(form, `seoDescription_${locale}`) || null,
          coverImageAlt: str(form, `coverImageAlt_${locale}`) || null,
          keyTakeaways: str(form, `keyTakeaways_${locale}`) || null,
          faq: str(form, `faq_${locale}`) || null,
          sources: str(form, `sources_${locale}`) || null,
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

/**
 * Dall'editor di uno step del wizard: imposta quali articoli fanno da approfondimento a quello step.
 * Il collegamento è per chiave dello step, quindi vale per tutte le versioni del wizard.
 */
export async function setStepArticles(stepKey: string, back: string, form: FormData) {
  await requireStaff();
  await guarded(back, async () => {
    const chosen = new Set(form.getAll("postIds").map(String));
    const posts = await db.post.findMany({ select: { id: true, stepKeys: true } });
    await db.$transaction(
      posts.flatMap((p) => {
        const has = p.stepKeys.includes(stepKey);
        if (chosen.has(p.id) === has) return [];
        const stepKeys = has ? p.stepKeys.filter((k) => k !== stepKey) : [...p.stepKeys, stepKey];
        return [db.post.update({ where: { id: p.id }, data: { stepKeys } })];
      }),
    );
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
