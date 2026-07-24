"use server"

import { redirect } from "next/navigation"

import { requireCmsUser } from "@/lib/auth"
import { uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import {
  can,
  canPublishNow,
  canTrashOrDeletePost,
  canViewAllPosts,
} from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { resolvePostSeoInput } from "@/lib/post-seo"
import {
  buildPublicPostUrl,
  enqueuePublishedPostInspection,
  enqueueRemovedPostSearchConsoleJobs,
  enqueuePublishedPostSearchConsoleJobs,
  scheduleSearchConsoleDrain,
} from "@/lib/search-console-queue"
import {
  resolveSeoKeywordSelection,
  resolveSeoKeywordSelectionForPreview,
  syncPostSeoKeywords,
} from "@/lib/seo-keyword-store"
import {
  ensurePermission,
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  uniquePostSlug,
  logPostHistory,
  revalidatePost,
  revalidatePostTagsOnly,
} from "@/app/admin/actions-helpers"

const FEATURED_SLOT_COUNT = 6

export async function createPost(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-post"),
    "/admin?tab=write&toast=post_action_forbidden"
  )

  const title = String(formData.get("title") || "").trim()
  const penNameId = String(formData.get("penNameId") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
  const subcategoryId = String(formData.get("subcategoryId") || "").trim()
  const categoryId = subcategoryId || mainCategoryId
  const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
  const rawSeoDescription = String(formData.get("seoDescription") || "").trim()
  const manualOgImage = String(formData.get("ogImage") || "").trim() || null
  const videoEmbedUrl =
    String(formData.get("videoEmbedUrl") || "").trim() || null
  const isSensitive = formData.get("isSensitive") === "on"
  const isSponsored = formData.get("isSponsored") === "on"
  const isFeatured = formData.get("isFeatured") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const submitAction = String(formData.get("submitAction") || "").trim()
  const thumbnailUpload = formData.get("thumbnailUpload")
  const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()
  const rawScheduledPublishAt = String(formData.get("scheduledPublishAt") || "").trim()
  const scheduledPublishAt = rawScheduledPublishAt ? new Date(rawScheduledPublishAt) : null
  const canonicalUrl = String(formData.get("canonicalUrl") || "").trim() || null

  const selectedPenName = penNameId
    ? await prisma.penName.findUnique({
        where: { id: penNameId },
        select: { id: true, name: true },
      })
    : null
  const penName = selectedPenName?.name || ""

  if (!title || !selectedPenName) {
    redirect("/admin?tab=write&toast=missing_fields")
  }

  if (submitAction !== "save-draft" && (!excerpt || !plainContent || !categoryId)) {
    redirect("/admin?tab=write&toast=missing_fields")
  }

  const { seoTitle, seoDescription } = resolvePostSeoInput({
    title,
    excerpt,
    content: plainContent,
    seoTitle: rawSeoTitle,
    seoDescription: rawSeoDescription,
  })

  const previewPostId = String(formData.get("previewPostId") || "").trim() || null

  const slug = previewPostId
    ? await (async () => {
        const existing = await prisma.post.findUnique({
          where: { id: previewPostId },
          select: { slug: true, authorId: true, isDraft: true },
        })
        // Only reuse if it's the author's own preview draft
        if (existing?.isDraft && existing.authorId === currentUser.id) {
          return existing.slug
        }
        return uniquePostSlug(title)
      })()
    : await uniquePostSlug(title)
  const thumbnailUrl =
    thumbnailUpload instanceof File && thumbnailUpload.size > 0
      ? await uploadThumbnail(thumbnailUpload)
      : thumbnailUrlInput || null
  const ogImage = thumbnailUrl || manualOgImage

  const { editorialStatus, isPublished, isDraft } =
    resolveEditorialFromSubmitAction({
      submitAction,
      role: currentUser.role,
    })

  const { keywordIds, seoKeywordsText } =
    await resolveSeoKeywordSelectionForPreview(formData)

  const post = await (async () => {
    // If a preview draft was created earlier, update it in place to avoid a new
    // uniquePostSlug collision that would append a -2 suffix.
    if (previewPostId) {
      const existing = await prisma.post.findUnique({
        where: { id: previewPostId },
        select: { id: true, authorId: true, isDraft: true },
      })
      if (existing?.isDraft && existing.authorId === currentUser.id) {
        return prisma.post.update({
          where: { id: previewPostId },
          data: {
            title,
            slug,
            penName,
            penNameId,
            excerpt,
            content,
            categoryId,
            seoTitle,
            seoDescription,
            seoKeywords: seoKeywordsText,
            ogImage,
            videoEmbedUrl,
            isSensitive,
            isSponsored,
            isFeatured,
            isTrending,
            isPublished,
            isDraft,
            editorialStatus,
            scheduledPublishAt,
            canonicalUrl,
            approvedAt: isPublished ? new Date() : null,
            approverId: isPublished ? currentUser.id : null,
            publishedAt: isPublished ? new Date() : undefined,
            thumbnailUrl,
          },
          include: { category: true },
        })
      }
    }

    return prisma.post.create({
      data: {
        title,
        slug,
        penName,
        penNameId,
        excerpt,
        content,
        categoryId,
        authorId: currentUser.id,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywordsText,
        ogImage,
        videoEmbedUrl,
        isSensitive,
        isSponsored,
        isFeatured,
        isTrending,
        isPublished,
        isDraft,
        editorialStatus,
        scheduledPublishAt,
        canonicalUrl,
        approvedAt: isPublished ? new Date() : null,
        approverId: isPublished ? currentUser.id : null,
        publishedAt: isPublished ? new Date() : undefined,
        thumbnailUrl,
      },
      include: { category: true }
    })
  })()

  await syncPostSeoKeywords(post.id, keywordIds)

  await logPostHistory({
    postId: post.id,
    actorId: currentUser.id,
    actionType: "CREATED",
    toStatus: post.editorialStatus,
    snapshotTitle: post.title,
    snapshotExcerpt: post.excerpt,
    snapshotContent: post.content,
  })

  // Only do heavy revalidation (ISR writes) if the post is actually going public
  if (isPublished) {
    await revalidatePost(post.slug, post.category?.slug, {
      isVisibilityChange: true,
      warmPublicRoutes: true,
    })
    if (post.category?.slug) {
      await enqueuePublishedPostSearchConsoleJobs({
        postId: post.id,
        categorySlug: post.category.slug,
        slug: post.slug,
      })
      scheduleSearchConsoleDrain()
    }
  } else {
    // Just invalidate data cache tags for internal lists
    revalidatePostTagsOnly(post.slug, post.category?.slug)
  }
  
  clearDataCache()
  if (editorialStatus === "DRAFT") {
    redirect("/admin?tab=personal-archive&toast=post_saved_draft")
  }

  if (isPublished) {
    redirect("/admin?tab=posts&toast=post_published")
  }

  if (editorialStatus === "PENDING_PUBLISH") {
    redirect(
      "/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish"
    )
  }

  redirect(
    "/admin?tab=posts&postsStatus=pending-review&toast=post_submitted_review"
  )
}

export async function createPostForPreview(
  formData: FormData
): Promise<{ postId: string } | { error: string }> {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "create-post"),
    "/admin?tab=write&toast=post_action_forbidden"
  )

  const title = String(formData.get("title") || "").trim()
  const penNameId = String(formData.get("penNameId") || "").trim()
  const excerpt = String(formData.get("excerpt") || "").trim()
  const content = String(formData.get("content") || "").trim()
  const plainContent = getPlainTextFromHtml(content)
  const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
  const subcategoryId = String(formData.get("subcategoryId") || "").trim()
  const categoryId = subcategoryId || mainCategoryId
  const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
  const rawSeoDescription = String(formData.get("seoDescription") || "").trim()
  const videoEmbedUrl =
    String(formData.get("videoEmbedUrl") || "").trim() || null
  const isSensitive = formData.get("isSensitive") === "on"
  const isSponsored = formData.get("isSponsored") === "on"
  const thumbnailUpload = formData.get("thumbnailUpload")
  const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()
  const previewPostId = String(formData.get("previewPostId") || "").trim() || null

  const selectedPenName = penNameId
    ? await prisma.penName.findUnique({
        where: { id: penNameId },
        select: { id: true, name: true },
      })
    : null
  const penName = selectedPenName?.name || ""

  if (!title || !selectedPenName) {
    return { error: "missing_fields" }
  }

  const { seoTitle, seoDescription } = resolvePostSeoInput({
    title,
    excerpt,
    content: plainContent,
    seoTitle: rawSeoTitle,
    seoDescription: rawSeoDescription,
  })

  const thumbnailUrl =
    thumbnailUpload instanceof File && thumbnailUpload.size > 0
      ? await uploadThumbnail(thumbnailUpload)
      : thumbnailUrlInput || null

  const { keywordIds, seoKeywordsText } =
    await resolveSeoKeywordSelection(formData)

  let post

  if (previewPostId) {
    const existing = await prisma.post.findUnique({
      where: { id: previewPostId },
      select: { id: true, authorId: true, isDraft: true },
    })
    
    if (existing?.isDraft && existing.authorId === currentUser.id) {
      post = await prisma.post.update({
        where: { id: previewPostId },
        data: {
          title,
          penName,
          penNameId,
          excerpt,
          content,
          categoryId,
          seoTitle,
          seoDescription,
          seoKeywords: seoKeywordsText,
          ogImage: thumbnailUrl,
          videoEmbedUrl,
          isSensitive,
          isSponsored,
          thumbnailUrl,
        },
      })
    }
  }

  if (!post) {
    const slug = await uniquePostSlug(title)
    
    post = await prisma.post.create({
      data: {
        title,
        slug,
        penName,
        penNameId,
        excerpt,
        content,
        categoryId,
        authorId: currentUser.id,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywordsText,
        ogImage: thumbnailUrl,
        videoEmbedUrl,
        isSensitive,
        isSponsored,
        isPublished: false,
        isDraft: true,
        editorialStatus: "DRAFT",
        thumbnailUrl,
      },
    })
  }

  await syncPostSeoKeywords(post.id, keywordIds)

  await logPostHistory({
    postId: post.id,
    actorId: currentUser.id,
    actionType: previewPostId && post ? "UPDATED" : "CREATED",
    toStatus: post.editorialStatus,
    snapshotTitle: post.title,
    snapshotExcerpt: post.excerpt,
    snapshotContent: post.content,
  })

  // Preview creation: no revalidation needed as it's not public and doesn't affect lists
  return { postId: post.id }
}

