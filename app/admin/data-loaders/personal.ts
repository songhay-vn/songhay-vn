import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { buildPaginationItems, endOfDay, parseDateInput, startOfDay } from "@/app/admin/data-helpers"
import { attachAnalyticsViewsToPostRows } from "@/app/admin/data-loaders/post-analytics"
import type { AdminCurrentUser, AdminTab, PersonalArchiveFilters } from "@/app/admin/data-types"

const PERSONAL_ARCHIVE_PAGE_SIZE = 10

export async function getPersonalPostsData(activeTab: AdminTab, personalArchiveFilters: PersonalArchiveFilters, currentUser: AdminCurrentUser) {
  if (activeTab !== "personal-archive") {
    return {
      rows: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      paginationItems: [] as Array<number | "ellipsis">,
    }
  }

  const personalFromDate = parseDateInput(personalArchiveFilters.fromDate)
  const personalToDate = parseDateInput(personalArchiveFilters.toDate)

  const personalWhere: Prisma.PostWhereInput = {
    isDeleted: false,
    authorId: currentUser.id,
    ...(personalArchiveFilters.status === "draft" ? { isDraft: true } : {}),
    ...(personalArchiveFilters.status === "pending" ? { editorialStatus: "PENDING_REVIEW" } : {}),
    ...(personalArchiveFilters.status === "pending-publish" ? { editorialStatus: "PENDING_PUBLISH" } : {}),
    ...(personalArchiveFilters.status === "published" ? { editorialStatus: "PUBLISHED" } : {}),
    ...(personalArchiveFilters.status === "rejected" ? { editorialStatus: "REJECTED" } : {}),
    ...(personalFromDate || personalToDate
      ? {
        updatedAt: {
          ...(personalFromDate ? { gte: startOfDay(personalFromDate) } : {}),
          ...(personalToDate ? { lte: endOfDay(personalToDate) } : {}),
        },
      }
      : {}),
    ...(personalArchiveFilters.query.length > 0
      ? {
        OR: [
          { title: { contains: personalArchiveFilters.query, mode: "insensitive" } },
          { slug: { contains: personalArchiveFilters.query, mode: "insensitive" } },
          { excerpt: { contains: personalArchiveFilters.query, mode: "insensitive" } },
          { category: { name: { contains: personalArchiveFilters.query, mode: "insensitive" } } },
        ],
      }
      : {}),
  }

  const totalCount = await prisma.post.count({ where: personalWhere })
  const totalPages = Math.max(1, Math.ceil(totalCount / PERSONAL_ARCHIVE_PAGE_SIZE))
  const currentPage = Math.min(personalArchiveFilters.requestedPage, totalPages)

  const rows = await prisma.post.findMany({
    where: personalWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      penName: true,
      excerpt: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      thumbnailUrl: true,
      editorialStatus: true,
      isPublished: true,
      isDraft: true,
      isFeatured: true,
      isTrending: true,
      createdAt: true,
      publishedAt: true,
      approvedAt: true,
      updatedAt: true,
      scheduledPublishAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lastEditor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    skip: (currentPage - 1) * PERSONAL_ARCHIVE_PAGE_SIZE,
    take: PERSONAL_ARCHIVE_PAGE_SIZE,
  })
  const rowsWithViews = await attachAnalyticsViewsToPostRows(rows)

  return {
    rows: rowsWithViews,
    totalCount,
    totalPages,
    currentPage,
    paginationItems: buildPaginationItems(currentPage, totalPages),
  }
}
