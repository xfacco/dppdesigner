-- CreateEnum
CREATE TYPE "QuestionChannel" AS ENUM ('AI', 'EXPERT');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'ANSWERED');

-- CreateTable
CREATE TABLE "step_questions" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "channel" "QuestionChannel" NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',
    "locale" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "step_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "step_questions_journeyId_stepKey_idx" ON "step_questions"("journeyId", "stepKey");

-- CreateIndex
CREATE INDEX "step_questions_channel_status_createdAt_idx" ON "step_questions"("channel", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "step_questions" ADD CONSTRAINT "step_questions_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_questions" ADD CONSTRAINT "step_questions_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