export async function updatePostFlags(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    canPublishNow(currentUser.role),
    "/admin?tab=posts&toast=post_action_forbidden"
  )

  const postId = String(formData.get("postId") || "")
  const isFeatured = formData.get("isFeatured") === "on"
  const isTrending = formData.get("isTrending") === "on"
  const isPublished = formData.get("isPublished") === "on"
  const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
  const rawSeoDescription = String(formData.get("seoDescription") || "").trim()

  if (!postId) {
    return
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      title: true,
      excerpt: true,
      content: true,
      isPublished: true,
      isFeatured: true,
      isTrending: true,
    },
  })

  if (!existingPost) {
    return
  }

  const { seoTitle, seoDescription } = resolvePostSeoInput({
    title: existingPost.title,
    excerpt: existingPost.excerpt,
    content: getPlainTextFromHtml(existingPost.content),
    seoTitle: rawSeoTitle,
    seoDescription: rawSeoDescription,
  })

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      isFeatured,
      ...(isFeatured ? {} : { featuredPosition: null }),
      isTrending,
      isPublished,
      seoTitle,
      seoDescription,
    },
    include: { category: true },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "UPDATED",
  })

  await revalidatePost(updatedPost.slug, updatedPost.category?.slug, {
    isVisibilityChange: existingPost.isPublished !== updatedPost.isPublished,
    isTrendingChange: existingPost.isTrending !== updatedPost.isTrending,
    isFeaturedChange: existingPost.isFeatured !== updatedPost.isFeatured,
    warmPublicRoutes: updatedPost.isPublished,
  })
  if (!existingPost.isPublished && updatedPost.isPublished && updatedPost.category?.slug) {
    await enqueuePublishedPostSearchConsoleJobs({
      postId,
      categorySlug: updatedPost.category.slug,
      slug: updatedPost.slug,
    })
    scheduleSearchConsoleDrain()
  }
  clearDataCache()
}

