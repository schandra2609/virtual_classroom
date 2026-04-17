/*
  Warnings:

  - You are about to drop the column `tutorQualificationUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tutorRejectionReason` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tutorStatusUpdatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tutorVerificationStatus` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TutorApplicationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tutorQualificationUrl",
DROP COLUMN "tutorRejectionReason",
DROP COLUMN "tutorStatusUpdatedAt",
DROP COLUMN "tutorVerificationStatus";

-- DropEnum
DROP TYPE "TutorVerificationStatus";

-- CreateTable
CREATE TABLE "TutorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TutorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TutorApplication_userId_idx" ON "TutorApplication"("userId");

-- AddForeignKey
ALTER TABLE "TutorApplication" ADD CONSTRAINT "TutorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
