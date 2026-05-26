import { cacheTag, cacheLife } from "next/cache"
import type { Prisma } from "@prisma/client"

import { NAV_CATEGORIES } from "./categories"
import { prisma } from "@/lib/prisma"
import { publishedPostWhere, selectApprovedCommentsCount } from "./query-utils"

import type {
  PostListItem,
  PostFull,
  PostWithCategoryAndComments,
} from "@/types/post"
import type { SearchResultItem } from "@/types/search"
import type { CategoryWithChildren } from "@/types/category"

export type {
  PostListItem,
  PostFull,
  SearchResultItem,
  CategoryWithChildren,
  PostWithCategoryAndComments,
}

const SEARCH_PAGE_SIZE_DEFAULT = 12
const SEARCH_PAGE_SIZE_MAX = 24
const SEARCH_SUGGEST_LIMIT_MAX = 10

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, " ")
}

function createPublishedSearchWhere(
  normalizedQuery: string
): Prisma.PostWhereInput {
  return {
    ...publishedPostWhere(),
    isDraft: false,
    OR: [
      { title: { contains: normalizedQuery, mode: "insensitive" } },
      { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
      { content: { contains: normalizedQuery, mode: "insensitive" } },
      {
        category: { name: { contains: normalizedQuery, mode: "insensitive" } },
      },
    ],
  }
}

async function getMostReadPostsHome() {
  "use cache"
  cacheTag("homepage-most-read")
  cacheLife("weeks")
  return prisma.post.findMany({
    where: publishedPostWhere(),
    include: {
      category: true,
      _count: selectApprovedCommentsCount,
    },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: 5,
  })
}

async function getLatestPostsHome() {
  "use cache"
  cacheTag("homepage-latest")
  cacheLife("weeks")
  return prisma.post.findMany({
    where: publishedPostWhere(),
    include: {
      category: true,
      _count: selectApprovedCommentsCount,
    },
    orderBy: { publishedAt: "desc" },
    take: 30,
  })
}

export async function getHomepageData() {
  const [mostRead, latest] = await Promise.all([
    getMostReadPostsHome(),
    getLatestPostsHome(),
  ])

  const heroSlots = latest.slice(0, 7)
  return { heroSlots, mostRead, latest }
}

export async function getPostsByCategory(categorySlug: string) {
  "use cache"
  cacheTag("category-posts", `category:${categorySlug}`)
  cacheLife("weeks") // Content rarely changes, use days or 86400s

  return prisma.post.findMany({
    where: {
      ...publishedPostWhere(),
      OR: [
        { category: { slug: categorySlug } },
        { category: { parent: { slug: categorySlug } } },
      ],
    },
    include: {
      category: true,
      _count: selectApprovedCommentsCount,
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })
}

export async function searchPublishedPosts(query: string, limit = 24) {
  "use cache"
  cacheTag("search-results")
  cacheLife("weeks")

  const normalizedQuery = normalizeSearchQuery(query)
  const safeLimit = Math.min(Math.max(limit, 1), 48)

  if (!normalizedQuery) return []

  return prisma.post.findMany({
    where: {
      ...publishedPostWhere(),
      isDraft: false,
      OR: [
        { title: { contains: normalizedQuery, mode: "insensitive" } },
        { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
        {
          category: {
            name: { contains: normalizedQuery, mode: "insensitive" },
          },
        },
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
      _count: selectApprovedCommentsCount,
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
  cacheLife("weeks")

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
      _count: selectApprovedCommentsCount,
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
  cacheLife("weeks")

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
  cacheLife("weeks")

  return prisma.category.findUnique({
    where: { slug: categorySlug },
  })
}

export async function getPostByCategoryAndSlug(
  categorySlug: string,
  slug: string
) {
  "use cache"
  cacheTag("post-detail", `post:${slug}`)
  cacheLife("weeks")

  return prisma.post.findFirst({
    where: {
      ...publishedPostWhere(),
      slug,
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

export async function getTrendingPosts() {
  "use cache"
  cacheTag("trending-posts")
  cacheLife("weeks")

  return prisma.post.findMany({
    where: {
      ...publishedPostWhere(),
      OR: [{ isTrending: true }, { views: { gt: 100 } }],
    },
    include: {
      category: true,
      _count: selectApprovedCommentsCount,
    },
    orderBy: [
      { isTrending: "desc" },
      { views: "desc" },
      { publishedAt: "desc" },
    ],
    take: 12,
  })
}

export async function getRecommendedPosts(
  postId?: string,
  categoryId?: string,
  limit = 4
) {
  "use cache"
  cacheTag("recommended-posts")
  cacheLife("weeks")

  const where: Prisma.PostWhereInput = publishedPostWhere()

  if (postId) {
    where.id = { not: postId }
  }

  const orConditions: Prisma.PostWhereInput[] = [
    { isFeatured: true },
    { isTrending: true },
  ]
  if (categoryId) {
    orConditions.push({ categoryId })
  }
  where.OR = orConditions

  return prisma.post.findMany({
    where,
    include: {
      category: true,
      _count: selectApprovedCommentsCount,
    },
    orderBy: [
      { isFeatured: "desc" },
      { isTrending: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  })
}

export async function getNavCategories(): Promise<CategoryWithChildren[]> {
  "use cache"
  cacheTag("categories")
  cacheLife("weeks")

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
    console.error(
      "Failed to fetch nav categories from DB, falling back to static:",
      error
    )
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

export async function getLatestByCategory(
  perCategory = 4,
  categoriesLimit = 6
) {
  "use cache"
  cacheTag("latest-by-category")
  cacheLife("weeks")

  const topCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: categoriesLimit,
  })

  const categoryIds = topCategories.map((c) => c.id)

  // Single query instead of N concurrent queries — avoids connection pool exhaustion
  const allPosts = await prisma.post.findMany({
    where: {
      ...publishedPostWhere(),
      isDraft: false,
      category: {
        OR: [{ id: { in: categoryIds } }, { parentId: { in: categoryIds } }],
      },
    },
    include: {
      category: true,
      _count: selectApprovedCommentsCount,
    },
    orderBy: { publishedAt: "desc" },
    // Fetch 5× the needed amount to ensure all categories get enough posts even
    // if recent posts cluster in one category (e.g. a burst of song-khoe articles)
    take: perCategory * categoriesLimit * 5,
  })

  // Group posts by their root category (parent or self) and limit per group
  const grouped = new Map<string, typeof allPosts>()
  for (const cat of topCategories) {
    grouped.set(cat.id, [])
  }

  for (const post of allPosts) {
    const rootId = post.category.parentId ?? post.category.id
    const bucket = grouped.get(rootId)
    if (bucket && bucket.length < perCategory) {
      bucket.push(post)
    }
  }

  return topCategories
    .map((cat) => ({ ...cat, posts: grouped.get(cat.id) ?? [] }))
    .filter((cat) => cat.posts.length > 0)
}

// --- Build-time helpers (no cache needed — run at build in generateStaticParams) ---

export async function getLatestPostsForSsg(limit = 50) {
  return prisma.post.findMany({
    where: {
      ...publishedPostWhere(),
      isDraft: false,
    },
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
