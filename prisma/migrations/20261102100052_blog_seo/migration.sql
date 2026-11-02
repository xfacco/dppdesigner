-- AlterTable
ALTER TABLE "post_translations" ADD COLUMN     "coverImageAlt" TEXT,
ADD COLUMN     "faq" TEXT,
ADD COLUMN     "keyTakeaways" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "sources" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "authorTitle" TEXT,
ADD COLUMN     "authorUrl" TEXT,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "organizationName" TEXT NOT NULL DEFAULT 'DPP Designer',
    "organizationUrl" TEXT,
    "logoUrl" TEXT,
    "sameAs" TEXT,
    "defaultOgImageUrl" TEXT,
    "twitterHandle" TEXT,
    "defaultAuthor" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
