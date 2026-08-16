"use client"
import dynamic from "next/dynamic"
import { useRef, useState, useTransition, useCallback } from "react"
import { Eye, Globe, Save, Send, SendToBack } from "lucide-react"

const RichTextField = dynamic(
  () =>
    import("@/components/admin/rich-text-field/index").then((m) => m.RichTextField),
  { ssr: false }
)

import { createPostForPreview } from "@/app/admin/actions"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelector } from "@/components/admin/category-selector"
import { SeoFields } from "@/components/admin/seo-fields"
import { SeoKeywordPicker } from "@/components/admin/seo-keyword-picker"
import { EditFormDirtyTracker } from "@/components/admin/edit-form-dirty-tracker"
import { ThumbnailPicker } from "@/components/admin/thumbnail-picker"
import { PenNameSelect } from "@/components/admin/pen-name-select"

type CategoryWriteRow = {
  id: string
  name: string
  parentId?: string | null
}

type WriteTabProps = {
  canPublishNow: boolean
  canSubmitPendingPublish: boolean
  categoriesForWrite: CategoryWriteRow[]
  seoKeywordOptions: Array<{
    id: string
    keyword: string
  }>
  penNameOptions: Array<{
    id: string
    name: string
    avatarUrl: string | null
  }>
  mediaAssets: Array<{
    id: string
    assetType: "IMAGE" | "VIDEO"
    visibility: "PRIVATE" | "SHARED"
    url: string
    displayName: string | null
    filename: string
    uploader?: {
      id: string
      name: string
      email?: string
    }
  }>
  currentUserId: string
  createPost: (formData: FormData) => Promise<void>
}

export function WriteTab({
  canPublishNow,
  canSubmitPendingPublish,
  categoriesForWrite,
  seoKeywordOptions,
  penNameOptions,
  mediaAssets,
  currentUserId,
  createPost,
}: WriteTabProps) {
  const [hasVideo, setHasVideo] = useState(false)
  const [isSensitive, setIsSensitive] = useState(false)
  const [isSponsored, setIsSponsored] = useState(false)
  const [isPreviewing, startPreviewTransition] = useTransition()
  const [previewPostId, setPreviewPostId] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  const handlePreview = useCallback(() => {
    if (!formRef.current) return
    if (!formRef.current.reportValidity()) return
    const penNameInput = document.getElementById("postPenNameId") as HTMLInputElement | null
    if (!penNameInput?.value) {
      alert("Vui lòng chọn Bút danh trước khi Xem trước!")
      return
    }

    const formData = new FormData(formRef.current)
    startPreviewTransition(async () => {
      const result = await createPostForPreview(formData)
      if ("postId" in result) {
        setPreviewPostId(result.postId)
        window.open(`/admin/preview/${result.postId}`, "_blank")
      }
    })
  }, [])

  return (
    <form ref={formRef} action={createPost} className="space-y-4">
      {previewPostId && (
        <input type="hidden" name="previewPostId" value={previewPostId} />
      )}
      <EditFormDirtyTracker />

      {/* ── Sticky Top Action Bar ── */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 py-3 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-zinc-950">Viết bài mới</h2>
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-700">
            Bản nháp
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PendingSubmitButton
            type="submit"
            name="submitAction"
            value="save-draft"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
            pendingText="Đang lưu..."
          >
            <Save className="size-3.5 mr-1 text-zinc-600" />
            Lưu nháp
          </PendingSubmitButton>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium text-zinc-700"
            onClick={handlePreview}
            disabled={isPreviewing}
          >
            <Eye className="size-3.5 mr-1 text-zinc-600" />
            {isPreviewing ? "Đang lưu..." : "Xem trước"}
          </Button>

          {canSubmitPendingPublish ? (
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

          {canPublishNow ? (
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

      {/* ── Main Layout: Content Editor + Inspector Panel ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] items-start">
        {/* Main Editor Column: Single Unified Document Canvas */}
        <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-200 overflow-hidden">
          <div className="p-4 md:p-5 space-y-3.5 bg-white">
            <div className="space-y-1.5">
              <Label htmlFor="postTitle" className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postTitle"
                name="title"
                placeholder="Nhập tiêu đề bài viết..."
                required
                className="text-base font-semibold border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postPenNameId" className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Bút danh <span className="text-red-500">*</span>
              </Label>
              <PenNameSelect options={penNameOptions} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postExcerpt" className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Trích dẫn tóm tắt (Sapo)
              </Label>
              <Textarea
                id="postExcerpt"
                name="excerpt"
                className="min-h-20 text-sm border-zinc-200"
                placeholder="Mô tả ngắn hiển thị ở trang chủ và kết quả tìm kiếm..."
              />
            </div>
          </div>

          <div className="bg-white">
            <RichTextField
              name="content"
              placeholder="Viết nội dung bài báo tại đây..."
              mediaAssets={mediaAssets}
              currentUserId={currentUserId}
              className="border-0 rounded-none"
            />
          </div>
        </div>

        {/* Sidebar Inspector Column */}
        <div className="space-y-4">
          <div className="sticky top-16 space-y-4">
            <div className="rounded-md border border-zinc-200 bg-white divide-y divide-zinc-200">
              {/* Category & Tags Section */}
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Phân loại chuyên mục
                </h3>
                <CategorySelector categories={categoriesForWrite} />

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isSensitive"
                      checked={isSensitive}
                      onCheckedChange={(checked) => setIsSensitive(checked === true)}
                    />
                    <Label htmlFor="isSensitive" className="text-xs text-zinc-700">Nội dung nhạy cảm</Label>
                  </div>
                  {isSensitive ? (
                    <input type="hidden" name="isSensitive" value="on" />
                  ) : null}

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isSponsored"
                      checked={isSponsored}
                      onCheckedChange={(checked) => setIsSponsored(checked === true)}
                    />
                    <Label htmlFor="isSponsored" className="text-xs text-zinc-700">Nội dung được tài trợ (Quảng cáo)</Label>
                  </div>
                  {isSponsored ? (
                    <input type="hidden" name="isSponsored" value="on" />
                  ) : null}
                </div>
              </div>

              {/* Multimedia Section */}
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Đa phương tiện
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="thumbnailUrl" className="text-xs text-zinc-600">Ảnh đại diện (Thumbnail / OG)</Label>
                  <ThumbnailPicker
                    mediaAssets={mediaAssets}
                    currentUserId={currentUserId}
                  />
                </div>

                <div className="pt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hasVideo"
                      checked={hasVideo}
                      onCheckedChange={(checked) => setHasVideo(checked === true)}
                    />
                    <Label htmlFor="hasVideo" className="text-xs text-zinc-700">Bài viết chứa video</Label>
                  </div>
                  {hasVideo ? <input type="hidden" name="hasVideo" value="on" /> : null}

                  {hasVideo ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="videoEmbed" className="text-xs text-zinc-600">Video embed URL</Label>
                      <Input
                        id="videoEmbed"
                        name="videoEmbedUrl"
                        placeholder="https://www.youtube.com/embed/..."
                        className="text-xs"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* SEO Section */}
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Cấu hình SEO
                </h3>
                <SeoFields>
                  <SeoKeywordPicker options={seoKeywordOptions} />
                </SeoFields>
              </div>

              {/* Publish Scheduling (if permission granted) */}
              {canPublishNow ? (
                <div className="p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Lịch xuất bản
                  </h3>
                  <Input
                    id="scheduledPublishAt"
                    name="scheduledPublishAt"
                    type="datetime-local"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Bỏ trống để xuất bản ngay khi duyệt/đăng.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

