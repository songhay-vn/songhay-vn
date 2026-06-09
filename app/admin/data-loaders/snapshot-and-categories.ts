import { memoizeWithTtl } from "@/lib/data-cache"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"
import { ensureSeoKeywordStoreSeeded } from "@/lib/seo-keyword-store"
import { sortCategoriesByTree } from "@/app/admin/data-helpers"
import type { AdminTab } from "@/app/admin/data-types"

const ADMIN_CACHE_TTL_SECONDS = 20

async function getSearchConsoleSnapshotMetrics() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      indexedPostCount,
      notIndexedPostCount,
      pendingInspectionCount,
      failedInspectionCount,
      todayInspectionUsageAggregate,
    ] = await Promise.all([
      prisma.searchConsoleUrlStatus.count({
        where: {
          verdict: "PASS",
          post: { isPublished: true, isDeleted: false },
        },
      }),
      prisma.searchConsoleUrlStatus.count({
        where: {
          verdict: { in: ["FAIL", "NEUTRAL"] },
          post: { isPublished: true, isDeleted: false },
        },
      }),
      prisma.searchConsoleJob.count({
        where: {
          type: "URL_INSPECTION",
          status: { in: ["PENDING", "RUNNING"] },
        },
      }),
      prisma.searchConsoleJob.count({
        where: {
          type: "URL_INSPECTION",
          status: "FAILED",
        },
      }),
      prisma.searchConsoleJob.aggregate({
        where: {
          type: "URL_INSPECTION",
          startedAt: { gte: today },
        },
        _sum: { attempts: true },
      }),
    ])

    return {
      indexedPostCount,
      notIndexedPostCount,
      pendingInspectionCount,
      failedInspectionCount,
      todayInspectionUsage: todayInspectionUsageAggregate._sum.attempts || 0,
    }
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return {
        indexedPostCount: 0,
        notIndexedPostCount: 0,
        pendingInspectionCount: 0,
        failedInspectionCount: 0,
        todayInspectionUsage: 0,
      }
    }

    throw error
  }
}

export async function getAdminSnapshot() {
  return memoizeWithTtl("admin:snapshot", ADMIN_CACHE_TTL_SECONDS, async () => {
    const pendingCommentCountPromise = prisma.comment
      .count({ where: { isApproved: false, containsBlockedKeyword: true } })
      .catch((error) => {
        if (isPrismaSchemaMismatchError(error)) {
          return prisma.comment.count({ where: { isApproved: false } })
        }

        throw error
      })

    const [postCount, categoryCount, pendingCommentCount, trashedPostCount, draftPostCount, pendingReviewPostCount, pendingPublishPostCount, publishedPostCount, rejectedPostCount, postViewAggregate, searchConsoleMetrics] = await Promise.all([
      prisma.post.count({ where: { isDeleted: false } }),
      prisma.category.count(),
      pendingCommentCountPromise,
      prisma.post.count({ where: { isDeleted: true } }),
      prisma.post.count({ where: { isDeleted: false, editorialStatus: "DRAFT" } }),
      prisma.post.count({ where: { isDeleted: false, editorialStatus: "PENDING_REVIEW" } }),
      prisma.post.count({ where: { isDeleted: false, editorialStatus: "PENDING_PUBLISH" } }),
      prisma.post.count({ where: { isDeleted: false, editorialStatus: "PUBLISHED" } }),
      prisma.post.count({ where: { isDeleted: false, editorialStatus: "REJECTED" } }),
      prisma.post.aggregate({
        where: { isDeleted: false },
        _sum: { views: true },
      }),
      getSearchConsoleSnapshotMetrics(),
    ])

    return {
      postCount,
      categoryCount,
      pendingCommentCount,
      trashedPostCount,
      draftPostCount,
      pendingReviewPostCount,
      pendingPublishPostCount,
      publishedPostCount,
      rejectedPostCount,
      totalPostViews: postViewAggregate._sum.views || 0,
      ...searchConsoleMetrics,
    }
  })
}

export async function getCategoriesForManage(activeTab: AdminTab) {
  if (activeTab !== "categories") {
    return []
  }

  return memoizeWithTtl("admin:categories:manage", ADMIN_CACHE_TTL_SECONDS, async () => {
    const raw = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        parent: {
          select: { name: true, slug: true },
        },
        _count: { select: { posts: true } },
      },
    })
    return sortCategoriesByTree(raw)
  })
}

export async function getCategoriesForWrite(activeTab: AdminTab) {
  if (activeTab !== "write") {
    return []
  }

  return memoizeWithTtl("admin:categories:write", ADMIN_CACHE_TTL_SECONDS, async () => {
    const raw = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, parent: { select: { name: true } } },
    })
    return sortCategoriesByTree(raw)
  })
}

export async function getSeoKeywordOptions(activeTab: AdminTab) {
  if (activeTab !== "write") {
    return []
  }

  return memoizeWithTtl("admin:seo-keywords:write", ADMIN_CACHE_TTL_SECONDS, async () => {
    await ensureSeoKeywordStoreSeeded()

    return prisma.seoKeyword.findMany({
      orderBy: { keyword: "asc" },
      take: 200,
      select: {
        id: true,
        keyword: true,
      },
    })
  })
}
