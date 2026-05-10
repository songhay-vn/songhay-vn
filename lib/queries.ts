import { cacheTag, cacheLife } from "next/cache"
import type { Prisma } from "@prisma/client"

import { NAV_CATEGORIES } from "./categories"
import { prisma } from "@/lib/prisma"

import type { PostListItem, PostFull, PostWithCategoryAndComments } from "@/types/post"
import type { SearchResultItem } from "@/types/search"
import type { CategoryWithChildren } from "@/types/category"

export type { PostListItem, PostFull, SearchResultItem, CategoryWithChildren, PostWithCategoryAndComments }

const SEARCH_PAGE_SIZE_DEFAULT = 12
const SEARCH_PAGE_SIZE_MAX = 24
const SEARCH_SUGGEST_LIMIT_MAX = 10

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, " ")
}

function createPublishedSearchWhere(normalizedQuery: string): Prisma.PostWhereInput {
  return {
    isPublished: true,
    isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
    isDraft: false,
    OR: [
      { title: { contains: normalizedQuery, mode: "insensitive" } },
      { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
      { content: { contains: normalizedQuery, mode: "insensitive" } },
      { category: { name: { contains: normalizedQuery, mode: "insensitive" } } },
    ],
  }
}

export async function getHomepageData() {
  "use cache"
  cacheTag("homepage")
  cacheLife({ revalidate: 600 })  // 10 min — homepage

  const [mostRead, latest, recommended, mostWatched] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
      include: {
        category: true,
        _count: { select: { comments: { where: { isApproved: true } } } },
      },
      orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
      take: 5,
    }),
    prisma.post.findMany({
      where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
      include: {
        category: true,
        _count: { select: { comments: { where: { isApproved: true } } } },
      },
      orderBy: { publishedAt: "desc" },
      take: 30,
    }),
    getRecommendedPosts(undefined, undefined, 12),
    getMostWatchedVideos(8),
  ])

  const heroSlots = latest.slice(0, 7)
  return { heroSlots, mostRead, latest, recommended, mostWatched }
}

export async function getPostsByCategory(categorySlug: string) {
  "use cache"
  cacheTag("category-posts", `category:${categorySlug}`)
  cacheLife({ revalidate: 600 })  // 10 min — category listing

  return prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
      OR: [
        { category: { slug: categorySlug } },
        { category: { parent: { slug: categorySlug } } },
      ],
    },
    include: {
      category: true,
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })
}

export async function searchPublishedPosts(query: string, limit = 24) {
  "use cache"
  cacheTag("search-results")
  cacheLife({ revalidate: 600 })  // 10 min — search results

  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), 48)

  if (!normalizedQuery) return []

  return prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
      isDraft: false,
      OR: [
        { title: { contains: normalizedQuery, mode: "insensitive" } },
        { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
        { category: { name: { contains: normalizedQuery, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      thumbnailUrl: true,
      publishedAt: true,
      category: {
        select: { name: true, slug: true },
      },
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: safeLimit,
  })
}

export async function getPublishedSearchResults(
  query: string,
  page = 1,
  pageSize = SEARCH_PAGE_SIZE_DEFAULT
) {
  "use cache"
  cacheTag("search-results")
  cacheLife({ revalidate: 600 })  // 10 min — search results paginated

  const normalizedQuery = normalizeSearchQuery(query)
  const safePage = Math.max(page, 1)
  const safePageSize = Math.min(Math.max(pageSize, 1), SEARCH_PAGE_SIZE_MAX)

  if (!normalizedQuery) {
    return {
      query: "",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: safePageSize,
      totalPages: 0,
    }
  }

  const where = createPublishedSearchWhere(normalizedQuery)
  const totalCount = await prisma.post.count({ where })

  if (totalCount === 0) {
    return {
      query: normalizedQuery,
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: safePageSize,
      totalPages: 0,
    }
  }

  const totalPages = Math.ceil(totalCount / safePageSize)
  const currentPage = Math.min(safePage, totalPages)

  const items = await prisma.post.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      thumbnailUrl: true,
      publishedAt: true,
      category: {
        select: { name: true, slug: true },
      },
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    skip: (currentPage - 1) * safePageSize,
    take: safePageSize,
  })

  return {
    query: normalizedQuery,
    items,
    totalCount,
    page: currentPage,
    pageSize: safePageSize,
    totalPages,
  }
}

export async function searchPublishedPostSuggestions(query: string, limit = 6) {
  "use cache"
  cacheTag("search-results")
  cacheLife({ revalidate: 600 })  // 10 min — search suggestions

  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), SEARCH_SUGGEST_LIMIT_MAX)

  if (normalizedQuery.length < 2) return []

  return prisma.post.findMany({
    where: createPublishedSearchWhere(normalizedQuery),
    select: {
      id: true,
      title: true,
      slug: true,
      category: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: safeLimit,
  })
}

