import { redirect } from "next/navigation"

import { type EditorialStatus, type UserRole } from "@prisma/client"

import { can, canPublishNow, canSubmitPendingPublish } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

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

import { revalidateTag } from "next/cache"

/**
 * Full cache tag invalidation: use when a post's PUBLIC visibility changes
 * (published, unpublished, trashed from published, restored to published).
 *
 * Uses tag-only invalidation — NO revalidatePath / ISR page writes.
 * With cacheLife("weeks"), the next visitor after a revalidateTag call
 * automatically gets freshly fetched data without triggering an ISR write.
 */
export async function revalidatePost(
  slug?: string,
  categorySlug?: string,
  options?: {
    isVisibilityChange?: boolean
    isTrendingChange?: boolean
    isFeaturedChange?: boolean
    isVideoChange?: boolean
  }
) {
  if (slug) {
    revalidateTag(`post:${slug}`)
    revalidateTag("post-detail")
  }

  if (categorySlug) {
    revalidateTag(`category:${categorySlug}`)
    if (!options || options.isVisibilityChange) {
      revalidateTag("category-posts")
    }
  }

  if (!options || options.isVisibilityChange || options.isFeaturedChange || options.isTrendingChange) {
    revalidateTag("homepage")
  }

  if (!options || options.isVisibilityChange) {
    revalidateTag("latest-by-category")
    revalidateTag("search-results")
    revalidateTag("categories")
    revalidateTag("related-posts")
    revalidateTag("recommended-posts")
  }

  if (!options || options.isTrendingChange || options.isVisibilityChange) {
    revalidateTag("trending-posts")
  }

  if (!options || options.isVideoChange || options.isVisibilityChange) {
    revalidateTag("most-watched-videos")
  }
}

/**
 * Tag-only invalidation: use for internal workflow transitions on NON-PUBLIC posts
 * (DRAFT → PENDING_REVIEW → PENDING_PUBLISH → REJECTED, etc.).
 * Only invalidates the Next.js Data Cache — zero ISR page writes.
 */
export function revalidatePostTagsOnly(slug?: string, categorySlug?: string) {
  if (slug) {
    revalidateTag(`post:${slug}`)
    revalidateTag("post-detail")
  }
  if (categorySlug) {
    revalidateTag(`category:${categorySlug}`)
    revalidateTag("category-posts")
  }
  revalidateTag("categories")
  revalidateTag("latest-by-category")
}