export async function movePostToTrash(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return { toast: "post_action_failed" }
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      slug: true,
      isPublished: true,
      editorialStatus: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
  })

  if (!existingPost) {
    return { toast: "post_not_found" }
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    return { toast: "post_action_forbidden" }
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isPublished: false,
      isFeatured: false,
      featuredPosition: null,
      isTrending: false,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "TRASHED",
    fromStatus: existingPost.editorialStatus,
  })

  // moveToTrash: post becomes non-public, so refresh public caches and sitemaps.
  await revalidatePost(existingPost.slug, existingPost.category?.slug, { isVisibilityChange: true })
  if (existingPost.isPublished && existingPost.category?.slug) {
    await enqueueRemovedPostSearchConsoleJobs()
    scheduleSearchConsoleDrain()
  }
  clearDataCache()
  return { toast: "post_moved_trash" }
}

export async function restorePostFromTrash(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return { toast: "post_action_failed" }
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      editorialStatus: true,
      slug: true,
      category: { select: { slug: true } },
    },
  })

  if (!existingPost) {
    return { toast: "post_not_found" }
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    return { toast: "post_action_forbidden" }
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "RESTORED",
    toStatus: existingPost.editorialStatus,
  })

  // Restored from trash but still has its old editorialStatus (likely DRAFT)
  // Use tag-only; if admin later publishes, that action will do full revalidation
  revalidatePostTagsOnly(existingPost.slug, existingPost.category?.slug)
  clearDataCache()
  return { toast: "post_restored" }
}