export async function getCategoryBySlug(categorySlug: string) {
  "use cache"
  cacheTag("categories")
  cacheLife({ revalidate: 600 })  // 10 min — category meta

  return prisma.category.findUnique({
    where: { slug: categorySlug },
  })
}

export async function getPostByCategoryAndSlug(categorySlug: string, slug: string) {
  "use cache"
  cacheTag("post-detail", `post:${slug}`)
  cacheLife({ revalidate: 1800 })  // 30 min — article detail

  return prisma.post.findFirst({
    where: {
      slug,
      isPublished: true,
      isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
      category: { slug: categorySlug },
    },
    include: {
      category: true,
      author: { select: { name: true } },
      comments: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export async function getRelatedPosts(postId: string, categoryId: string, limit = 8) {
  "use cache"
  cacheTag("related-posts", `category:${categoryId}`)
  cacheLife({ revalidate: 1800 })  // 30 min — related posts

  return prisma.post.findMany({
    where: {
      categoryId,
      id: { not: postId },
      isPublished: true,
      isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
    },
    include: {
      category: true,
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
}

export async function getTrendingPosts() {
  "use cache"
  cacheTag("trending-posts")
  cacheLife({ revalidate: 3600 })  // 1 hr — trending posts

  return prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
      OR: [{ isTrending: true }, { views: { gt: 100 } }],
    },
    include: {
      category: true,
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: [{ isTrending: "desc" }, { views: "desc" }, { publishedAt: "desc" }],
    take: 12,
  })
}

export async function getMostWatchedVideos(limit = 4) {
  "use cache"
  cacheTag("most-watched-videos")
  cacheLife({ revalidate: 3600 })

  return prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
      videoEmbedUrl: { not: null },
    },
    include: {
      category: true,
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: limit,
  })
}

export async function getRecommendedPosts(
  postId?: string,
  categoryId?: string,
  limit = 4
) {
  "use cache"
  cacheTag("recommended-posts")
  cacheLife({ revalidate: 3600 })  // 1 hr — recommended posts

  const where: Prisma.PostWhereInput = {
    isPublished: true,
    isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
  }

  if (postId) {
    where.id = { not: postId }
  }

  const orConditions: Prisma.PostWhereInput[] = [{ isFeatured: true }, { isTrending: true }]
  if (categoryId) {
    orConditions.push({ categoryId })
  }
  where.OR = orConditions

  return prisma.post.findMany({
    where,
    include: {
      category: true,
      _count: {
        select: { comments: { where: { isApproved: true } } },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { isTrending: "desc" }, { publishedAt: "desc" }],
    take: limit,
  })
}

export async function getNavCategories(): Promise<CategoryWithChildren[]> {
  "use cache"
  cacheTag("categories")
  cacheLife({ revalidate: 3600 })

  try {
    const allCats = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    if (allCats.length === 0) {
      return NAV_CATEGORIES.map((cat, idx) => ({
        id: `static-${idx}`,
        name: cat.name,
        slug: cat.slug,
        parentId: null,
        children: (cat.children || []).map((child, cIdx) => ({
          id: `static-${idx}-${cIdx}`,
          name: child.name,
          slug: child.slug,
          parentId: `static-${idx}`,
        })),
      }))
    }

    const roots = allCats.filter((c) => !c.parentId)
    return roots.map((root) => ({
      ...root,
      children: allCats.filter((c) => c.parentId === root.id),
    }))
  } catch (error) {
    console.error("Failed to fetch nav categories from DB, falling back to static:", error)
    return NAV_CATEGORIES.map((cat, idx) => ({
      id: `static-${idx}`,
      name: cat.name,
      slug: cat.slug,
      parentId: null,
      children: (cat.children || []).map((child, cIdx) => ({
        id: `static-${idx}-${cIdx}`,
        name: child.name,
        slug: child.slug,
        parentId: `static-${idx}`,
      })),
    }))
  }
}

export async function getLatestByCategory(perCategory = 4, categoriesLimit = 6) {
  "use cache"
  cacheTag("latest-by-category")
  cacheLife({ revalidate: 600 })  // 10 min — latest by category

  const topCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: categoriesLimit,
  })

  const categoriesWithPosts = await Promise.all(
    topCategories.map(async (cat) => {
      const posts = await prisma.post.findMany({
        where: {
          categoryId: cat.id,
          isPublished: true,
          isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }],
        },
        include: {
          category: true,
          _count: {
            select: { comments: { where: { isApproved: true } } },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: perCategory,
      })
      return { ...cat, posts }
    })
  )

  return categoriesWithPosts.filter((cat) => cat.posts.length > 0)
}

// --- Build-time helpers (no cache needed — run at build in generateStaticParams) ---

export async function getLatestPostsForSsg(limit = 50) {
  return prisma.post.findMany({
    where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }], isDraft: false },
    select: { slug: true, category: { select: { slug: true } } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  })
}

export async function getAllCategorySlugs() {
  return prisma.category.findMany({
    select: { slug: true },
  })
}
