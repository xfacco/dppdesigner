-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "defaultAuthorTitle" TEXT,
ADD COLUMN     "defaultAuthorUrl" TEXT;