export async function deletePostPermanently(formData: FormData) {
  const currentUser = await requireCmsUser()

  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return { toast: "post_action_failed" }
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      editorialStatus: true,
      isPublished: true,
      slug: true,
      category: { select: { slug: true } },
    },
  })

  if (!existingPost) {
    return { toast: "post_not_found" }
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    return { toast: "post_action_forbidden" }
  }

  await prisma.post.delete({ where: { id: postId } })

  await revalidatePost(existingPost.slug, existingPost.category?.slug, { isVisibilityChange: true })
  if (existingPost.isPublished && existingPost.category?.slug) {
    await enqueueRemovedPostSearchConsoleJobs()
    scheduleSearchConsoleDrain()
  }
  clearDataCache()
  return { toast: "post_deleted_permanently" }
}
export async function bulkUpdateStatus(formData: FormData) {
  const currentUser = await requireCmsUser()
  const postIdsRaw = String(formData.get("postIds") || "")
  const status = String(formData.get("status") || "") as "DRAFT" | "PENDING_REVIEW" | "PENDING_PUBLISH" | "PUBLISHED" | "REJECTED"
  const postIds = postIdsRaw.split(",").filter(Boolean)
  if (postIds.length === 0 || !status) return

  // Basic permission check (could be refined per post)
  if (!canPublishNow(currentUser.role) && status === "PUBLISHED") return

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, isPublished: true, slug: true, category: { select: { slug: true } } },
  })

  await prisma.post.updateMany({
    where: { id: { in: postIds } },
    data: { editorialStatus: status, isPublished: status === "PUBLISHED", isDraft: status === "DRAFT" }
  })

  for (const post of posts) {
    await revalidatePost(post.slug, post.category?.slug, { isVisibilityChange: true })
    if (status === "PUBLISHED" && !post.isPublished && post.category?.slug) {
      await enqueuePublishedPostSearchConsoleJobs({
        postId: post.id,
        categorySlug: post.category.slug,
        slug: post.slug,
      })
    }
  }
  if (status === "PUBLISHED") {
    scheduleSearchConsoleDrain()
  }
  clearDataCache()
}

export async function bulkTrashPosts(formData: FormData) {
  const currentUser = await requireCmsUser()
  const postIdsRaw = String(formData.get("postIds") || "")
  const postIds = postIdsRaw.split(",").filter(Boolean)

  if (postIds.length === 0) return

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: {
      id: true,
      authorId: true,
      editorialStatus: true,
      isPublished: true,
      slug: true,
      category: { select: { slug: true } },
    },
  })

  const allowedPosts = posts.filter((post) =>
    canTrashOrDeletePost(currentUser.role, post.authorId, currentUser.id, post.editorialStatus)
  )

  if (allowedPosts.length === 0) return

  const allowedIds = allowedPosts.map((p) => p.id)

  await prisma.post.updateMany({
    where: { id: { in: allowedIds } },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isPublished: false,
      isFeatured: false,
      featuredPosition: null,
      isTrending: false,
    },
  })

  for (const post of allowedPosts) {
    // Trashed posts become non-public — full revalidate to update homepage/category
    await revalidatePost(post.slug, post.category?.slug, { isVisibilityChange: true })
  }
  if (allowedPosts.some((post) => post.isPublished && post.category?.slug)) {
    await enqueueRemovedPostSearchConsoleJobs()
    scheduleSearchConsoleDrain()
  }
  clearDataCache()
}

export async function restorePostVersion(formData: FormData) {
  const currentUser = await requireCmsUser()
  const logId = String(formData.get("logId") || "")
  if (!logId) return { error: "missing_log_id" }

  const historyLog = await prisma.postHistory.findUnique({
    where: { id: logId },
  })

  if (!historyLog || !historyLog.snapshotContent) {
    return { error: "log_or_content_not_found" }
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: historyLog.postId },
    include: { category: { select: { slug: true } } },
  })

  if (!existingPost) {
    return { error: "post_not_found" }
  }

  if (!canTrashOrDeletePost(currentUser.role, existingPost.authorId, currentUser.id, existingPost.editorialStatus)) {
    return { error: "action_forbidden" }
  }

  await prisma.post.update({
    where: { id: historyLog.postId },
    data: {
      title: historyLog.snapshotTitle || existingPost.title,
      excerpt: historyLog.snapshotExcerpt || existingPost.excerpt,
      content: historyLog.snapshotContent,
    },
  })

  await logPostHistory({
    postId: historyLog.postId,
    actorId: currentUser.id,
    actionType: "RESTORED",
    toStatus: existingPost.editorialStatus,
    snapshotTitle: historyLog.snapshotTitle,
    snapshotExcerpt: historyLog.snapshotExcerpt,
    snapshotContent: historyLog.snapshotContent,
  })

  await revalidatePost(existingPost.slug, existingPost.category?.slug, {
    isVisibilityChange: existingPost.isPublished,
  })
  clearDataCache()

  redirect("/admin?tab=history&toast=post_restored")
}

