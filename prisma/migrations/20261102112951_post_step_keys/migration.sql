-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "stepKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
