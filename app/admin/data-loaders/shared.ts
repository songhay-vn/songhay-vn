import { memoizeWithTtl } from "@/lib/data-cache"
import {
  fetchAnalyticsContentSignals,
  fetchAnalyticsDailyPageViews,
  fetchAnalyticsLandingPageSignals,
  fetchSearchConsoleQuerySignals,
} from "@/lib/google-seo-signals"
import { fetchGoogleTrendKeywords } from "@/lib/google-trends"
import { getAgeGroup, type BioAgeGenderValue } from "@/lib/bio-age"
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
const BIO_AGE_GROUPS = [
  "1-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const
const BIO_AGE_GENDERS: Array<{ key: BioAgeGenderValue; label: string }> = [
  { key: "MALE", label: "Nam" },
  { key: "FEMALE", label: "Nữ" },
]
const BIO_AGE_RESULTS = [
  { key: "YOUNGER", label: "Trẻ hơn" },
  { key: "BALANCED", label: "Cân bằng" },
  { key: "RECOVERY", label: "Cần phục hồi" },
  { key: "FAST_AGING", label: "Lão hóa nhanh" },
] as const

export type BioAgeInsights = {
  totalCount: number
  averageAge: number | null
  ageGroups: Array<{ label: string; count: number }>
  genders: Array<{ key: BioAgeGenderValue; label: string; count: number }>
  results: Array<{ key: string; label: string; count: number }>
  latest: Array<{
    id: string
    age: number
    gender: BioAgeGenderValue
    score: number
    resultKey: string
    estimatedMinAge: number
    estimatedMaxAge: number | null
    updatedAt: Date
  }>
}

const EMPTY_BIO_AGE_INSIGHTS: BioAgeInsights = {
  totalCount: 0,
  averageAge: null,
  ageGroups: BIO_AGE_GROUPS.map((label) => ({ label, count: 0 })),
  genders: BIO_AGE_GENDERS.map((item) => ({ ...item, count: 0 })),
  results: BIO_AGE_RESULTS.map((item) => ({ ...item, count: 0 })),
  latest: [],
}

export async function getMediaLibraryData(activeTab: AdminTab) {
  if (activeTab !== "media-library" && activeTab !== "write" && activeTab !== "products") {
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
      }>,
      range: "30d" as OverviewRange,
      error: null as string | null,
    }
  }

  return memoizeWithTtl(
    `admin:overview:analytics:${overviewRange}`,
    ADMIN_CACHE_TTL_SECONDS,
    async () => {
      const totalDays = OVERVIEW_ANALYTICS_DAYS
      const chartEnd = startOfDay(new Date())
      chartEnd.setDate(chartEnd.getDate() - 1)

      const chartStart = new Date(chartEnd)
      chartStart.setDate(chartEnd.getDate() - (totalDays - 1))

      const analyticsDaily = await fetchAnalyticsDailyPageViews({
        days: totalDays,
      })
      const viewsByDate = new Map(
        analyticsDaily.days.map((item) => [item.date, item.screenPageViews])
      )

      const dailyMap = new Map<
        string,
        {
          date: Date
          views: number
        }
      >()

      for (let index = 0; index < totalDays; index += 1) {
        const currentDate = new Date(chartStart)
        currentDate.setDate(chartStart.getDate() + index)
        const key = toDayKey(currentDate)
        dailyMap.set(key, {
          date: currentDate,
          views: viewsByDate.get(key) || 0,
        })
      }

      const daily = [...dailyMap.values()].map((item) => ({
        label: toDayLabel(item.date),
        views: item.views,
      }))

      return { daily, range: overviewRange, error: analyticsDaily.error }
    }
  )
}

export async function getBioAgeInsights(activeTab: AdminTab) {
  if (activeTab !== "overview") {
    return EMPTY_BIO_AGE_INSIGHTS
  }

  return memoizeWithTtl(
    "admin:overview:bio-age-insights",
    ADMIN_CACHE_TTL_SECONDS,
    async () => {
      try {
        const [totalCount, ageAggregate, ages, genders, results, latest] =
          await Promise.all([
            prisma.bioAgeSubmission.count(),
            prisma.bioAgeSubmission.aggregate({
              _avg: { age: true },
            }),
            prisma.bioAgeSubmission.groupBy({
              by: ["age"],
              _count: { _all: true },
            }),
            prisma.bioAgeSubmission.groupBy({
              by: ["gender"],
              _count: { _all: true },
            }),
            prisma.bioAgeSubmission.groupBy({
              by: ["resultKey"],
              _count: { _all: true },
            }),
            prisma.bioAgeSubmission.findMany({
              orderBy: { updatedAt: "desc" },
              take: 5,
              select: {
                id: true,
                age: true,
                gender: true,
                score: true,
                resultKey: true,
                estimatedMinAge: true,
                estimatedMaxAge: true,
                updatedAt: true,
              },
            }),
          ])

        const ageGroupCounts = new Map<string, number>()
        for (const item of ages) {
          const key = getAgeGroup(item.age)
          ageGroupCounts.set(
            key,
            (ageGroupCounts.get(key) || 0) + item._count._all
          )
        }

        const genderCounts = new Map(
          genders.map((item) => [item.gender, item._count._all])
        )
        const resultCounts = new Map(
          results.map((item) => [item.resultKey, item._count._all])
        )

        return {
          totalCount,
          averageAge:
            typeof ageAggregate._avg.age === "number"
              ? Math.round(ageAggregate._avg.age * 10) / 10
              : null,
          ageGroups: BIO_AGE_GROUPS.map((label) => ({
            label,
            count: ageGroupCounts.get(label) || 0,
          })),
          genders: BIO_AGE_GENDERS.map((item) => ({
            ...item,
            count: genderCounts.get(item.key) || 0,
          })),
          results: BIO_AGE_RESULTS.map((item) => ({
            ...item,
            count: resultCounts.get(item.key) || 0,
          })),
          latest: latest.map((item) => ({
            ...item,
            gender: item.gender as BioAgeGenderValue,
          })),
        } satisfies BioAgeInsights
      } catch (error) {
        if (isPrismaSchemaMismatchError(error)) {
          return EMPTY_BIO_AGE_INSIGHTS
        }

        throw error
      }
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
