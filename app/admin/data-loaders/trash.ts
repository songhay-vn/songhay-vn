import type { Prisma } from "@prisma/client"

import { canViewAllPosts } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { buildPaginationItems, endOfDay, parseDateInput, startOfDay } from "@/app/admin/data-helpers"
import type { AdminCurrentUser, AdminTab, TrashFilters } from "@/app/admin/data-types"

const TRASH_PAGE_SIZE = 10

export async function getTrashedPostsData(activeTab: AdminTab, trashFilters: TrashFilters, currentUser: AdminCurrentUser) {
  if (activeTab !== "trash") {
    return {
      rows: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      paginationItems: [] as Array<number | "ellipsis">,
      authorOptions: [] as Array<{ id: string; name: string; email: string }>,
    }
  }

  const trashFromDate = parseDateInput(trashFilters.fromDate)
  const trashToDate = parseDateInput(trashFilters.toDate)

  const trashWhere: Prisma.PostWhereInput = {
    isDeleted: true,
    ...(canViewAllPosts(currentUser.role) ? {} : { authorId: currentUser.id }),
    ...(canViewAllPosts(currentUser.role) && trashFilters.authorId.length > 0 ? { authorId: trashFilters.authorId } : {}),
    ...(trashFromDate || trashToDate
      ? {
        deletedAt: {
          ...(trashFromDate ? { gte: startOfDay(trashFromDate) } : {}),
          ...(trashToDate ? { lte: endOfDay(trashToDate) } : {}),
        },
      }
      : {}),
    ...(trashFilters.query.length > 0
      ? {
        OR: [
          { title: { contains: trashFilters.query, mode: "insensitive" } },
          { slug: { contains: trashFilters.query, mode: "insensitive" } },
          { category: { name: { contains: trashFilters.query, mode: "insensitive" } } },
          { author: { name: { contains: trashFilters.query, mode: "insensitive" } } },
          { author: { email: { contains: trashFilters.query, mode: "insensitive" } } },
        ],
      }
      : {}),
  }

  const totalCount = await prisma.post.count({ where: trashWhere })
  const totalPages = Math.max(1, Math.ceil(totalCount / TRASH_PAGE_SIZE))
  const currentPage = Math.min(trashFilters.requestedPage, totalPages)

  const rows = await prisma.post.findMany({
    where: trashWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      penName: true,
      excerpt: true,
      seoKeywords: true,
      thumbnailUrl: true,
      createdAt: true,
      publishedAt: true,
      approvedAt: true,
      deletedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: [{ deletedAt: "desc" }, { updatedAt: "desc" }],
    skip: (currentPage - 1) * TRASH_PAGE_SIZE,
    take: TRASH_PAGE_SIZE,
  })

  const authorOptions = canViewAllPosts(currentUser.role)
    ? await prisma.user.findMany({
      where: {
        posts: {
          some: {
            isDeleted: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    })
    : []

  return {
    rows,
    totalCount,
    totalPages,
    currentPage,
    paginationItems: buildPaginationItems(currentPage, totalPages),
    authorOptions,
  }
}
