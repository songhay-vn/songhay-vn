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
      hotSeoKeywords: [],
      hotSeoKeywordGeo: process.env.GOOGLE_TRENDS_GEO || "VN",
      hotSeoKeywordSourceUrl: null as string | null,
      hotSeoKeywordError: null as string | null,
      googleSeoSignals: {
        searchConsole: {
          sourceUrl: null as string | null,
          startDate: null as string | null,
          endDate: null as string | null,
          error: null as string | null,
          queries: [],
        },
        analytics: {
          propertyId: null as string | null,
          error: null as string | null,
          landingPages: [],
        },
        content: {
          propertyId: null as string | null,
          error: null as string | null,
          summary: {
            screenPageViews: 0,
            sessions: 0,
            activeUsers: 0,
            engagementRate: 0,
            averageSessionDuration: 0,
          },
          pages: [],
        },
      },
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

      const [
        recentPosts,
        recentComments,
        trendKeywordResult,
        searchConsoleQuerySignals,
        analyticsLandingPageSignals,
        analyticsContentSignals,
      ] = await Promise.all([
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

      return {
        daily,
        range: overviewRange,
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
