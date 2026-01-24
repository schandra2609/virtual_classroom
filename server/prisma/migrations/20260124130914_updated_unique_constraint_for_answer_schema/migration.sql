/*
  Warnings:

  - A unique constraint covering the columns `[testAttemptId,questionId]` on the table `Answer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Answer_testAttemptId_questionId_key" ON "Answer"("testAttemptId", "questionId");
