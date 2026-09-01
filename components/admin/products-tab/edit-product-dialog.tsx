"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"

import type { ProductRow } from "@/app/admin/data-loaders"
import type { MediaAsset } from "@/components/admin/media-picker/types"
import { RichTextField } from "@/components/admin/rich-text-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { updateProduct } from "@/app/admin/actions/products"
import { uploadSingleFile } from "./upload-helper"

type EditProductDialogProps = {
  product: ProductRow | null
  onClose: () => void
  mediaAssets: MediaAsset[]
  currentUserId: string
}

export function EditProductDialog({
  product,
  onClose,
  mediaAssets,
  currentUserId,
}: EditProductDialogProps) {
  const [editType, setEditType] = useState<"SCIENCE_PRODUCT" | "VIET_GIFT">("SCIENCE_PRODUCT")
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreviewUrl, setEditPreviewUrl] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editImagePublicId, setEditImagePublicId] = useState("")
  const [editExistingGalleryUrls, setEditExistingGalleryUrls] = useState<string[]>([])
  const [editNewGalleryFiles, setEditNewGalleryFiles] = useState<File[]>([])
  const [editNewGalleryPreviews, setEditNewGalleryPreviews] = useState<string[]>([])
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editUploadError, setEditUploadError] = useState("")

  useEffect(() => {
    if (product) {
      setEditType((product.type as "SCIENCE_PRODUCT" | "VIET_GIFT") || "SCIENCE_PRODUCT")
      setEditFile(null)
      setEditPreviewUrl("")
      setEditImageUrl(product.imageUrl)
      setEditImagePublicId(product.imagePublicId || "")
      setEditExistingGalleryUrls(product.galleryUrls || [])
      setEditNewGalleryFiles([])
      setEditNewGalleryPreviews([])
      setEditUploadError("")
    }
  }, [product])

  if (!product) return null

  function handlePrimaryFileSelect(file: File) {
    setEditFile(file)
    setEditPreviewUrl(URL.createObjectURL(file))
    setEditUploadError("")
  }

  function handleGalleryFilesSelect(files: FileList) {
    const fileArray = Array.from(files)
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file))
    setEditNewGalleryFiles((prev) => [...prev, ...fileArray])
    setEditNewGalleryPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeExistingGalleryImage(index: number) {
    setEditExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function removeNewGalleryImage(index: number) {
    setEditNewGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setEditNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!product) return
    const form = e.currentTarget
    setIsSubmittingEdit(true)
    setEditUploadError("")

    try {
      let finalImageUrl = editImageUrl
      let finalImagePublicId = editImagePublicId

      // 1. Upload new primary image if replaced
      if (editFile) {
        const primaryResult = await uploadSingleFile(editFile)
        finalImageUrl = primaryResult.url
        finalImagePublicId = primaryResult.publicId
      }

      // 2. Upload new gallery images in parallel
      const newGalleryUploads = await Promise.all(
        editNewGalleryFiles.map((file) => uploadSingleFile(file))
      )
      const newGalleryUrls = newGalleryUploads.map((g) => g.url)

      // Combined gallery URLs: existing kept URLs + newly uploaded URLs
      const finalGalleryUrls = [...editExistingGalleryUrls, ...newGalleryUrls]

      const formData = new FormData(form)
      formData.set("imageUrl", finalImageUrl)
      formData.set("imagePublicId", finalImagePublicId)
      formData.set("galleryUrls", JSON.stringify(finalGalleryUrls))

      await updateProduct(formData)
    } catch (err: unknown) {
      console.error(err)
      setEditUploadError("Đã xảy ra lỗi khi tải ảnh lên hoặc cập nhật sản phẩm. Vui lòng thử lại.")
      setIsSubmittingEdit(false)
    }
  }

  return (
    <Dialog
      open={Boolean(product)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto overflow-x-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm / Quà Việt</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin, bộ sưu tập ảnh và thông tin liên hệ Zalo cho &quot;{product.name}&quot;.
          </DialogDescription>
        </DialogHeader>

        <form key={product.id} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <input
            type="hidden"
            name="productId"
            value={product.id}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-type" className="text-sm font-semibold">
                Phân loại danh mục <span className="text-rose-600">*</span>
              </Label>
              <select
                id="edit-type"
                name="type"
                value={editType}
                onChange={(e) => setEditType(e.target.value as "SCIENCE_PRODUCT" | "VIET_GIFT")}
                className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="SCIENCE_PRODUCT">Sản phẩm khoa học (Viện Hàn Lâm)</option>
                <option value="VIET_GIFT">Quà Việt (Bài PR / Giới thiệu NSX)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-sortOrder" className="text-sm font-semibold">
                Thứ tự hiển thị (tùy chọn)
              </Label>
              <Input
                id="edit-sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={product.sortOrder}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-sm font-semibold">
              Tên sản phẩm <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={product.name}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-zaloUrl" className="text-sm font-semibold">
              Link Zalo Nhà sản xuất (NSX) {editType === "VIET_GIFT" ? <span className="text-rose-600 font-normal text-xs">(Áp dụng cho Quà Việt)</span> : <span className="text-zinc-400 font-normal text-xs">(Tùy chọn)</span>}
            </Label>
            <Input
              id="edit-zaloUrl"
              name="zaloUrl"
              defaultValue={product.zaloUrl || ""}
              placeholder="Ví dụ: https://zalo.me/0912345678 hoặc http://zalo.me/1461723500320922510"
            />
          </div>

          {/* Primary Image */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Hình ảnh chính <span className="text-rose-600">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePrimaryFileSelect(file)
                }}
                disabled={isSubmittingEdit}
                className="flex-1"
              />
            </div>
            {editUploadError && (
              <p className="text-sm text-rose-600">{editUploadError}</p>
            )}
            {(editPreviewUrl || editImageUrl) && (
              <div className="mt-2 relative w-32 h-32 rounded border overflow-hidden bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editPreviewUrl || getOptimizedImageUrl(editImageUrl, { width: 300, crop: "limit" })}
                  alt="Primary Preview"
                  loading="lazy"
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Gallery Images */}
          <div className="space-y-1.5 border-t border-zinc-100 pt-3">
            <Label className="text-sm font-semibold">
              Bộ sưu tập ảnh bổ sung
            </Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleGalleryFilesSelect(e.target.files)
                }
              }}
              disabled={isSubmittingEdit}
            />
            {(editExistingGalleryUrls.length > 0 || editNewGalleryPreviews.length > 0) && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {/* Existing uploaded gallery URLs */}
                {editExistingGalleryUrls.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative aspect-square rounded border overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getOptimizedImageUrl(url, { width: 200, height: 200, crop: "fill" })}
                      alt={`Existing gallery ${idx + 1}`}
                      loading="lazy"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-sm opacity-90 hover:opacity-100 transition"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Newly selected gallery image files */}
                {editNewGalleryPreviews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded border overflow-hidden group border-emerald-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`New gallery preview ${idx + 1}`}
                      loading="lazy"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-sm opacity-90 hover:opacity-100 transition"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 border-t border-zinc-100 pt-3">
            <Label className="text-sm font-semibold">Mô tả sản phẩm</Label>
            <RichTextField
              name="description"
              placeholder="Nhập mô tả sản phẩm..."
              defaultValue={product.description || ""}
              mediaAssets={mediaAssets}
              currentUserId={currentUserId}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmittingEdit}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingEdit}
              className="bg-rose-600 hover:bg-rose-700 text-white min-w-[120px]"
            >
              {isSubmittingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
