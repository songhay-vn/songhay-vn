import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { type EditorialStatus, type UserRole } from "@prisma/client"

import { can, canPublishNow, canSubmitPendingPublish } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"
import { getSiteUrl } from "@/lib/seo"

export function ensurePermission(condition: boolean, redirectTo: string) {
  if (!condition) {
    redirect(redirectTo)
  }
}

export function resolveEditorialFromSubmitAction({
  submitAction,
  role,
}: {
  submitAction: string
  role: UserRole
}): {
  editorialStatus: EditorialStatus
  isDraft: boolean
  isPublished: boolean
} {
  if (submitAction === "save-draft") {
    return {
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
    }
  }

  if (submitAction === "submit-publish" && canSubmitPendingPublish(role)) {
    return {
      editorialStatus: "PENDING_PUBLISH",
      isDraft: false,
      isPublished: false,
    }
  }

  if (submitAction === "publish" && canPublishNow(role)) {
    return {
      editorialStatus: "PUBLISHED",
      isDraft: false,
      isPublished: true,
    }
  }

  if (submitAction === "submit-review" && can(role, "submit-pending-review")) {
    return {
      editorialStatus: "PENDING_REVIEW",
      isDraft: false,
      isPublished: false,
    }
  }

  return {
    editorialStatus: "DRAFT",
    isDraft: true,
    isPublished: false,
  }
}

export function getPlainTextFromHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function uniqueSlug(baseInput: string, checkIsTaken: (slug: string) => Promise<boolean>) {
  const base = slugify(baseInput)
  let candidate = base
  let index = 1

  while (await checkIsTaken(candidate)) {
    index += 1
    candidate = `${base}-${index}`
  }
  return candidate
}

export async function uniqueCategorySlug(baseName: string, currentId?: string) {
  return uniqueSlug(baseName, async (candidate) => {
    const found = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    return !!found && found.id !== currentId
  })
}

export async function uniquePostSlug(baseTitle: string, currentId?: string) {
  return uniqueSlug(baseTitle, async (candidate) => {
    const found = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    return !!found && found.id !== currentId
  })
}

export async function logPostHistory({
  postId,
  actorId,
  actionType,
  fromStatus,
  toStatus,
  snapshotTitle,
  snapshotExcerpt,
  snapshotContent,
}: {
  postId: string
  actorId: string
  actionType: string
  fromStatus?: EditorialStatus | null
  toStatus?: EditorialStatus | null
  snapshotTitle?: string | null
  snapshotExcerpt?: string | null
  snapshotContent?: string | null
}) {
  await prisma.postHistory.create({
    data: {
      postId,
      actorId,
      actionType,
      fromStatus,
      toStatus,
      snapshotTitle,
      snapshotExcerpt,
      snapshotContent,
    },
  })
}

const ROUTE_WARM_TIMEOUT_MS = 10_000

type RevalidatePostOptions = {
  isVisibilityChange?: boolean
  isTrendingChange?: boolean
  isFeaturedChange?: boolean
  isVideoChange?: boolean
  warmPublicRoutes?: boolean
}

async function warmRoute(pathname: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    ROUTE_WARM_TIMEOUT_MS
  )

  try {
    const url = new URL(pathname, getSiteUrl())
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "x-route-warm": "1",
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      console.warn(
        `Route warm failed for ${url.pathname}: ${response.status} ${response.statusText}`
      )
    }
  } catch (error) {
    console.warn(
      `Route warm failed for ${pathname}:`,
      error instanceof Error ? error.message : error
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

function scheduleRouteWarm(paths: string[]) {
  const uniquePaths = [...new Set(paths)]
  if (uniquePaths.length === 0) return

  const task = async () => {
    await Promise.all(uniquePaths.map((path) => warmRoute(path)))
  }

  try {
    after(task)
  } catch {
    void task()
  }
}

function warmPublicPostRoutes({
  slug,
  categorySlug,
}: {
  slug?: string
  categorySlug?: string
}) {
  if (!slug || !categorySlug) return

  scheduleRouteWarm([`/${categorySlug}/${slug}`])
}

/**
 * Full cache tag invalidation: use when a post's PUBLIC visibility changes
 * (published, unpublished, trashed from published, restored to published).
 *
 * Uses tag-only invalidation — NO revalidatePath. If route warming is enabled,
 * only the article URL is fetched so listing pages regenerate lazily.
 * Only the specific post's cache (post:<slug>) is invalidated — NOT the global
 * "post-detail" broadcast tag, which would force all 250+ pre-rendered article
 * pages to re-generate simultaneously (causing ~2K ISR hits per publish).
 */
export async function revalidatePost(
  slug?: string,
  categorySlug?: string,
  options?: RevalidatePostOptions
) {
  if (slug && categorySlug) {
    const fromPath = `/${categorySlug}/${slug}`
    const activeRedirect = await prisma.redirect.findFirst({
      where: { fromPath, isActive: true },
      select: { id: true },
    })
    if (activeRedirect) {
      await prisma.redirect.update({
        where: { id: activeRedirect.id },
        data: { isActive: false },
      })
      const { clearDataCache } = await import("@/lib/data-cache")
      clearDataCache("admin:redirects")
    }
  }

  if (slug) {
    revalidateTag(`post:${slug}`)
  }

  if (categorySlug) {
    revalidateTag(`category:${categorySlug}`)
    if (!options || options.isVisibilityChange) {
      revalidateTag("category-posts")
    }
  }

  if (
    !options ||
    options.isVisibilityChange ||
    options.isFeaturedChange ||
    options.isTrendingChange
  ) {
    revalidateTag("homepage")
  }

  if (!options || options.isTrendingChange) {
    revalidateTag("trending-posts")
  }

  if (!options || options.isFeaturedChange || options.isVisibilityChange) {
    revalidateTag("featured-posts")
  }

  if (!options || options.isVisibilityChange) {
    revalidateTag("latest-by-category")
  }

  if (!options || options.isVisibilityChange) {
    revalidateTag("search-results")
  }

  if (options?.isVideoChange || options?.isVisibilityChange) {
    revalidateTag("most-watched-videos")
  }

  if (!options || options.isVisibilityChange) {
    // Bust news-sitemap so it reflects the new publish set within the next crawl window
    revalidateTag("news-sitemap")
  }

  if (options?.warmPublicRoutes) {
    warmPublicPostRoutes({
      slug,
      categorySlug,
    })
  }
}

/**
 * Tag-only invalidation: use for internal workflow transitions on NON-PUBLIC posts
 * (DRAFT → PENDING_REVIEW → PENDING_PUBLISH → REJECTED, etc.).
 * Only invalidates the Next.js Data Cache — zero ISR page writes.
 */
export function revalidatePostTagsOnly(slug?: string, categorySlug?: string) {
  // Minimal invalidation for NON-PUBLIC workflow transitions.
  // Do NOT invalidate "categories", "category-posts", or "latest-by-category" here
  // — those are public-facing caches (e.g. getNavCategories renders on every page)
  // and draft/pending posts never appear in them.
  if (slug) {
    revalidateTag(`post:${slug}`)
  }
  if (categorySlug) {
    revalidateTag(`category:${categorySlug}`)
  }
}
