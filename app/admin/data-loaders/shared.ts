import { memoizeWithTtl } from "@/lib/data-cache"
import {
  fetchAnalyticsContentSignals,
  fetchAnalyticsLandingPageSignals,
  fetchSearchConsoleQuerySignals,
} from "@/lib/google-seo-signals"
import { fetchGoogleTrendKeywords } from "@/lib/google-trends"
import { attachMediaUsage } from "@/lib/media-usage"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"
import { startOfDay, toDayKey, toDayLabel } from "@/app/admin/data-helpers"
import type { AdminTab } from "@/app/admin/data-types"

const ADMIN_CACHE_TTL_SECONDS = 20
/** External APIs (Google Trends, Search Console, GA4) change slowly — 5-min cache */
const OVERVIEW_SIGNALS_CACHE_TTL_SECONDS = 5 * 60
type OverviewRange = "30d"
const OVERVIEW_ANALYTICS_DAYS = 30

export async function getMediaLibraryData(activeTab: AdminTab) {
  if (activeTab !== "media-library" && activeTab !== "write") {
    return []
  }

  const rows = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      assetType: true,
      visibility: true,
      url: true,
      displayName: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
    take: 200,
  })

  if (activeTab !== "media-library") {
    return rows
  }

  const defaultImageRows = rows
    .filter((item) => item.assetType === "IMAGE")
    .slice(0, 12)

  const rowsWithUsage = await attachMediaUsage(defaultImageRows)
  const usageById = new Map(rowsWithUsage.map((item) => [item.id, item.usage]))

  return rows.map((item) => ({
    ...item,
    usage: usageById.get(item.id),
  }))
}

export async function getPendingComments(activeTab: AdminTab) {
  if (activeTab !== "comments") {
    return []
  }

  return memoizeWithTtl(
    "admin:comments:pending",
    ADMIN_CACHE_TTL_SECONDS,
    async () => {
      try {
        return await prisma.comment.findMany({
          where: { isApproved: false, containsBlockedKeyword: true },
          select: {
            id: true,
            authorName: true,
            content: true,
            post: {
              select: {
                slug: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      } catch (error) {
        if (!isPrismaSchemaMismatchError(error)) {
          throw error
        }

        return prisma.comment.findMany({
          where: { isApproved: false },
          select: {
            id: true,
            authorName: true,
            content: true,
            post: {
              select: {
                slug: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      }
    }
  )
}

/**
 * Fast path: only queries the DB for the activity chart data (posts + comments
 * bucketed by day). This runs eagerly on every overview page load and renders
 * immediately while the slow signals section streams in via Suspense.
 */
export async function getOverviewAnalytics(
  activeTab: AdminTab,
  overviewRange: OverviewRange
) {
  if (activeTab !== "overview") {
    return {
      daily: [] as Array<{
        label: string
        views: number
        comments: number
        posts: number
      }>,
      range: "30d" as OverviewRange,
    }
  }

  return memoizeWithTtl(
    `admin:overview:analytics:${overviewRange}`,
    ADMIN_CACHE_TTL_SECONDS,
    async () => {
      const todayStart = startOfDay(new Date())
      const totalDays = OVERVIEW_ANALYTICS_DAYS

      const chartStart = new Date(todayStart)
      chartStart.setDate(chartStart.getDate() - (totalDays - 1))

      const [recentPosts, recentComments] = await Promise.all([
        prisma.post.findMany({
          where: {
            isDeleted: false,
            isPublished: true,
            publishedAt: { gte: chartStart },
          },
          select: {
            views: true,
            publishedAt: true,
          },
        }),
        prisma.comment.findMany({
          where: {
            createdAt: { gte: chartStart },
          },
          select: {
            createdAt: true,
          },
        }),
      ])

      const dailyMap = new Map<
        string,
        {
          date: Date
          views: number
          comments: number
          posts: number
        }
      >()

      for (let index = 0; index < totalDays; index += 1) {
        const currentDate = new Date(chartStart)
        currentDate.setDate(chartStart.getDate() + index)
        dailyMap.set(toDayKey(currentDate), {
          date: currentDate,
          views: 0,
          comments: 0,
          posts: 0,
        })
      }

      for (const post of recentPosts) {
        const key = toDayKey(post.publishedAt)
        const bucket = dailyMap.get(key)
        if (!bucket) {
          continue
        }
        bucket.posts += 1
        bucket.views += post.views
      }

      for (const comment of recentComments) {
        const key = toDayKey(comment.createdAt)
        const bucket = dailyMap.get(key)
        if (!bucket) {
          continue
        }
        bucket.comments += 1
      }

      const daily = [...dailyMap.values()].map((item) => ({
        label: toDayLabel(item.date),
        views: item.views,
        comments: item.comments,
        posts: item.posts,
      }))

      return { daily, range: overviewRange }
    }
  )
}

/**
 * Slow path: fetches Google Trends RSS, Search Console, and GA4 signals.
 * Cached for 5 minutes — these external APIs change slowly and should not
 * block the initial page render. Called from async Server Components wrapped
 * in <Suspense> so the page streams them in after the fast DB content is shown.
 */
export async function getOverviewSignals() {
  return memoizeWithTtl(
    "admin:overview:signals",
    OVERVIEW_SIGNALS_CACHE_TTL_SECONDS,
    async () => {
      const [
        trendKeywordResult,
        searchConsoleQuerySignals,
        analyticsLandingPageSignals,
        analyticsContentSignals,
      ] = await Promise.all([
        fetchGoogleTrendKeywords({ limit: 8 }),
        fetchSearchConsoleQuerySignals({
          days: OVERVIEW_ANALYTICS_DAYS,
          limit: 5,
        }),
        fetchAnalyticsLandingPageSignals({
          days: OVERVIEW_ANALYTICS_DAYS,
          limit: 5,
        }),
        fetchAnalyticsContentSignals({
          days: OVERVIEW_ANALYTICS_DAYS,
          limit: 5,
        }),
      ])

      return {
        hotSeoKeywords: trendKeywordResult.keywords,
        hotSeoKeywordGeo: trendKeywordResult.geo,
        hotSeoKeywordSourceUrl: trendKeywordResult.sourceUrl,
        hotSeoKeywordError: trendKeywordResult.error,
        googleSeoSignals: {
          searchConsole: {
            sourceUrl: searchConsoleQuerySignals.sourceUrl,
            startDate: searchConsoleQuerySignals.startDate,
            endDate: searchConsoleQuerySignals.endDate,
            error: searchConsoleQuerySignals.error,
            queries: searchConsoleQuerySignals.queries,
          },
          analytics: analyticsLandingPageSignals,
          content: analyticsContentSignals,
        },
      }
    }
  )
}
