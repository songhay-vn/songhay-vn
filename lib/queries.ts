import { cacheTag, cacheLife } from "next/cache"
import type { Prisma } from "@prisma/client"

import { NAV_CATEGORIES } from "./categories"
import {
  fetchAnalyticsContentSignals,
  fetchAnalyticsPageViewCount,
} from "@/lib/google-seo-signals"
import { prisma } from "@/lib/prisma"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"
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
const CATEGORY_SECTION_CANDIDATE_MULTIPLIER = 3
const CATEGORY_SECTION_CANDIDATE_MAX = 180
const POPULAR_POSTS_ANALYTICS_DAYS = 7
const POPULAR_POSTS_ANALYTICS_CANDIDATE_MULTIPLIER = 8
const POPULAR_POSTS_ANALYTICS_CANDIDATE_MIN = 30
const POPULAR_POSTS_ANALYTICS_CANDIDATE_MAX = 100
const POST_VIEW_COUNT_ANALYTICS_DAYS = 30

const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  thumbnailUrl: true,
  publishedAt: true,
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  _count: selectApprovedCommentsCount,
} satisfies Prisma.PostSelect

const postCardWithRootCategorySelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  thumbnailUrl: true,
  publishedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
  },
  _count: selectApprovedCommentsCount,
} satisfies Prisma.PostSelect

type PostCardWithAnalyticsViews = Prisma.PostGetPayload<{
  select: typeof postCardSelect
}> & { views: number }

type AnalyticsArticlePath = {
  categorySlug: string
  slug: string
  views: number
}

function clampPositiveInt(value: number, fallback: number, max: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }

  return Math.min(Math.floor(value), max)
}

function safeDecodePathSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function getAnalyticsPathname(path: string) {
  const trimmedPath = path.trim()
  if (!trimmedPath || trimmedPath === "(not set)") {
    return ""
  }

  try {
    const url = new URL(trimmedPath, "https://songhay.vn")
    return url.pathname.replace(/\/+$/, "")
  } catch {
    const [pathname = ""] = trimmedPath.split(/[?#]/)
    return pathname.replace(/\/+$/, "")
  }
}

function getAnalyticsArticlePath(path: string): AnalyticsArticlePath | null {
  const parts = getAnalyticsPathname(path)
    .split("/")
    .filter(Boolean)
    .map(safeDecodePathSegment)

  if (parts.length !== 2) {
    return null
  }

  const [categorySlug, slug] = parts
  if (!categorySlug || !slug || categorySlug === "admin") {
    return null
  }

  return { categorySlug, slug, views: 0 }
}

function getPopularPostKey(categorySlug: string, slug: string) {
  return `${categorySlug}/${slug}`
}

async function getAnalyticsPopularPosts({
  limit,
  categorySlug,
}: {
  limit: number
  categorySlug: string
}): Promise<PostCardWithAnalyticsViews[]> {
  const analyticsLimit = Math.min(
    Math.max(
      limit * POPULAR_POSTS_ANALYTICS_CANDIDATE_MULTIPLIER,
      POPULAR_POSTS_ANALYTICS_CANDIDATE_MIN
    ),
    POPULAR_POSTS_ANALYTICS_CANDIDATE_MAX
  )
  const analytics = await fetchAnalyticsContentSignals({
    days: POPULAR_POSTS_ANALYTICS_DAYS,
    limit: analyticsLimit,
  })

  if (analytics.error || analytics.pages.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const rankedPaths: AnalyticsArticlePath[] = []

  for (const page of analytics.pages) {
    const articlePath = getAnalyticsArticlePath(page.path)
    if (!articlePath) {
      continue
    }

    if (categorySlug && articlePath.categorySlug !== categorySlug) {
      continue
    }

    const key = getPopularPostKey(articlePath.categorySlug, articlePath.slug)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    rankedPaths.push({ ...articlePath, views: page.screenPageViews })
  }

  if (rankedPaths.length === 0) {
    return []
  }

  const posts = await prisma.post.findMany({
    where: {
      ...publishedPostWhere(),
      isDraft: false,
      OR: rankedPaths.map(({ categorySlug, slug }) => ({
        slug,
        category: { slug: categorySlug },
      })),
    },
    select: postCardSelect,
    take: rankedPaths.length,
  })
  const postsByPath = new Map(
    posts.map((post) => [
      getPopularPostKey(post.category.slug, post.slug),
      post,
    ])
  )

  return rankedPaths
    .map((articlePath) => {
      const post = postsByPath.get(
        getPopularPostKey(articlePath.categorySlug, articlePath.slug)
      )

      return post ? { ...post, views: articlePath.views } : null
    })
    .filter((post): post is PostCardWithAnalyticsViews => Boolean(post))
    .slice(0, limit)
}

async function getPopularPosts({
  limit,
  categorySlug,
}: {
  limit: number
  categorySlug?: string
}) {
  const safeLimit = clampPositiveInt(limit, 5, 20)
  const safeCategorySlug = (categorySlug || "").trim()

  return getAnalyticsPopularPosts({
    limit: safeLimit,
    categorySlug: safeCategorySlug,
  })
}

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
  cacheLife("hours")

  return getPopularPosts({
    limit: 5,
  })
}

export async function getMostReadPosts({
  limit = 5,
  categorySlug = "",
}: {
  limit?: number
  categorySlug?: string
} = {}) {
  "use cache"
  cacheTag("trending-posts", "homepage-most-read")
  if (categorySlug) {
    cacheTag(`category:${categorySlug}`)
  }
  cacheLife("hours")

  return getPopularPosts({
    limit,
    categorySlug,
  })
}

async function getLatestPostsHome() {
  "use cache"
  cacheTag("homepage", "homepage-latest")
  cacheLife("weeks")
  return prisma.post.findMany({
    where: publishedPostWhere(),
    select: postCardSelect,
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
  const latestRest = latest.slice(7)
  return { heroSlots, latestRest, mostRead }
}

export async function getLatestPublishedPosts(limit = 4) {
  "use cache"
  cacheTag("homepage", "homepage-latest")
  cacheLife("hours")

  const safeLimit = Math.min(Math.max(limit, 1), 12)

  return prisma.post.findMany({
    where: publishedPostWhere(),
    select: postCardSelect,
    orderBy: { publishedAt: "desc" },
    take: safeLimit,
  })
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
    select: postCardSelect,
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
    where: createPublishedSearchWhere(normalizedQuery),
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
  cacheTag(`post:${slug}`)
  cacheLife("weeks")

  try {
    return await prisma.post.findFirst({
      where: {
        ...publishedPostWhere(),
        slug,
        category: { slug: categorySlug },
      },
      include: {
        category: true,
        penNameProfile: { select: { name: true, avatarUrl: true } },
        author: { select: { name: true } },
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error
    }

    return prisma.post.findFirst({
      where: {
        ...publishedPostWhere(),
        slug,
        category: { slug: categorySlug },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        penName: true,
        thumbnailUrl: true,
        videoEmbedUrl: true,
        seoTitle: true,
        seoDescription: true,
        ogImage: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
        comments: {
          where: { isApproved: true },
          select: { id: true, authorName: true, content: true },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  }
}

export async function getPostViewCountFromAnalytics(
  categorySlug: string,
  slug: string
) {
  "use cache"
  cacheTag("ga4-post-views", `ga4-post-views:${categorySlug}:${slug}`)
  cacheLife({ stale: 60 * 60, revalidate: 6 * 60 * 60, expire: 24 * 60 * 60 })

  const result = await fetchAnalyticsPageViewCount({
    path: `/${categorySlug}/${slug}`,
    days: POST_VIEW_COUNT_ANALYTICS_DAYS,
  })

  return result.error ? null : result.screenPageViews
}

export async function getTrendingPosts() {
  "use cache"
  cacheTag("trending-posts")
  cacheLife("hours")

  return getPopularPosts({
    limit: 5,
  })
}

export async function getFeaturedPosts() {
  "use cache"
  cacheTag("featured-posts")
  cacheLife("days")

  return prisma.post.findMany({
    where: {
      isFeatured: true,
      isPublished: true,
      isDeleted: false,
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      slug: true,
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
  })
}

async function getRecommendedPostsCached(
  categoryId?: string,
  limit = 4
) {
  "use cache"
  cacheTag("recommended-posts")
  cacheLife("weeks")

  const where: Prisma.PostWhereInput = publishedPostWhere()

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
    select: postCardSelect,
    orderBy: [
      { isFeatured: "desc" },
      { isTrending: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit + 1,
  })
}

export async function getRecommendedPosts(
  postId?: string,
  categoryId?: string,
  limit = 4
) {
  const posts = await getRecommendedPostsCached(categoryId, limit)
  const filtered = postId ? posts.filter((post) => post.id !== postId) : posts
  return filtered.slice(0, limit)
}

function buildStaticNavFallback(): CategoryWithChildren[] {
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
      return buildStaticNavFallback()
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
    return buildStaticNavFallback()
  }
}

export async function getLatestByCategory(
  perCategory = 4,
  categoriesLimit = 6
) {
  "use cache"
  cacheTag("latest-by-category", "category-posts", "categories")
  cacheLife("hours")

  const topCategories = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true, parentId: true },
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
    select: postCardWithRootCategorySelect,
    orderBy: { publishedAt: "desc" },
    // Fetch extra candidates to keep categories populated when recent posts
    // cluster in one section, but cap the scan so card queries stay cheap.
    take: Math.min(
      perCategory * categoriesLimit * CATEGORY_SECTION_CANDIDATE_MULTIPLIER,
      CATEGORY_SECTION_CANDIDATE_MAX
    ),
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
