"use server"

import { redirect } from "next/navigation"

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
  ensurePermission,
  logPostHistory,
  revalidatePost,
  revalidatePostTagsOnly,
} from "@/app/admin/actions-helpers"

export async function approvePendingPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  if (!canApprovePendingReview(currentUser.role)) {
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

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: canPublishNow(currentUser.role) ? "PUBLISHED" : "PENDING_PUBLISH",
      isPublished: canPublishNow(currentUser.role),
      isDraft: false,
      approverId: currentUser.id,
      approvedAt: new Date(),
      publishedAt: canPublishNow(currentUser.role) ? new Date() : undefined,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  if (existingPost.authorId && existingPost.authorId !== currentUser.id) {
    await prisma.notification.create({
      data: {
        userId: existingPost.authorId,
        type: "POST_APPROVED",
        message: canPublishNow(currentUser.role)
          ? `Bài viết "${existingPost.title}" của bạn đã được duyệt và xuất bản.`
          : `Bài viết "${existingPost.title}" của bạn đã được duyệt và đang chờ xuất bản.`,
        postId,
      },
    })
  }

  // Only full ISR revalidation if post is being published now
  if (canPublishNow(currentUser.role)) {
    await revalidatePost(existingPost.slug, existingPost.category?.slug)
  } else {
    // PENDING_PUBLISH: not yet public, just invalidate tags
    revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  }
  clearDataCache()

  return {
    toast: canPublishNow(currentUser.role) ? "post_approved" : "post_submitted_publish"
  }
}

export async function rejectPendingPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  if (!canApprovePendingReview(currentUser.role)) {
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

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "REJECTED",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
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

  const updatedPost = await prisma.post.update({
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

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
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

  const updatedPost = await prisma.post.update({
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

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
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
  const currentUser = await requireCmsUser()
  if (!canApprovePendingReview(currentUser.role)) {
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

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_REVIEW",
      isPublished: false,
      isDraft: false,
      approverId: null,
      approvedAt: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  // Returned to PENDING_REVIEW: not public — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_returned_review" }
}

export async function returnPostToPendingPublish(formData: FormData) {
  const currentUser = await requireCmsUser()
  if (!canPublishNow(currentUser.role)) {
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

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      editorialStatus: "PENDING_PUBLISH",
      isPublished: false,
      isDraft: false,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
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

  const updatedPost = await prisma.post.update({
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

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "STATUS_CHANGED",
    fromStatus: existingPost.editorialStatus,
    toStatus: updatedPost.editorialStatus,
  })

  // Returned to DRAFT: not public — tag-only
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_returned_draft" }
}