export async function checkPostIndex(formData: FormData) {
  const currentUser = await requireCmsUser()
  const postId = String(formData.get("postId") || "")
  if (!postId) {
    return { toast: "post_action_failed" }
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      isPublished: true,
      isDeleted: true,
      slug: true,
      category: { select: { slug: true } },
    },
  })

  if (!post || post.isDeleted) {
    return { toast: "post_not_found" }
  }

  if (!canViewAllPosts(currentUser.role) && post.authorId !== currentUser.id) {
    return { toast: "post_action_forbidden" }
  }

  if (!post.isPublished || !post.category?.slug) {
    return { toast: "search_console_check_unavailable" }
  }

  await enqueuePublishedPostInspection(
    post.id,
    buildPublicPostUrl({ categorySlug: post.category.slug, slug: post.slug }),
    { force: true }
  )
  scheduleSearchConsoleDrain()

  return { toast: "search_console_check_queued" }
}

export async function assignFeaturedSlot(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "pin-post"),
    "/admin?tab=posts&toast=post_action_forbidden"
  )

  const postId = String(formData.get("postId") || "")
  const featuredPosition = Number.parseInt(
    String(formData.get("featuredPosition") || ""),
    10
  )

  if (
    !postId ||
    !Number.isInteger(featuredPosition) ||
    featuredPosition < 1 ||
    featuredPosition > FEATURED_SLOT_COUNT
  ) {
    return { toast: "post_action_failed" }
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      isPublished: true,
      isDeleted: true,
      slug: true,
      featuredPosition: true,
      category: { select: { slug: true } },
    },
  })

  if (!existingPost || existingPost.isDeleted) {
    return { toast: "post_not_found" }
  }

  if (!existingPost.isPublished) {
    return { toast: "post_not_published" }
  }

  const replacedPost = await prisma.post.findFirst({
    where: {
      featuredPosition,
      id: { not: postId },
    },
    select: {
      id: true,
      slug: true,
      category: { select: { slug: true } },
    },
  })

  const [, updated] = await prisma.$transaction([
    prisma.post.updateMany({
      where: {
        featuredPosition,
        id: { not: postId },
      },
      data: {
        isFeatured: false,
        featuredPosition: null,
      },
    }),
    prisma.post.update({
      where: { id: postId },
      data: {
        isFeatured: true,
        featuredPosition,
      },
      include: { category: true },
    }),
  ])

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "UPDATED",
    snapshotTitle: `Assigned featured slot ${featuredPosition}`,
  })

  if (replacedPost) {
    await logPostHistory({
      postId: replacedPost.id,
      actorId: currentUser.id,
      actionType: "UPDATED",
      snapshotTitle: `Removed featured slot ${featuredPosition} by replacement`,
    })
  }

  await Promise.all([
    revalidatePost(updated.slug, updated.category?.slug, {
      isFeaturedChange: true,
    }),
    replacedPost
      ? revalidatePost(replacedPost.slug, replacedPost.category?.slug, {
          isFeaturedChange: true,
        })
      : Promise.resolve(),
  ])
  clearDataCache()

  return { toast: replacedPost ? "post_featured_replaced" : "post_featured_added" }
}

export async function clearFeaturedSlot(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(
    can(currentUser.role, "pin-post"),
    "/admin?tab=posts&toast=post_action_forbidden"
  )

  const postId = String(formData.get("postId") || "")

  if (!postId) {
    return { toast: "post_action_failed" }
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      slug: true,
      isDeleted: true,
      category: { select: { slug: true } },
    },
  })

  if (!existingPost || existingPost.isDeleted) {
    return { toast: "post_not_found" }
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isFeatured: false,
      featuredPosition: null,
    },
  })

  await logPostHistory({
    postId,
    actorId: currentUser.id,
    actionType: "UPDATED",
    snapshotTitle: "Cleared featured slot",
  })

  await revalidatePost(existingPost.slug, existingPost.category?.slug, {
    isFeaturedChange: true,
  })
  clearDataCache()

  return { toast: "post_featured_removed" }
}
