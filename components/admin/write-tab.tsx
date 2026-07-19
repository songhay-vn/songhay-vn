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
    <div className="space-y-4">
      <p className="text-sm font-semibold">Viết bài mới</p>
      <form
        ref={formRef}
        action={createPost}
        className="grid gap-6 lg:grid-cols-[3fr_2fr]"
      >
        {previewPostId && (
          <input type="hidden" name="previewPostId" value={previewPostId} />
        )}
        <EditFormDirtyTracker />

        {/* Main 60% Column */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="postTitle">Tên bài viết</Label>
              <Input
                id="postTitle"
                name="title"
                placeholder="Nhập tiêu đề"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postPenNameId">Bút danh</Label>
              <PenNameSelect options={penNameOptions} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postExcerpt">Trích dẫn</Label>
              <Textarea
                id="postExcerpt"
                name="excerpt"
                className="min-h-20"
                placeholder="Mô tả ngắn bài viết"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nội dung</Label>
            <RichTextField
              name="content"
              placeholder="Viết nội dung bài báo tại đây..."
              mediaAssets={mediaAssets}
              currentUserId={currentUserId}
            />
          </div>

          <fieldset className="space-y-3 rounded-lg border bg-white p-4">
            <legend className="px-1 text-sm font-semibold">
              Thao tác xuất bản
            </legend>
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <PendingSubmitButton
                  type="submit"
                  name="submitAction"
                  value="save-draft"
                  variant="outline"
                  size="lg"
                  pendingText="Đang lưu..."
                >
                  <Save className="size-4 mr-1.5" />
                  Lưu nháp
                </PendingSubmitButton>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handlePreview}
                  disabled={isPreviewing}
                >
                  <Eye className="size-4 mr-1.5" />
                  {isPreviewing ? "Đang lưu..." : "Xem trước"}
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <PendingSubmitButton
                  type="submit"
                  name="submitAction"
                  value="submit-review"
                  className="w-full"
                  variant="destructive"
                  size="lg"
                  pendingText="Đang gửi duyệt..."
                >
                  <Send className="size-4 mr-1.5" />
                  Gửi chờ duyệt
                </PendingSubmitButton>

                {canSubmitPendingPublish ? (
                  <PendingSubmitButton
                    type="submit"
                    name="submitAction"
                    value="submit-publish"
                    className="w-full"
                    variant="secondary"
                    size="lg"
                    pendingText="Đang chuyển kho..."
                  >
                    <SendToBack className="size-4 mr-1.5" />
                    Gửi chờ xuất bản
                  </PendingSubmitButton>
                ) : null}

                {canPublishNow ? (
                  <PendingSubmitButton
                    type="submit"
                    name="submitAction"
                    value="publish"
                    className="w-full"
                    size="lg"
                    pendingText="Đang xuất bản..."
                  >
                    <Globe className="size-4 mr-1.5" />
                    Xuất bản
                  </PendingSubmitButton>
                ) : null}
              </div>
            </div>
          </fieldset>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <fieldset className="space-y-3 rounded-lg border bg-white p-4">
              <legend className="px-1 text-sm font-semibold">Phân loại & Cấu hình</legend>
              <CategorySelector categories={categoriesForWrite} />

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="isSensitive"
                  checked={isSensitive}
                  onCheckedChange={(checked) => setIsSensitive(checked === true)}
                />
                <Label htmlFor="isSensitive">Nội dung nhạy cảm</Label>
              </div>
              {isSensitive ? (
                <input type="hidden" name="isSensitive" value="on" />
              ) : null}

              <div className="flex items-center gap-2 pt-2 border-t mt-2">
                <Checkbox
                  id="isSponsored"
                  checked={isSponsored}
                  onCheckedChange={(checked) => setIsSponsored(checked === true)}
                />
                <Label htmlFor="isSponsored">Nội dung được tài trợ (Quảng cáo)</Label>
              </div>
              {isSponsored ? (
                <input type="hidden" name="isSponsored" value="on" />
              ) : null}
            </fieldset>

            <fieldset className="space-y-3 rounded-lg border bg-white p-4">
              <legend className="px-1 text-sm font-semibold">Đa phương tiện</legend>
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Ảnh đại diện</Label>
                <ThumbnailPicker
                  mediaAssets={mediaAssets}
                  currentUserId={currentUserId}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Hệ thống tự động dùng ảnh này làm OG image khi share.
              </p>

              <div className="mt-4 border-t pt-4 flex items-center gap-2">
                <Checkbox
                  id="hasVideo"
                  checked={hasVideo}
                  onCheckedChange={(checked) => setHasVideo(checked === true)}
                />
                <Label htmlFor="hasVideo">Bài báo này có chứa video</Label>
              </div>
              {hasVideo ? <input type="hidden" name="hasVideo" value="on" /> : null}

              {hasVideo ? (
                <div className="space-y-1.5">
                  <Label htmlFor="videoEmbed">Video embed URL</Label>
                  <Input
                    id="videoEmbed"
                    name="videoEmbedUrl"
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
              ) : null}
            </fieldset>

            <div className="bg-white">
              <SeoFields>
                <SeoKeywordPicker options={seoKeywordOptions} />
              </SeoFields>
            </div>

            {canPublishNow ? (
              <fieldset className="space-y-3 rounded-lg border bg-white p-4">
                <legend className="px-1 text-sm font-semibold">Lịch xuất bản</legend>
                <div className="space-y-2">
                  <Label htmlFor="scheduledPublishAt">Hẹn giờ xuất bản</Label>
                  <Input
                    id="scheduledPublishAt"
                    name="scheduledPublishAt"
                    type="datetime-local"
                  />
                  <p className="text-xs text-muted-foreground">
                    Bỏ trống nếu muốn xuất bản ngay khi bấm nút.
                  </p>
                </div>
              </fieldset>
            ) : null}

          </div>
        </div>
      </form>
    </div>
  )
}

