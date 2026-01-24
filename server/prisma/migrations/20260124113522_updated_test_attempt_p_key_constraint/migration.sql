/*
  Warnings:

  - A unique constraint covering the columns `[id,questionPaperId]` on the table `TestAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TestAttempt_id_questionPaperId_key" ON "TestAttempt"("id", "questionPaperId");
