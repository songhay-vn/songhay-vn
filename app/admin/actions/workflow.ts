"use server"

import { requireCmsUser } from "@/lib/auth"
import { clearDataCache } from "@/lib/data-cache"
import {
  can,
  canApprovePendingReview,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
} from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import {
  enqueuePublishedPostSearchConsoleJobs,
  scheduleSearchConsoleDrain,
} from "@/lib/search-console-queue"
import {
  revalidatePost,
  revalidatePostTagsOnly,
} from "@/app/admin/actions-helpers"

async function requireReviewApprover() {
  const currentUser = await requireCmsUser()
  if (!canApprovePendingReview(currentUser.role)) {
    throw new Error("POST_ACTION_FORBIDDEN")
  }
  return currentUser
}

async function requirePublishManager() {
  const currentUser = await requireCmsUser()
  if (!canPublishNow(currentUser.role)) {
    throw new Error("POST_ACTION_FORBIDDEN")
  }
  return currentUser
}

export async function approvePendingPost(formData: FormData) {
  let currentUser
  try {
    currentUser = await requireReviewApprover()
  } catch {
    return { toast: "post_action_forbidden" }
  }
  const shouldPublishNow = canPublishNow(currentUser.role)

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true, editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) return

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: shouldPublishNow ? "PUBLISHED" : "PENDING_PUBLISH",
      isPublished: shouldPublishNow,
      isDraft: false,
      approverId: currentUser.id,
      approvedAt: new Date(),
      publishedAt: shouldPublishNow ? new Date() : undefined,
    },
  })

  if (existingPost.authorId && existingPost.authorId !== currentUser.id) {
    await prisma.notification.create({
      data: {
        userId: existingPost.authorId,
        type: "POST_APPROVED",
        message: shouldPublishNow
          ? `Bài viết "${existingPost.title}" của bạn đã được duyệt và xuất bản.`
          : `Bài viết "${existingPost.title}" của bạn đã được duyệt và đang chờ xuất bản.`,
        postId,
      },
    })
  }

  // Only full ISR revalidation if post is being published now
  if (shouldPublishNow) {
    await revalidatePost(existingPost.slug, existingPost.category?.slug, {
      isVisibilityChange: true,
      warmPublicRoutes: true,
    })
    if (existingPost.category?.slug) {
      await enqueuePublishedPostSearchConsoleJobs({
        postId,
        categorySlug: existingPost.category.slug,
        slug: existingPost.slug,
      })
      scheduleSearchConsoleDrain()
    }
  } else {
    // PENDING_PUBLISH: not yet public, just invalidate tags
    revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  }
  clearDataCache()

  return {
    toast: shouldPublishNow ? "post_approved" : "post_submitted_publish"
  }
}

export async function rejectPendingPost(formData: FormData) {
  let currentUser
  try {
    currentUser = await requireReviewApprover()
  } catch {
    return { toast: "post_action_forbidden" }
  }

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true, editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) return

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "REJECTED",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
  })

  if (existingPost.authorId && existingPost.authorId !== currentUser.id) {
    await prisma.notification.create({
      data: {
        userId: existingPost.authorId,
        type: "POST_REJECTED",
        message: `Bài viết "${existingPost.title}" của bạn đã bị từ chối.`,
        postId,
      },
    })
  }

  // Post rejected: not public — tag-only revalidation
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_rejected" }
}

export async function submitPostToPendingReview(formData: FormData) {
  const currentUser = await requireCmsUser()
  if (!can(currentUser.role, "submit-pending-review")) {
    return { toast: "post_action_forbidden" }
  }

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) {
    return { toast: "post_not_found" }
  }

  if (!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id) {
    return { toast: "post_action_forbidden" }
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_REVIEW",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
      publishedAt: undefined,
    },
  })



  // PENDING_REVIEW: not public yet — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_submitted_review" }
}

export async function promotePostToPendingPublish(formData: FormData) {
  const currentUser = await requireCmsUser()
  if (!(canApprovePendingReview(currentUser.role) || canSubmitPendingPublish(currentUser.role))) {
    return { toast: "post_action_forbidden" }
  }

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true, editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) return

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_PUBLISH",
      isPublished: false,
      isDraft: false,
      approverId: currentUser.id,
      approvedAt: new Date(),
      publishedAt: undefined,
    },
  })

  if (existingPost.authorId && existingPost.authorId !== currentUser.id) {
    await prisma.notification.create({
      data: {
        userId: existingPost.authorId,
        type: "POST_PENDING_PUBLISH",
        message: `Bài viết "${existingPost.title}" của bạn đã được duyệt và đang chờ xuất bản.`,
        postId,
      },
    })
  }

  // PENDING_PUBLISH: not public yet — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_submitted_publish" }
}

export async function returnPostToPendingReview(formData: FormData) {
  try {
    await requireReviewApprover()
  } catch {
    return { toast: "post_action_forbidden" }
  }

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) return

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_REVIEW",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
  })



  // Returned to PENDING_REVIEW: not public — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_returned_review" }
}

export async function returnPostToPendingPublish(formData: FormData) {
  try {
    await requirePublishManager()
  } catch {
    return { toast: "post_action_forbidden" }
  }

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) return

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_PUBLISH",
      isPublished: false,
      isDraft: false,
    },
  })



  // Returned to PENDING_PUBLISH: not public yet — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_returned_publish_queue" }
}

export async function returnPostToDraft(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, editorialStatus: true, slug: true, category: { select: { slug: true } } },
  })

  if (!existingPost) {
    return { toast: "post_not_found" }
  }

  const canManageWorkflow = canApprovePendingReview(currentUser.role) || canPublishNow(currentUser.role)
  if (!canManageWorkflow && existingPost.authorId !== currentUser.id) {
    return { toast: "post_action_forbidden" }
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "DRAFT",
      isPublished: false,
      isDraft: true,
      approverId: null,
      approvedAt: null,
      publishedAt: undefined,
    },
  })



  // Returned to DRAFT: not public — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_returned_draft" }
}
