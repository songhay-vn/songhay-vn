"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"

import type { MediaAsset } from "@/components/admin/media-picker/types"
import { RichTextField } from "@/components/admin/rich-text-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createProduct } from "@/app/admin/actions/products"
import { uploadSingleFile } from "./upload-helper"

type AddProductDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mediaAssets: MediaAsset[]
  currentUserId: string
}

export function AddProductDialog({
  isOpen,
  onOpenChange,
  mediaAssets,
  currentUserId,
}: AddProductDialogProps) {
  const [addType, setAddType] = useState<"SCIENCE_PRODUCT" | "VIET_GIFT">("SCIENCE_PRODUCT")
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addPreviewUrl, setAddPreviewUrl] = useState("")
  const [addGalleryFiles, setAddGalleryFiles] = useState<File[]>([])
  const [addGalleryPreviews, setAddGalleryPreviews] = useState<string[]>([])
  const [addUploadError, setAddUploadError] = useState("")
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  function resetForm() {
    setAddType("SCIENCE_PRODUCT")
    setAddFile(null)
    setAddPreviewUrl("")
    setAddGalleryFiles([])
    setAddGalleryPreviews([])
    setAddUploadError("")
    setIsSubmittingAdd(false)
  }

  function handlePrimaryFileSelect(file: File) {
    setAddFile(file)
    setAddPreviewUrl(URL.createObjectURL(file))
    setAddUploadError("")
  }

  function handleGalleryFilesSelect(files: FileList) {
    const fileArray = Array.from(files)
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file))
    setAddGalleryFiles((prev) => [...prev, ...fileArray])
    setAddGalleryPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeGalleryImage(index: number) {
    setAddGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setAddGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    if (!addFile) {
      setAddUploadError("Vui lòng chọn hình ảnh chính của sản phẩm.")
      return
    }
    setIsSubmittingAdd(true)
    setAddUploadError("")

    try {
      // 1. Upload primary image
      const primaryResult = await uploadSingleFile(addFile)

      // 2. Upload gallery images in parallel
      const galleryUploads = await Promise.all(
        addGalleryFiles.map((file) => uploadSingleFile(file))
      )
      const uploadedGalleryUrls = galleryUploads.map((g) => g.url)

      const formData = new FormData(form)
      formData.set("imageUrl", primaryResult.url)
      formData.set("imagePublicId", primaryResult.publicId)
      formData.set("galleryUrls", JSON.stringify(uploadedGalleryUrls))

      await createProduct(formData)
    } catch (err: unknown) {
      console.error(err)
      setAddUploadError("Đã xảy ra lỗi khi tải ảnh lên hoặc thêm sản phẩm. Vui lòng thử lại.")
      setIsSubmittingAdd(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Thêm bài mới
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto overflow-x-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm / Quà Việt mới</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết, bộ sưu tập ảnh và thông tin liên hệ Zalo NSX
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-sm font-semibold">
                Phân loại danh mục <span className="text-rose-600">*</span>
              </Label>
              <select
                id="type"
                name="type"
                value={addType}
                onChange={(e) => setAddType(e.target.value as "SCIENCE_PRODUCT" | "VIET_GIFT")}
                className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="SCIENCE_PRODUCT">Sản phẩm khoa học (Viện Hàn Lâm)</option>
                <option value="VIET_GIFT">Quà Việt (Bài PR / Giới thiệu NSX)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sortOrder" className="text-sm font-semibold">
                Thứ tự hiển thị (tùy chọn)
              </Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                placeholder="Để trống sẽ tự động xếp sau cùng..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold">
              Tên sản phẩm <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Nhập tên sản phẩm..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zaloUrl" className="text-sm font-semibold">
              Link Zalo Nhà sản xuất (NSX) {addType === "VIET_GIFT" ? <span className="text-rose-600 font-normal text-xs">(Áp dụng cho Quà Việt)</span> : <span className="text-zinc-400 font-normal text-xs">(Tùy chọn)</span>}
            </Label>
            <Input
              id="zaloUrl"
              name="zaloUrl"
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
                disabled={isSubmittingAdd}
                className="flex-1"
              />
            </div>
            {addUploadError && (
              <p className="text-sm text-rose-600">{addUploadError}</p>
            )}
            {addPreviewUrl && (
              <div className="mt-2 relative w-32 h-32 rounded border overflow-hidden bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={addPreviewUrl}
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
              disabled={isSubmittingAdd}
            />
            {addGalleryPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {addGalleryPreviews.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded border overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Gallery preview ${idx + 1}`}
                      loading="lazy"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
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
              defaultValue=""
              mediaAssets={mediaAssets}
              currentUserId={currentUserId}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmittingAdd}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!addFile || isSubmittingAdd}
              className="bg-rose-600 hover:bg-rose-700 text-white min-w-[120px]"
            >
              {isSubmittingAdd ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                "Thêm sản phẩm"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
