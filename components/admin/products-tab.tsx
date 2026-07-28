"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Trash2, Edit3, Globe, EyeOff, Loader2, X } from "lucide-react"

import type { ProductRow } from "@/app/admin/data-loaders"
import type { MediaAsset } from "@/components/admin/media-picker/types"
import { RichTextField } from "@/components/admin/rich-text-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductIndex,
} from "@/app/admin/actions/products"

type ProductsTabProps = {
  products: ProductRow[]
  mediaAssets?: MediaAsset[]
  currentUserId?: string
}

export function ProductsTab({
  products,
  mediaAssets = [],
  currentUserId = "",
}: ProductsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)

  // Add Form state (primary image + gallery images, deferred upload on submit)
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addPreviewUrl, setAddPreviewUrl] = useState("")
  const [addGalleryFiles, setAddGalleryFiles] = useState<File[]>([])
  const [addGalleryPreviews, setAddGalleryPreviews] = useState<string[]>([])
  const [addUploadError, setAddUploadError] = useState("")
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  // Edit Form state (primary image + gallery images, deferred upload on submit)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreviewUrl, setEditPreviewUrl] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const [editImagePublicId, setEditImagePublicId] = useState("")
  const [editExistingGalleryUrls, setEditExistingGalleryUrls] = useState<string[]>([])
  const [editNewGalleryFiles, setEditNewGalleryFiles] = useState<File[]>([])
  const [editNewGalleryPreviews, setEditNewGalleryPreviews] = useState<string[]>([])
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editUploadError, setEditUploadError] = useState("")

  function handleAddPrimaryFileSelect(file: File) {
    setAddFile(file)
    setAddPreviewUrl(URL.createObjectURL(file))
    setAddUploadError("")
  }

  function handleAddGalleryFilesSelect(files: FileList) {
    const fileArray = Array.from(files)
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file))
    setAddGalleryFiles((prev) => [...prev, ...fileArray])
    setAddGalleryPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeAddGalleryImage(index: number) {
    setAddGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setAddGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function handleEditPrimaryFileSelect(file: File) {
    setEditFile(file)
    setEditPreviewUrl(URL.createObjectURL(file))
    setEditUploadError("")
  }

  function handleEditGalleryFilesSelect(files: FileList) {
    const fileArray = Array.from(files)
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file))
    setEditNewGalleryFiles((prev) => [...prev, ...fileArray])
    setEditNewGalleryPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeEditExistingGalleryImage(index: number) {
    setEditExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function removeEditNewGalleryImage(index: number) {
    setEditNewGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setEditNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadSingleFile(file: File): Promise<{ url: string; publicId: string }> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("skipLibrary", "true")
    const res = await fetch("/api/uploads/image", { method: "POST", body: fd })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      const serverMsg = errData.error || `HTTP ${res.status}`
      throw new Error(`Upload failed: ${serverMsg}`)
    }
    const data = await res.json()
    return { url: data.url, publicId: data.asset?.publicId ?? "" }
  }

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      const digest = (err as { digest?: string })?.digest
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw err
      }
      console.error("Add product error:", err)
      setAddUploadError("Đã xảy ra lỗi khi tải ảnh lên hoặc tạo sản phẩm. Vui lòng thử lại.")
      setIsSubmittingAdd(false)
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setIsSubmittingEdit(true)
    setEditUploadError("")

    try {
      let finalImageUrl = editImageUrl
      let finalImagePublicId = editImagePublicId

      // Upload new primary image if selected
      if (editFile) {
        const primaryResult = await uploadSingleFile(editFile)
        finalImageUrl = primaryResult.url
        finalImagePublicId = primaryResult.publicId
      }

      if (!finalImageUrl) {
        setEditUploadError("Vui lòng chọn hình ảnh chính của sản phẩm.")
        setIsSubmittingEdit(false)
        return
      }

      // Upload new gallery images if selected
      const newGalleryUploads = await Promise.all(
        editNewGalleryFiles.map((file) => uploadSingleFile(file))
      )
      const newUploadedGalleryUrls = newGalleryUploads.map((g) => g.url)
      const finalGalleryUrls = [...editExistingGalleryUrls, ...newUploadedGalleryUrls]

      const formData = new FormData(form)
      formData.set("imageUrl", finalImageUrl)
      formData.set("imagePublicId", finalImagePublicId)
      formData.set("galleryUrls", JSON.stringify(finalGalleryUrls))

      await updateProduct(formData)
    } catch (err: unknown) {
      const digest = (err as { digest?: string })?.digest
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        throw err
      }
      console.error("Update product error:", err)
      setEditUploadError("Đã xảy ra lỗi khi tải ảnh lên hoặc cập nhật sản phẩm. Vui lòng thử lại.")
      setIsSubmittingEdit(false)
    }
  }

  function openEditModal(product: ProductRow) {
    setEditingProduct(product)
    setEditFile(null)
    setEditPreviewUrl("")
    setEditImageUrl(product.imageUrl)
    setEditImagePublicId(product.imagePublicId || "")
    setEditExistingGalleryUrls(product.galleryUrls || [])
    setEditNewGalleryFiles([])
    setEditNewGalleryPreviews([])
    setEditUploadError("")
  }

  function resetAddForm() {
    setAddFile(null)
    setAddPreviewUrl("")
    setAddGalleryFiles([])
    setAddGalleryPreviews([])
    setAddUploadError("")
    setIsSubmittingAdd(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Quản lý sản phẩm</h2>
          <p className="text-sm text-zinc-500">
            Quản lý danh sách sản phẩm hiển thị trên thanh bên và trang chi tiết sản phẩm.
          </p>
        </div>

        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open)
            if (!open) resetAddForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm mới
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[760px] max-h-[95vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Thêm sản phẩm mới</DialogTitle>
              <DialogDescription>
                Điền thông tin sản phẩm và bộ sưu tập ảnh (Product Gallery).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
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
                      if (file) handleAddPrimaryFileSelect(file)
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
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                <Label className="text-sm font-semibold">
                  Bộ sưu tập ảnh bổ sung (Product Gallery)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAddGalleryFilesSelect(e.target.files)
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
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeAddGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition"
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
                  onClick={() => setIsAddOpen(false)}
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
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
          <p className="text-zinc-500">Chưa có sản phẩm nào được thêm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col justify-between overflow-hidden">
              <CardHeader className="p-0 relative aspect-[16/9] bg-zinc-100 border-b border-zinc-200">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={product.isIndexed ? "default" : "secondary"}
                    className={
                      product.isIndexed
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-600 text-white"
                    }
                  >
                    {product.isIndexed ? (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Đã lập chỉ mục
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> Chưa lập chỉ mục
                      </span>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1">
                <CardTitle className="text-base font-bold text-zinc-900 line-clamp-2">
                  {product.name}
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  /san-pham/{product.slug}
                </p>
                {product.galleryUrls && product.galleryUrls.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    + {product.galleryUrls.length} ảnh bộ sưu tập
                  </p>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-zinc-100 gap-2 mt-auto">
                <form action={toggleProductIndex}>
                  <input type="hidden" name="productId" value={product.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    title={
                      product.isIndexed
                        ? "Hủy lập chỉ mục Search Console"
                        : "Yêu cầu lập chỉ mục Search Console"
                    }
                  >
                    {product.isIndexed ? "Hủy chỉ mục" : "Lập chỉ mục"}
                  </Button>
                </form>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(product)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Sửa
                  </Button>

                  <form
                    action={deleteProduct}
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`
                        )
                      ) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <input type="hidden" name="productId" value={product.id} />
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingProduct && (
        <Dialog
          open={Boolean(editingProduct)}
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null)
          }}
        >
          <DialogContent
            className="sm:max-w-[760px] max-h-[95vh] overflow-y-auto"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin và bộ sưu tập ảnh cho sản phẩm &quot;{editingProduct.name}&quot;.
              </DialogDescription>
            </DialogHeader>

            <form key={editingProduct.id} onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <input
                type="hidden"
                name="productId"
                value={editingProduct.id}
              />

              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm font-semibold">
                  Tên sản phẩm <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
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
                      if (file) handleEditPrimaryFileSelect(file)
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
                      src={editPreviewUrl || editImageUrl}
                      alt="Primary Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="space-y-1.5 border-t border-zinc-100 pt-3">
                <Label className="text-sm font-semibold">
                  Bộ sưu tập ảnh bổ sung (Product Gallery)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleEditGalleryFilesSelect(e.target.files)
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
                          src={url}
                          alt={`Existing gallery ${idx + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditExistingGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition"
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
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditNewGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 transition"
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
                  defaultValue={editingProduct.description || ""}
                  mediaAssets={mediaAssets}
                  currentUserId={currentUserId}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
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
      )}
    </div>
  )
}
