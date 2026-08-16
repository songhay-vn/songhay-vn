 

import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ArrowLeft, Globe, Save, Send, SendToBack } from "lucide-react"

import { RichTextField } from "@/components/admin/rich-text-field/index"
import { SeoFields } from "@/components/admin/seo-fields"
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CategorySelector } from "@/components/admin/category-selector"
import { SeoKeywordPicker } from "@/components/admin/seo-keyword-picker"
import { uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import { requireCmsUser } from "@/lib/auth"
import {
  canEditByStatus,
  canPublishNow,
  canSubmitPendingPublish,
  canViewAllPosts,
} from "@/lib/permissions"
import { resolvePostSeoInput } from "@/lib/post-seo"
import { EditFormDirtyTracker } from "@/components/admin/edit-form-dirty-tracker"
import { ThumbnailPicker } from "@/components/admin/thumbnail-picker"
import { PenNameSelect } from "@/components/admin/pen-name-select"
import { PreviewButton } from "@/components/admin/preview-button"
import { prisma } from "@/lib/prisma"
import {
  resolveSeoKeywordSelection,
  syncPostSeoKeywords,
} from "@/lib/seo-keyword-store"
import { normalizeKeyword, splitLegacySeoKeywords } from "@/lib/seo-keywords"
import {
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  revalidatePost,
  revalidatePostTagsOnly,
  uniquePostSlug,
} from "@/app/admin/actions-helpers"
import { sortCategoriesByTree } from "@/app/admin/data-helpers"



export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết",
  robots: {
    index: false,
    follow: false,
  },
}

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const currentUser = await requireCmsUser()
  const canPublish = canPublishNow(currentUser.role)

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      seoKeywordLinks: {
        select: {
          seoKeywordId: true,
        },
      },
    },
  })

  if (!post) {
    // Post not found
    redirect("/admin?tab=posts")
  }

  const canSeeAllPosts = canViewAllPosts(currentUser.role)
  if (!canSeeAllPosts && post.authorId !== currentUser.id) {
    redirect("/admin?tab=personal-archive")
  }

  if (!canEditByStatus(currentUser.role, post.editorialStatus)) {
    redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
  }

  const [rawCategories, penNameOptions] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.penName.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, avatarUrl: true },
    }),
  ])
  const categories = sortCategoriesByTree(rawCategories)

  const mediaAssets = await prisma.mediaAsset.findMany({
    select: {
      id: true,
      assetType: true,
      visibility: true,
      url: true,
      displayName: true,
      filename: true,
      uploader: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ uploadedAt: "desc" }],
    take: 200,
  })

  const seoKeywordOptions = await prisma.seoKeyword.findMany({
    orderBy: { keyword: "asc" },
    take: 200,
    select: {
      id: true,
      keyword: true,
    },
  })
  const selectedSeoKeywordIds = new Set(
    post.seoKeywordLinks.map((item) => item.seoKeywordId)
  )
  const selectedSeoKeywordNormalized = new Set(
    seoKeywordOptions
      .filter((item) => selectedSeoKeywordIds.has(item.id))
      .map((item) => normalizeKeyword(item.keyword))
  )
  const initialCustomSeoKeywords = splitLegacySeoKeywords(
    post.seoKeywords
  ).filter((item) => !selectedSeoKeywordNormalized.has(normalizeKeyword(item)))

  async function updatePost(formData: FormData) {
    "use server"

    const postId = formData.get("postId") as string
    if (!postId) return

    const title = String(formData.get("title") || "").trim()
    const penNameId = String(formData.get("penNameId") || "").trim()
    const excerpt = String(formData.get("excerpt") || "").trim()
    const content = String(formData.get("content") || "").trim()
    const plainContent = getPlainTextFromHtml(content)
    const mainCategoryId = String(formData.get("mainCategoryId") || "").trim()
    const subcategoryId = String(formData.get("subcategoryId") || "").trim()
    const categoryId = subcategoryId || mainCategoryId
    const rawSeoTitle = String(formData.get("seoTitle") || "").trim()
    const rawSeoDescription = String(
      formData.get("seoDescription") || ""
    ).trim()
    const manualOgImage = String(formData.get("ogImage") || "").trim() || null
    const videoEmbedUrl = String(formData.get("videoEmbedUrl") || "").trim() || null
    const canonicalUrl = String(formData.get("canonicalUrl") || "").trim() || null
    const rawScheduledPublishAt = String(formData.get("scheduledPublishAt") || "").trim()
    const scheduledPublishAt = rawScheduledPublishAt ? new Date(rawScheduledPublishAt) : null
    const isSensitive = formData.get("isSensitive") === "on"
    const isSponsored = formData.get("isSponsored") === "on"
    const submitAction = String(formData.get("submitAction") || "").trim()
    const lastUpdatedAt = String(formData.get("lastUpdatedAt") || "").trim()

    const thumbnailUpload = formData.get("thumbnailUpload")
    const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

    const currentPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { category: true },
    })

    if (!currentPost) {
      return
    }

    if (new Date(currentPost.updatedAt).toISOString() !== lastUpdatedAt) {
      redirect(`/admin/edit/${postId}?toast=post_concurrent_modification`)
    }

    const canSeeAllPostsAction = canViewAllPosts(currentUser.role)
    if (!canSeeAllPostsAction && currentPost.authorId !== currentUser.id) {
      redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
    }

    if (!canEditByStatus(currentUser.role, currentPost.editorialStatus)) {
      redirect("/admin?tab=personal-archive&toast=post_action_forbidden")
    }

    const selectedPenName = penNameId
      ? await prisma.penName.findUnique({
          where: { id: penNameId },
          select: { id: true, name: true },
        })
      : null
    const penName = selectedPenName?.name || ""

    if (!title || !selectedPenName) {
      redirect(`/admin/edit/${postId}?toast=missing_fields`)
    }

    const isDraftTarget =
      submitAction === "save-draft" ||
      (submitAction === "save-changes" && currentPost.editorialStatus === "DRAFT")

    if (!isDraftTarget && (!excerpt || !plainContent || !categoryId)) {
      redirect(`/admin/edit/${postId}?toast=missing_fields`)
    }

    const { seoTitle, seoDescription } = resolvePostSeoInput({
      title,
      excerpt,
      content: plainContent,
      seoTitle: rawSeoTitle,
      seoDescription: rawSeoDescription,
    })

    const slug = await uniquePostSlug(title, postId)

    let thumbnailUrl = thumbnailUrlInput || null
    if (thumbnailUpload instanceof File && thumbnailUpload.size > 0) {
      const uploaded = await uploadThumbnail(thumbnailUpload)
      if (uploaded) {
        thumbnailUrl = uploaded
      }
    } else if (!thumbnailUrlInput && post?.thumbnailUrl) {
      // Keep existing
      thumbnailUrl = post.thumbnailUrl
    }

    const ogImage = thumbnailUrl || manualOgImage

    const isSaveChanges = submitAction === "save-changes"
    let editorialStatus = currentPost.editorialStatus
    let isPublished = currentPost.isPublished
    let isDraft = currentPost.isDraft

    if (!isSaveChanges) {
      const resolved = resolveEditorialFromSubmitAction({
        submitAction,
        role: currentUser.role,
      })
      editorialStatus = resolved.editorialStatus
      isPublished = resolved.isPublished
      isDraft = resolved.isDraft
    }

    const { keywordIds, seoKeywordsText } =
      await resolveSeoKeywordSelection(formData)

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        slug,
        penName,
        penNameId: penNameId || null,
        excerpt,
        content,
        categoryId,
        authorId: currentPost.authorId || currentUser.id,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywordsText,
        ogImage,
        videoEmbedUrl,
        canonicalUrl,
        scheduledPublishAt,
        isSensitive,
        isSponsored,
        isFeatured: currentPost.isFeatured,
        isTrending: currentPost.isTrending,
        isPublished,
        isDraft,
        editorialStatus,
        lastEditorId: currentUser.id,
        approverId: isSaveChanges ? currentPost.approverId : (isPublished ? currentUser.id : null),
        approvedAt: isSaveChanges ? currentPost.approvedAt : (isPublished ? new Date() : null),
        publishedAt: isSaveChanges ? currentPost.publishedAt : (isPublished ? new Date() : currentPost.publishedAt),
        thumbnailUrl,
        updatedAt: new Date(),
      },
      include: { category: true },
    })

    await syncPostSeoKeywords(postId, keywordIds)



    // Heavy revalidation (ISR writes) only if the post IS or IS BECOMING public
    if (isPublished || currentPost.isPublished) {
      const isVisibilityChange = isPublished !== currentPost.isPublished || currentPost.editorialStatus !== editorialStatus || isDraft !== currentPost.isDraft;
      const isTrendingChange = currentPost.isTrending !== undefined ? currentPost.isTrending !== updatedPost.isTrending : false
      
      await revalidatePost(updatedPost.slug, updatedPost.category?.slug, {
        isVisibilityChange: isVisibilityChange,
        isTrendingChange: isTrendingChange,
        isFeaturedChange: updatedPost.isFeatured !== currentPost.isFeatured,
        isVideoChange: updatedPost.videoEmbedUrl !== currentPost.videoEmbedUrl,
        warmPublicRoutes: isPublished,
      })
    } else {
      // Internal update for non-public post: just refresh tags
      revalidatePostTagsOnly(updatedPost.slug, updatedPost.category?.slug)
    }
    
    clearDataCache()
    if (isDraft) {
      redirect("/admin?tab=personal-archive&toast=post_saved_draft")
    }

    if (isPublished) {
      redirect("/admin?tab=posts&toast=post_updated_published")
    }

    if (editorialStatus === "PENDING_PUBLISH") {
      redirect(
        "/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish"
      )
    }

    redirect(
      "/admin?tab=posts&postsStatus=pending-review&toast=post_updated_review"
    )
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <form action={updatePost} className="space-y-4">
        <EditFormDirtyTracker postId={post.id} />
        <input type="hidden" name="postId" value={post.id} />
        <input type="hidden" name="lastUpdatedAt" value={new Date(post.updatedAt).toISOString()} />

        {/* ── Sticky Top Action Bar ── */}
        <div className="sticky top-0 z-20 px-4 md:px-6 xl:px-8 py-3 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin?tab=posts">
              <Button variant="outline" size="sm" className="h-8 text-xs font-medium gap-1.5">
                <ArrowLeft className="size-3.5" />
                Kho bài
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-950 truncate max-w-[280px] sm:max-w-md">
                {post.title || "Chỉnh sửa bài viết"}
              </h1>
              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-700">
                {post.editorialStatus}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PendingSubmitButton
              type="submit"
              name="submitAction"
              value="save-changes"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              pendingText="Đang lưu..."
            >
              <Save className="size-3.5 mr-1 text-zinc-600" />
              {post.editorialStatus === "DRAFT" ? "Lưu nháp" : "Lưu thay đổi"}
            </PendingSubmitButton>

            <PreviewButton postId={post.id} />

            {post.editorialStatus !== "DRAFT" && (post.editorialStatus !== "PUBLISHED" || canPublish) ? (
              <ConfirmSubmitButton
                type="submit"
                name="submitAction"
                value="save-draft"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium text-amber-700 hover:bg-amber-50"
                confirmMessage="Chuyển bài viết này về nháp? Bài sẽ không còn nằm trong hàng duyệt/xuất bản hiện tại."
                confirmText="Chuyển về nháp"
                pendingText="Đang chuyển về nháp..."
              >
                <Save className="size-3.5 mr-1" />
                Chuyển về nháp
              </ConfirmSubmitButton>
            ) : null}

            <PendingSubmitButton
              type="submit"
              name="submitAction"
              value="submit-review"
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-semibold"
              pendingText="Đang gửi duyệt..."
            >
              <Send className="size-3.5 mr-1" />
              Gửi chờ duyệt
            </PendingSubmitButton>

            {canSubmitPendingPublish(currentUser.role) ? (
              <PendingSubmitButton
                type="submit"
                name="submitAction"
                value="submit-publish"
                variant="secondary"
                size="sm"
                className="h-8 text-xs font-medium"
                pendingText="Đang chuyển kho..."
              >
                <SendToBack className="size-3.5 mr-1" />
                Gửi chờ xuất bản
              </PendingSubmitButton>
            ) : null}

            {canPublish ? (
              <PendingSubmitButton
                type="submit"
                name="submitAction"
                value="publish"
                size="sm"
                className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                pendingText="Đang xuất bản..."
              >
                <Globe className="size-3.5 mr-1" />
                Xuất bản
              </PendingSubmitButton>
            ) : null}
          </div>
        </div>

        {/* ── Main Layout: Editor & Inspector Panel ── */}
        <div className="p-4 md:p-6 xl:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] items-start">
            {/* Left Main Content: Single Unified Document Canvas */}
            <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-200 overflow-hidden">
              <div className="p-4 md:p-5 space-y-3.5 bg-white">
                <div className="space-y-1.5">
                  <Label htmlFor="postTitle" className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postTitle"
                    name="title"
                    defaultValue={post.title}
                    placeholder="Nhập tiêu đề..."
                    required
                    className="text-base font-semibold border-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="postPenNameId" className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Bút danh <span className="text-red-500">*</span>
                  </Label>
                  <PenNameSelect
                    options={penNameOptions}
                    defaultValue={post.penNameId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="postExcerpt" className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Trích dẫn tóm tắt (Sapo)
                  </Label>
                  <Textarea
                    id="postExcerpt"
                    name="excerpt"
                    defaultValue={post.excerpt}
                    className="min-h-20 text-sm border-zinc-200"
                    placeholder="Mô tả ngắn bài viết..."
                  />
                </div>
              </div>

              <div className="bg-white">
                <RichTextField
                  name="content"
                  defaultValue={post.content}
                  mediaAssets={mediaAssets}
                  currentUserId={currentUser.id}
                  className="border-0 rounded-none"
                />
              </div>
            </div>

            {/* Right Sidebar Inspector */}
            <div className="space-y-4">
              <div className="sticky top-20 space-y-4">
                <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-200">
                  {/* Category Section */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Phân loại chuyên mục
                    </h3>
                    <CategorySelector
                      categories={categories}
                      defaultCategoryId={post.categoryId}
                    />

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isSensitiveEdit"
                          name="isSensitive"
                          defaultChecked={post.isSensitive}
                          value="on"
                        />
                        <Label htmlFor="isSensitiveEdit" className="text-xs text-zinc-700">Nội dung nhạy cảm</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isSponsoredEdit"
                          name="isSponsored"
                          defaultChecked={post.isSponsored}
                          value="on"
                        />
                        <Label htmlFor="isSponsoredEdit" className="text-xs text-zinc-700">Nội dung được tài trợ (Quảng cáo)</Label>
                      </div>
                    </div>
                  </div>

                  {/* Media Section */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Đa phương tiện
                    </h3>
                    <div className="space-y-1.5">
                      <Label htmlFor="thumbnailUrl" className="text-xs text-zinc-600">Ảnh đại diện (Thumbnail / OG)</Label>
                      <ThumbnailPicker
                        defaultValue={post.thumbnailUrl || ""}
                        mediaAssets={mediaAssets}
                        currentUserId={currentUser.id}
                      />
                    </div>

                    <div className="pt-1 space-y-1.5">
                      <Label htmlFor="videoEmbed" className="text-xs text-zinc-600">Video embed URL</Label>
                      <Input
                        id="videoEmbed"
                        name="videoEmbedUrl"
                        defaultValue={post.videoEmbedUrl || ""}
                        placeholder="https://www.youtube.com/embed/..."
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Cấu hình SEO
                    </h3>
                    <SeoFields
                      defaultSeoTitle={post.seoTitle || ""}
                      defaultSeoDescription={post.seoDescription || ""}
                      defaultCanonicalUrl={post.canonicalUrl || ""}
                      initialTitle={post.title}
                      initialExcerpt={post.excerpt}
                      initialContent={post.content}
                    >
                      <SeoKeywordPicker
                        options={seoKeywordOptions}
                        initialSelectedIds={[...selectedSeoKeywordIds]}
                        initialCustomKeywords={initialCustomSeoKeywords}
                      />
                    </SeoFields>
                  </div>

                  {/* Scheduling Section */}
                  {canPublish ? (
                    <div className="p-4 space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Lịch xuất bản
                      </h3>
                      <Input
                        id="scheduledPublishAt"
                        name="scheduledPublishAt"
                        type="datetime-local"
                        className="text-xs"
                        defaultValue={
                          post.scheduledPublishAt
                            ? new Date(post.scheduledPublishAt.getTime() - post.scheduledPublishAt.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                            : ""
                        }
                      />
                      <p className="text-[11px] text-zinc-500">
                        Bỏ trống để xuất bản ngay khi bấm nút.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}
