-- CreateEnum
CREATE TYPE "SearchConsoleJobType" AS ENUM ('URL_INSPECTION', 'SITEMAP_SUBMIT');

-- CreateEnum
CREATE TYPE "SearchConsoleJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "SearchConsoleUrlStatus" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "verdict" TEXT,
    "coverageState" TEXT,
    "robotsTxtState" TEXT,
    "indexingState" TEXT,
    "pageFetchState" TEXT,
    "lastCrawlTime" TIMESTAMP(3),
    "googleCanonical" TEXT,
    "userCanonical" TEXT,
    "inspectionResultLink" TEXT,
    "richResultsVerdict" TEXT,
    "rawResult" JSONB,
    "lastError" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchConsoleUrlStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchConsoleJob" (
    "id" TEXT NOT NULL,
    "type" "SearchConsoleJobType" NOT NULL,
    "status" "SearchConsoleJobStatus" NOT NULL DEFAULT 'PENDING',
    "postId" TEXT,
    "url" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "response" JSONB,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchConsoleJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchConsoleUrlStatus_postId_url_key" ON "SearchConsoleUrlStatus"("postId", "url");

-- CreateIndex
CREATE INDEX "SearchConsoleUrlStatus_postId_idx" ON "SearchConsoleUrlStatus"("postId");

-- CreateIndex
CREATE INDEX "SearchConsoleUrlStatus_verdict_idx" ON "SearchConsoleUrlStatus"("verdict");

-- CreateIndex
CREATE INDEX "SearchConsoleUrlStatus_checkedAt_idx" ON "SearchConsoleUrlStatus"("checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchConsoleJob_dedupeKey_key" ON "SearchConsoleJob"("dedupeKey");

-- CreateIndex
CREATE INDEX "SearchConsoleJob_status_runAfter_idx" ON "SearchConsoleJob"("status", "runAfter");

-- CreateIndex
CREATE INDEX "SearchConsoleJob_type_createdAt_idx" ON "SearchConsoleJob"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SearchConsoleJob_postId_idx" ON "SearchConsoleJob"("postId");

-- AddForeignKey
ALTER TABLE "SearchConsoleUrlStatus" ADD CONSTRAINT "SearchConsoleUrlStatus_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchConsoleJob" ADD CONSTRAINT "SearchConsoleJob_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
