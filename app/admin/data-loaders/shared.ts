import { memoizeWithTtl } from "@/lib/data-cache"
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
  const usageById = new Map(
    rowsWithUsage.map((item) => [item.id, item.usage])
  )

  return rows.map((item) => ({
    ...item,
    usage: usageById.get(item.id),
  }))
}

export async function getPendingComments(activeTab: AdminTab) {
  if (activeTab !== "comments") {
    return []
  }

  return memoizeWithTtl("admin:comments:pending", ADMIN_CACHE_TTL_SECONDS, async () => {
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
  })
}

export async function getOverviewAnalytics(activeTab: AdminTab, overviewRange: OverviewRange) {
  if (activeTab !== "overview") {
    return {
      daily: [] as Array<{ label: string; views: number; comments: number; posts: number; avgDwellSeconds: number }>,
      todayViews: 0,
      todayComments: 0,
      todayApprovedComments: 0,
      todayTopPosts: [] as Array<{ id: string; title: string; slug: string; views: number; category: { slug: string } }>,
      range: "30d" as OverviewRange,
      hotSeoKeywords: [] as Array<{ id: string; keyword: string; postCount: number; totalViews: number; score: number }>,
      avgDwellSecondsPerPost: 0,
      dwellTopPosts: [] as Array<{
        postId: string
        title: string
        slug: string
        category: { slug: string }
        avgDwellSeconds: number
        eventCount: number
      }>,
    }
  }

  return memoizeWithTtl(`admin:overview:analytics:${overviewRange}`, ADMIN_CACHE_TTL_SECONDS, async () => {
    const todayStart = startOfDay(new Date())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const totalDays = OVERVIEW_ANALYTICS_DAYS

    const chartStart = new Date(todayStart)
    chartStart.setDate(chartStart.getDate() - (totalDays - 1))

    const [recentPosts, recentComments, hotKeywordRows, dwellEventGroups, allDwellEvents] = await Promise.all([
      prisma.post.findMany({
        where: {
          isDeleted: false,
          isPublished: true,
          publishedAt: { gte: chartStart },
        },
        select: {
          id: true,
          title: true,
          views: true,
          publishedAt: true,
          category: { select: { slug: true } },
          slug: true,
        },
      }),
      prisma.comment.findMany({
        where: {
          createdAt: { gte: chartStart },
        },
        select: {
          id: true,
          createdAt: true,
          isApproved: true,
        },
      }),
      prisma.postSeoKeyword.findMany({
        where: {
          post: {
            isDeleted: false,
            isPublished: true,
            publishedAt: { gte: chartStart },
          },
        },
        select: {
          seoKeywordId: true,
          seoKeyword: {
            select: {
              id: true,
              keyword: true,
            },
          },
          post: {
            select: {
              id: true,
              views: true,
            },
          },
        },
      }),
      prisma.postEngagementEvent.groupBy({
        by: ["postId"],
        where: {
          createdAt: { gte: chartStart },
          dwellSeconds: {
            gt: 0,
          },
        },
        _avg: {
          dwellSeconds: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.postEngagementEvent.findMany({
        where: {
          createdAt: { gte: chartStart },
          dwellSeconds: { gt: 0 },
        },
        select: {
          createdAt: true,
          dwellSeconds: true,
        },
      }),
    ])

    const dailyMap = new Map<string, { date: Date; views: number; comments: number; posts: number; dwellSum: number; dwellCount: number }>()

    for (let index = 0; index < totalDays; index += 1) {
      const currentDate = new Date(chartStart)
      currentDate.setDate(chartStart.getDate() + index)
      dailyMap.set(toDayKey(currentDate), {
        date: currentDate,
        views: 0,
        comments: 0,
        posts: 0,
        dwellSum: 0,
        dwellCount: 0,
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

    for (const event of allDwellEvents) {
      const key = toDayKey(event.createdAt)
      const bucket = dailyMap.get(key)
      if (!bucket) {
        continue
      }
      bucket.dwellSum += event.dwellSeconds
      bucket.dwellCount += 1
    }

    const todayTopPosts = recentPosts
      .filter((post) => post.publishedAt >= todayStart && post.publishedAt < tomorrowStart)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    const todayViews = todayTopPosts.reduce((sum, post) => sum + post.views, 0)
    const todayComments = recentComments.filter((item) => item.createdAt >= todayStart && item.createdAt < tomorrowStart).length
    const todayApprovedComments = recentComments.filter((item) => item.isApproved && item.createdAt >= todayStart && item.createdAt < tomorrowStart).length

    const daily = [...dailyMap.values()].map((item) => ({
      label: toDayLabel(item.date),
      views: item.views,
      comments: item.comments,
      posts: item.posts,
      avgDwellSeconds: item.dwellCount > 0 ? Math.round(item.dwellSum / item.dwellCount) : 0,
    }))

    const hotKeywordMap = new Map<string, { id: string; keyword: string; postIds: Set<string>; totalViews: number }>()
    for (const row of hotKeywordRows) {
      const existing = hotKeywordMap.get(row.seoKeywordId)
      if (!existing) {
        hotKeywordMap.set(row.seoKeywordId, {
          id: row.seoKeyword.id,
          keyword: row.seoKeyword.keyword,
          postIds: new Set([row.post.id]),
          totalViews: row.post.views,
        })
        continue
      }

      if (!existing.postIds.has(row.post.id)) {
        existing.postIds.add(row.post.id)
        existing.totalViews += row.post.views
      }
    }

    const hotSeoKeywords = [...hotKeywordMap.values()]
      .map((item) => {
        const postCount = item.postIds.size
        const score = item.totalViews + postCount * 100
        return {
          id: item.id,
          keyword: item.keyword,
          postCount,
          totalViews: item.totalViews,
          score,
        }
      })
      .sort((a, b) => b.score - a.score || b.totalViews - a.totalViews)
      .slice(0, 8)

    const avgDwellSecondsPerPost = dwellEventGroups.length
      ? Math.round(
        dwellEventGroups.reduce((sum, item) => sum + (item._avg.dwellSeconds || 0), 0) / dwellEventGroups.length
      )
      : 0

    const dwellPostIds = [...new Set(dwellEventGroups.map((item) => item.postId))]
    const dwellPosts = dwellPostIds.length
      ? await prisma.post.findMany({
        where: {
          id: { in: dwellPostIds },
          isDeleted: false,
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          category: {
            select: {
              slug: true,
            },
          },
        },
      })
      : []

    const dwellPostMap = new Map<string, { title: string; slug: string; category: { slug: string } }>()
    for (const post of dwellPosts) {
      dwellPostMap.set(post.id, {
        title: post.title,
        slug: post.slug,
        category: post.category,
      })
    }

    const dwellTopPosts = dwellEventGroups
      .map((row) => {
        const postMeta = dwellPostMap.get(row.postId)
        if (!postMeta) {
          return null
        }

        return {
          postId: row.postId,
          title: postMeta.title,
          slug: postMeta.slug,
          category: postMeta.category,
          avgDwellSeconds: Math.round(row._avg.dwellSeconds || 0),
          eventCount: row._count._all,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.avgDwellSeconds - a.avgDwellSeconds)
      .slice(0, 5)

    return {
      daily,
      todayViews,
      todayComments,
      todayApprovedComments,
      todayTopPosts,
      range: overviewRange,
      hotSeoKeywords,
      avgDwellSecondsPerPost,
      dwellTopPosts,
    }
  })
}
