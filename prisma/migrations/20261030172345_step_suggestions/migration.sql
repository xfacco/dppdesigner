-- CreateTable
CREATE TABLE "step_suggestions" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "optionKey" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "step_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_suggestion_translations" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "step_suggestion_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "step_suggestions_stepId_idx" ON "step_suggestions"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "step_suggestion_translations_suggestionId_locale_key" ON "step_suggestion_translations"("suggestionId", "locale");

-- AddForeignKey
ALTER TABLE "step_suggestions" ADD CONSTRAINT "step_suggestions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_suggestion_translations" ADD CONSTRAINT "step_suggestion_translations_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "step_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
