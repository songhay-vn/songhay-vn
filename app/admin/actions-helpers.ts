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

export async function uniqueCategorySlug(baseName: string, currentId?: string) {
  const base = slugify(baseName)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!found || found.id === currentId) {
      return candidate
    }
    candidate = `${base}-${index}`
    index += 1
  }
}

export async function uniquePostSlug(baseTitle: string) {
  const base = slugify(baseTitle)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!found) {
      return candidate
    }
    index += 1
    candidate = `${base}-${index}`
  }
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

import { revalidateTag, revalidatePath } from "next/cache"

/**
 * Full revalidation: use when a post's PUBLIC visibility changes
 * (published, unpublished, trashed from published, restored to published).
 * revalidatePath triggers an ISR page write — use sparingly.
 */
export async function revalidatePost(slug?: string, categorySlug?: string) {
  if (slug) {
    revalidateTag(`post:${slug}`)
    revalidateTag("post-detail")
  }
  if (categorySlug) {
    revalidateTag(`category:${categorySlug}`)
    revalidateTag("category-posts")
    revalidatePath(`/${categorySlug}`)
    if (slug) revalidatePath(`/${categorySlug}/${slug}`)
  }
  revalidateTag("homepage")
  revalidateTag("categories")
  revalidateTag("latest-by-category")
  revalidateTag("trending-posts")
  revalidateTag("search-results")
  revalidateTag("recommended-posts")
  revalidateTag("most-watched-videos")
  revalidateTag("related-posts")
  revalidatePath("/")
}

/**
 * Tag-only revalidation: use for internal workflow transitions on NON-PUBLIC posts
 * (DRAFT → PENDING_REVIEW → PENDING_PUBLISH → REJECTED, etc.).
 * Only invalidates the Next.js Data Cache tags — NO ISR page writes.
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
  // Do NOT revalidatePath here — no ISR write needed for non-public posts
}
