import "server-only"

import { after } from "next/server"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/seo"
import {
  getDailyInspectionSoftLimit,
  getSearchConsoleSitemapUrl,
  getSearchConsoleNewsSitemapUrl,
  inspectUrl,
  isSearchConsoleConfigured,
  SearchConsoleApiError,
  submitSitemap,
  type SearchConsoleInspectResponse,
} from "@/lib/search-console"

const DEFAULT_DRAIN_LIMIT = 5
const MAX_JOB_ATTEMPTS = 4
const SITEMAP_DEDUPE_WINDOW_MS = 10 * 60 * 1000

type QueueJobInput = {
  type: "URL_INSPECTION" | "SITEMAP_SUBMIT"
  url: string
  dedupeKey: string
  postId?: string
}

export function buildPublicPostUrl({
  categorySlug,
  slug,
}: {
  categorySlug: string
  slug: string
}) {
  return `${getSiteUrl()}/${categorySlug}/${slug}`
}

export function getSearchConsoleJobErrorMessage(error: unknown) {
  if (error instanceof SearchConsoleApiError) {
    const details =
      typeof error.details === "string"
        ? error.details
        : JSON.stringify(error.details)
    return `${error.message}${details ? `: ${details}` : ""}`.slice(0, 2000)
  }

  if (error instanceof Error) {
    return error.message.slice(0, 2000)
  }

  return String(error).slice(0, 2000)
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
  )
}

async function createQueueJob(input: QueueJobInput) {
  try {
    return await prisma.searchConsoleJob.create({
      data: {
        type: input.type,
        url: input.url,
        dedupeKey: input.dedupeKey,
        postId: input.postId,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null
    }
    throw error
  }
}

function getSitemapDedupeKey(sitemapUrl: string) {
  const bucket = Math.floor(Date.now() / SITEMAP_DEDUPE_WINDOW_MS)
  return `SITEMAP_SUBMIT:${sitemapUrl}:${bucket}`
}

export async function enqueuePublishedPostInspection(
  postId: string,
  publicUrl: string,
  options?: { force?: boolean }
) {
  const dedupeKey = options?.force
    ? `URL_INSPECTION:${postId}:${publicUrl}:${Date.now()}`
    : `URL_INSPECTION:${postId}:${publicUrl}`

  return createQueueJob({
    type: "URL_INSPECTION",
    postId,
    url: publicUrl,
    dedupeKey,
  })
}

export async function enqueueSitemapSubmit(sitemapUrl = getSearchConsoleNewsSitemapUrl()) {
  return createQueueJob({
    type: "SITEMAP_SUBMIT",
    url: sitemapUrl,
    dedupeKey: getSitemapDedupeKey(sitemapUrl),
  })
}

export async function enqueuePublishedPostSearchConsoleJobs({
  postId,
  categorySlug,
  slug,
}: {
  postId: string
  categorySlug: string
  slug: string
}) {
  const publicUrl = buildPublicPostUrl({ categorySlug, slug })
  await Promise.all([
    enqueuePublishedPostInspection(postId, publicUrl),
    enqueueSitemapSubmit(),
  ])
}

export async function enqueueRemovedPostSearchConsoleJobs() {
  await Promise.all([
    enqueueSitemapSubmit(getSearchConsoleSitemapUrl()),
    enqueueSitemapSubmit(getSearchConsoleNewsSitemapUrl()),
  ])
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function getTodayInspectionUsage() {
  const aggregate = await prisma.searchConsoleJob.aggregate({
    where: {
      type: "URL_INSPECTION",
      startedAt: {
        gte: startOfToday(),
      },
    },
    _sum: {
      attempts: true,
    },
  })

  return aggregate._sum.attempts || 0
}

function getRetryDelayMs(attempts: number) {
  return Math.min(60 * 60 * 1000, 2 ** attempts * 60 * 1000)
}

function parseGoogleTimestamp(value?: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function persistInspectionResult({
  postId,
  url,
  response,
}: {
  postId: string
  url: string
  response: SearchConsoleInspectResponse
}) {
  const inspectionResult = response.inspectionResult
  const indexStatus = inspectionResult?.indexStatusResult
  const now = new Date()

  await prisma.searchConsoleUrlStatus.upsert({
    where: {
      postId_url: {
        postId,
        url,
      },
    },
    create: {
      postId,
      url,
      verdict: indexStatus?.verdict,
      coverageState: indexStatus?.coverageState,
      robotsTxtState: indexStatus?.robotsTxtState,
      indexingState: indexStatus?.indexingState,
      pageFetchState: indexStatus?.pageFetchState,
      lastCrawlTime: parseGoogleTimestamp(indexStatus?.lastCrawlTime),
      googleCanonical: indexStatus?.googleCanonical,
      userCanonical: indexStatus?.userCanonical,
      inspectionResultLink: inspectionResult?.inspectionResultLink,
      richResultsVerdict: inspectionResult?.richResultsResult?.verdict,
      rawResult: response as Prisma.InputJsonValue,
      lastError: null,
      checkedAt: now,
    },
    update: {
      verdict: indexStatus?.verdict,
      coverageState: indexStatus?.coverageState,
      robotsTxtState: indexStatus?.robotsTxtState,
      indexingState: indexStatus?.indexingState,
      pageFetchState: indexStatus?.pageFetchState,
      lastCrawlTime: parseGoogleTimestamp(indexStatus?.lastCrawlTime),
      googleCanonical: indexStatus?.googleCanonical,
      userCanonical: indexStatus?.userCanonical,
      inspectionResultLink: inspectionResult?.inspectionResultLink,
      richResultsVerdict: inspectionResult?.richResultsResult?.verdict,
      rawResult: response as Prisma.InputJsonValue,
      lastError: null,
      checkedAt: now,
    },
  })
}

async function markJobFailed(jobId: string, error: unknown, attempts: number) {
  const retryable =
    error instanceof SearchConsoleApiError
      ? error.retryable
      : !(error instanceof Error)

  if (retryable && attempts < MAX_JOB_ATTEMPTS) {
    await prisma.searchConsoleJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        runAfter: new Date(Date.now() + getRetryDelayMs(attempts)),
        lastError: getSearchConsoleJobErrorMessage(error),
      },
    })
    return
  }

  await prisma.searchConsoleJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      lastError: getSearchConsoleJobErrorMessage(error),
    },
  })
}

