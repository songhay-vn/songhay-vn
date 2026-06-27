-- CreateEnum
CREATE TYPE "BioAgeGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BioAgeResultKey" AS ENUM ('YOUNGER', 'BALANCED', 'RECOVERY', 'FAST_AGING');

-- CreateTable
CREATE TABLE "BioAgeSubmission" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "BioAgeGender" NOT NULL,
    "score" INTEGER NOT NULL,
    "resultKey" "BioAgeResultKey" NOT NULL,
    "estimatedMinAge" INTEGER NOT NULL,
    "estimatedMaxAge" INTEGER,
    "sourcePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioAgeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BioAgeSubmission_sessionId_key" ON "BioAgeSubmission"("sessionId");

-- CreateIndex
CREATE INDEX "BioAgeSubmission_createdAt_idx" ON "BioAgeSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "BioAgeSubmission_age_idx" ON "BioAgeSubmission"("age");

-- CreateIndex
CREATE INDEX "BioAgeSubmission_gender_idx" ON "BioAgeSubmission"("gender");

-- CreateIndex
CREATE INDEX "BioAgeSubmission_resultKey_idx" ON "BioAgeSubmission"("resultKey");
