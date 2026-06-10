import type { Prisma } from "@prisma/client"

import { canViewAllPosts } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { endOfDay, parseDateInput, startOfDay } from "@/app/admin/data-helpers"
import type {
  AdminCurrentUser,
  AdminTab,
  PostsFilters,
} from "@/app/admin/data-types"

const POSTS_PAGE_SIZE = 12

export async function getPostsData(
  activeTab: AdminTab,
  postsFilters: PostsFilters,
  currentUser: AdminCurrentUser
) {
  if (activeTab !== "posts") {
    return {
      posts: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      filterOptions: {
        authors: [] as Array<{ id: string; name: string; email: string }>,
        categories: [] as Array<{ id: string; name: string; slug: string }>,
      },
    }
  }

  const postsFromDate = parseDateInput(postsFilters.fromDate)
  const postsToDate = parseDateInput(postsFilters.toDate)

  const statusWhere: Prisma.PostWhereInput =
    postsFilters.status === "draft"
      ? { editorialStatus: "DRAFT" }
      : postsFilters.status === "pending-review"
        ? { editorialStatus: "PENDING_REVIEW" }
        : postsFilters.status === "pending-publish"
          ? { editorialStatus: "PENDING_PUBLISH" }
          : postsFilters.status === "published"
            ? { editorialStatus: "PUBLISHED" }
            : postsFilters.status === "rejected"
              ? { editorialStatus: "REJECTED" }
              : {}

  const postsWhere: Prisma.PostWhereInput = {
    isDeleted: false,
    ...(canViewAllPosts(currentUser.role) ? {} : { authorId: currentUser.id }),
    ...statusWhere,
    ...(postsFilters.authorId.length > 0 && postsFilters.authorId !== "all"
      ? { authorId: postsFilters.authorId }
      : {}),
    ...(postsFilters.approval === "approved"
      ? { approverId: { not: null } }
      : {}),
    ...(postsFilters.approval === "unapproved" ? { approverId: null } : {}),
    ...(postsFilters.categoryId.length > 0
      ? { categoryId: postsFilters.categoryId }
      : {}),
    ...(postsFromDate || postsToDate
      ? {
          updatedAt: {
            ...(postsFromDate ? { gte: startOfDay(postsFromDate) } : {}),
            ...(postsToDate ? { lte: endOfDay(postsToDate) } : {}),
          },
        }
      : {}),
    ...(postsFilters.query.length > 0
      ? {
          OR: [
            { title: { contains: postsFilters.query, mode: "insensitive" } },
            { slug: { contains: postsFilters.query, mode: "insensitive" } },
            { excerpt: { contains: postsFilters.query, mode: "insensitive" } },
            {
              category: {
                name: { contains: postsFilters.query, mode: "insensitive" },
              },
            },
            {
              author: {
                name: { contains: postsFilters.query, mode: "insensitive" },
              },
            },
            {
              author: {
                email: { contains: postsFilters.query, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  }

  const filterOptionsPromise = Promise.all([
    prisma.user.findMany({
      where: {
        posts: {
          some: {
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
    prisma.category.findMany({
      where: {
        posts: {
          some: {
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])
  void filterOptionsPromise.catch(() => undefined)

  const totalCount = await prisma.post.count({ where: postsWhere })
  const totalPages = Math.max(1, Math.ceil(totalCount / POSTS_PAGE_SIZE))
  const currentPage = Math.min(postsFilters.requestedPage, totalPages)

  const [posts, [authorOptions, categoryOptions]] = await Promise.all([
    prisma.post.findMany({
      where: postsWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        penName: true,
        excerpt: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        approvedAt: true,
        scheduledPublishAt: true,
        isFeatured: true,
        isTrending: true,
        isPublished: true,
        isDraft: true,
        editorialStatus: true,
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
        searchConsoleStatuses: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: {
            verdict: true,
            coverageState: true,
            robotsTxtState: true,
            indexingState: true,
            pageFetchState: true,
            lastCrawlTime: true,
            checkedAt: true,
            lastError: true,
          },
        },
        searchConsoleJobs: {
          where: {
            type: "URL_INSPECTION",
            status: { in: ["PENDING", "RUNNING"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            runAfter: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * POSTS_PAGE_SIZE,
      take: POSTS_PAGE_SIZE,
    }),
    filterOptionsPromise,
  ])

  return {
    posts,
    totalCount,
    totalPages,
    currentPage,
    filterOptions: {
      authors: authorOptions,
      categories: categoryOptions,
    },
  }
}
