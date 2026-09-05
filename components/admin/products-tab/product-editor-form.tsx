"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react"

import type { ProductRow } from "@/app/admin/data-loaders"
import type { MediaAsset } from "@/components/admin/media-picker/types"
import { RichTextField } from "@/components/admin/rich-text-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { createProduct, updateProduct } from "@/app/admin/actions/products"
import { uploadSingleFile } from "./upload-helper"

type ProductEditorFormProps = {
  mode: "create" | "edit"
  product?: ProductRow | null
  mediaAssets?: MediaAsset[]
  currentUserId?: string
  onCancel: () => void
  onSuccess?: () => void
}

export function ProductEditorForm({
  mode,
  product,
  mediaAssets = [],
  currentUserId = "",
  onCancel,
  onSuccess,
}: ProductEditorFormProps) {
  const isEdit = mode === "edit" && Boolean(product)

  const [type, setType] = useState<"SCIENCE_PRODUCT" | "VIET_GIFT">(
    (product?.type as "SCIENCE_PRODUCT" | "VIET_GIFT") || "SCIENCE_PRODUCT"
  )
  const [primaryFile, setPrimaryFile] = useState<File | null>(null)
  const [primaryPreviewUrl, setPrimaryPreviewUrl] = useState("")
  const [existingImageUrl, setExistingImageUrl] = useState(product?.imageUrl || "")
  const [existingImagePublicId, setExistingImagePublicId] = useState(product?.imagePublicId || "")

  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>(product?.galleryUrls || [])
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([])
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([])

  const [uploadError, setUploadError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (product) {
      setType((product.type as "SCIENCE_PRODUCT" | "VIET_GIFT") || "SCIENCE_PRODUCT")
      setExistingImageUrl(product.imageUrl || "")
      setExistingImagePublicId(product.imagePublicId || "")
      setExistingGalleryUrls(product.galleryUrls || [])
    }
  }, [product])

  function handlePrimaryFileSelect(file: File) {
    setPrimaryFile(file)
    setPrimaryPreviewUrl(URL.createObjectURL(file))
    setUploadError("")
  }

  function handleGalleryFilesSelect(files: FileList) {
    const fileArray = Array.from(files)
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file))
    setNewGalleryFiles((prev) => [...prev, ...fileArray])
    setNewGalleryPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeExistingGalleryImage(index: number) {
    setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function removeNewGalleryImage(index: number) {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget

    if (!isEdit && !primaryFile) {
      setUploadError("Vui lòng chọn hình ảnh chính của sản phẩm.")
      return
    }

    if (isEdit && !primaryFile && !existingImageUrl) {
      setUploadError("Vui lòng chọn hình ảnh chính của sản phẩm.")
      return
    }

    setIsSubmitting(true)
    setUploadError("")

    try {
      let finalImageUrl = existingImageUrl
      let finalImagePublicId = existingImagePublicId

      // 1. Upload primary image if a new file is chosen
      if (primaryFile) {
        const primaryResult = await uploadSingleFile(primaryFile)
        finalImageUrl = primaryResult.url
        finalImagePublicId = primaryResult.publicId
      }

      // 2. Upload new gallery files in parallel
      const newGalleryUploads = await Promise.all(
        newGalleryFiles.map((file) => uploadSingleFile(file))
      )
      const uploadedGalleryUrls = newGalleryUploads.map((g) => g.url)

      // Combined gallery URLs: retained existing + newly uploaded
      const finalGalleryUrls = [...existingGalleryUrls, ...uploadedGalleryUrls]

      const formData = new FormData(form)
      formData.set("imageUrl", finalImageUrl)
      formData.set("imagePublicId", finalImagePublicId)
      formData.set("galleryUrls", JSON.stringify(finalGalleryUrls))

      if (isEdit) {
        await updateProduct(formData)
      } else {
        await createProduct(formData)
      }

      onSuccess?.()
    } catch (err: unknown) {
      // Re-throw Next.js redirect errors so navigation succeeds
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err
      }

      console.error(err)
      setUploadError(
        isEdit
          ? "Đã xảy ra lỗi khi tải ảnh lên hoặc cập nhật sản phẩm. Vui lòng thử lại."
          : "Đã xảy ra lỗi khi tải ảnh lên hoặc thêm sản phẩm. Vui lòng thử lại."
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-zinc-700 hover:text-zinc-950"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              {isEdit ? `Chỉnh sửa: ${product?.name}` : "Thêm sản phẩm / Quà Việt mới"}
            </h2>
            <p className="text-xs text-zinc-500">
              {isEdit
                ? "Cập nhật thông tin chi tiết, hình ảnh và mô tả sản phẩm"
                : "Điền thông tin chi tiết, bộ sưu tập ảnh và thông tin liên hệ Zalo NSX"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="product-editor-form"
            disabled={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white min-w-[130px] font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : isEdit ? (
              "Lưu thay đổi"
            ) : (
              "Thêm sản phẩm"
            )}
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-700 font-medium">
          {uploadError}
        </div>
      )}

      {/* Main Form */}
      <form
        id="product-editor-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {isEdit && product && (
          <input type="hidden" name="productId" value={product.id} />
        )}

        {/* Left Column: Title & Description (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-name" className="text-sm font-semibold text-zinc-950">
                Tên sản phẩm <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="product-name"
                name="name"
                defaultValue={product?.name || ""}
                placeholder="Nhập tên sản phẩm..."
                required
                className="text-base font-medium"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="product-description" className="text-sm font-semibold text-zinc-950">
                Mô tả chi tiết sản phẩm
              </Label>
              <div className="mt-1">
                <RichTextField
                  name="description"
                  placeholder="Nhập mô tả sản phẩm, thông số kỹ thuật, lợi ích sức khỏe..."
                  defaultValue={product?.description || ""}
                  mediaAssets={mediaAssets}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Images (1 col) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">
              Thông tin phân loại
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="product-type" className="text-sm font-semibold text-zinc-950">
                Phân loại danh mục <span className="text-rose-600">*</span>
              </Label>
              <select
                id="product-type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as "SCIENCE_PRODUCT" | "VIET_GIFT")}
                className="w-full h-9 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="SCIENCE_PRODUCT">Sản phẩm khoa học (Viện Hàn Lâm)</option>
                <option value="VIET_GIFT">Quà Việt (Bài PR / Giới thiệu NSX)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-sortOrder" className="text-sm font-semibold text-zinc-950">
                Thứ tự hiển thị (tùy chọn)
              </Label>
              <Input
                id="product-sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={product?.sortOrder ?? ""}
                placeholder="Để trống sẽ tự động xếp sau cùng..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-zaloUrl" className="text-sm font-semibold text-zinc-950">
                Link Zalo NSX{" "}
                {type === "VIET_GIFT" ? (
                  <span className="text-rose-600 font-normal text-xs">(Áp dụng cho Quà Việt)</span>
                ) : (
                  <span className="text-zinc-500 font-normal text-xs">(Tùy chọn)</span>
                )}
              </Label>
              <Input
                id="product-zaloUrl"
                name="zaloUrl"
                defaultValue={product?.zaloUrl || ""}
                placeholder="https://zalo.me/0912345678"
              />
            </div>
          </div>

          {/* Primary Image Card */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-2">
              Ảnh chính sản phẩm <span className="text-rose-600">*</span>
            </h3>

            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePrimaryFileSelect(file)
                }}
                disabled={isSubmitting}
              />

              {(primaryPreviewUrl || existingImageUrl) && (
                <div className="mt-3 relative w-full aspect-video rounded-md border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      primaryPreviewUrl ||
                      getOptimizedImageUrl(existingImageUrl, { width: 600, crop: "limit" })
                    }
                    alt="Primary Preview"
                    loading="lazy"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Gallery Images Card */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                Bộ sưu tập ảnh bổ sung
              </h3>
              <span className="text-xs text-zinc-500 font-medium">
                {existingGalleryUrls.length + newGalleryPreviews.length} ảnh
              </span>
            </div>

            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleGalleryFilesSelect(e.target.files)
                  }
                }}
                disabled={isSubmitting}
              />

              {(existingGalleryUrls.length > 0 || newGalleryPreviews.length > 0) ? (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {/* Existing gallery images */}
                  {existingGalleryUrls.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="relative aspect-square rounded border border-zinc-200 overflow-hidden group bg-zinc-50"
                    >
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
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-sm opacity-90 hover:opacity-100 transition shadow"
                        title="Xóa ảnh này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* New gallery images */}
                  {newGalleryPreviews.map((url, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative aspect-square rounded border-2 border-dashed border-emerald-500 overflow-hidden group bg-emerald-50/20"
                    >
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
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-sm opacity-90 hover:opacity-100 transition shadow"
                        title="Xóa ảnh này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 border-2 border-dashed border-zinc-200 rounded-md text-center">
                  <UploadCloud className="w-8 h-8 text-zinc-300 mx-auto mb-1" />
                  <p className="text-xs text-zinc-500 font-medium">Chưa có ảnh bổ sung nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