export async function drainSearchConsoleJobs(limit = DEFAULT_DRAIN_LIMIT) {
  if (!isSearchConsoleConfigured()) {
    return { processed: 0, skipped: "not_configured" as const }
  }

  const softLimit = getDailyInspectionSoftLimit()
  let processed = 0
  let inspectionUsage = await getTodayInspectionUsage()

  while (processed < limit) {
    const job = await prisma.searchConsoleJob.findFirst({
      where: {
        status: "PENDING",
        runAfter: {
          lte: new Date(),
        },
        attempts: {
          lt: MAX_JOB_ATTEMPTS,
        },
      },
      orderBy: [{ runAfter: "asc" }, { createdAt: "asc" }],
    })

    if (!job) {
      break
    }

    if (job.type === "URL_INSPECTION" && inspectionUsage >= softLimit) {
      break
    }

    const runningJob = await prisma.searchConsoleJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        attempts: { increment: 1 },
        startedAt: new Date(),
        lastError: null,
      },
    })

    try {
      if (runningJob.type === "URL_INSPECTION") {
        inspectionUsage += 1
        const response = await inspectUrl(runningJob.url)

        if (runningJob.postId) {
          await persistInspectionResult({
            postId: runningJob.postId,
            url: runningJob.url,
            response,
          })
        }

        await prisma.searchConsoleJob.update({
          where: { id: runningJob.id },
          data: {
            status: "SUCCEEDED",
            response: response as Prisma.InputJsonValue,
            finishedAt: new Date(),
          },
        })
      } else {
        const response = await submitSitemap(runningJob.url)
        await prisma.searchConsoleJob.update({
          where: { id: runningJob.id },
          data: {
            status: "SUCCEEDED",
            response: response as Prisma.InputJsonValue,
            finishedAt: new Date(),
          },
        })
      }

      processed += 1
    } catch (error) {
      await markJobFailed(runningJob.id, error, runningJob.attempts)
      processed += 1
    }
  }

  return { processed, inspectionUsage, softLimit }
}

export function scheduleSearchConsoleDrain(limit = DEFAULT_DRAIN_LIMIT) {
  const task = async () => {
    try {
      await drainSearchConsoleJobs(limit)
    } catch (error) {
      console.warn(
        "Search Console queue drain failed:",
        error instanceof Error ? error.message : error
      )
    }
  }

  try {
    after(task)
  } catch {
    void task()
  }
}
