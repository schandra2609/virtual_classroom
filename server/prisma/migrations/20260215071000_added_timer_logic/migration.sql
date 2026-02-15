/*
  Warnings:

  - The values [UNVERIFIED] on the enum `TutorVerificationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuestionPaperStatus" AS ENUM ('SCHEDULED', 'LIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "TutorVerificationStatus_new" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
ALTER TABLE "public"."User" ALTER COLUMN "tutorVerificationStatus" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "tutorVerificationStatus" TYPE "TutorVerificationStatus_new" USING ("tutorVerificationStatus"::text::"TutorVerificationStatus_new");
ALTER TYPE "TutorVerificationStatus" RENAME TO "TutorVerificationStatus_old";
ALTER TYPE "TutorVerificationStatus_new" RENAME TO "TutorVerificationStatus";
DROP TYPE "public"."TutorVerificationStatus_old";
ALTER TABLE "User" ALTER COLUMN "tutorVerificationStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "QuestionPaper" ADD COLUMN     "lastPausedAt" TIMESTAMP(3),
ADD COLUMN     "pauseTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "QuestionPaperStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tutorRejectionReason" TEXT,
ALTER COLUMN "tutorVerificationStatus" SET DEFAULT 'PENDING';
