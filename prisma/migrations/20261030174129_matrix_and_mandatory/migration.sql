-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'MATRIX';

-- AlterTable
ALTER TABLE "step_suggestions" ADD COLUMN     "mandatory" BOOLEAN NOT NULL DEFAULT false;
