"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { getOptimizedImageUrl } from "@/lib/cloudinary"
import { MediaPicker } from "@/components/admin/media-picker"
import type { MediaAsset } from "@/components/admin/media-picker/types"
import { ImageCropper } from "./image-cropper"
import { Crop, Loader2 } from "lucide-react"

type ThumbnailPickerProps = {
  defaultValue?: string
  mediaAssets: MediaAsset[]
  currentUserId: string
}

export function ThumbnailPicker({
  defaultValue = "",
  mediaAssets,
  currentUserId,
}: ThumbnailPickerProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(defaultValue)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setIsUploading(true)
      setIsCropperOpen(false)

      const formData = new FormData()
      formData.append("file", croppedBlob, "thumbnail-cropped.jpg")
      formData.append("skipLibrary", "false") // Also save to library for reuse

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setThumbnailUrl(data.url)
    } catch (error) {
      console.error(error)
      alert("Đã có lỗi xảy ra khi tải ảnh đã cắt lên server.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id="thumbnailUrl"
          name="thumbnailUrl"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIsMediaPickerOpen(true)}
        >
          Kho ảnh
        </Button>
      </div>
      {thumbnailUrl && (
        <div className="mt-2 space-y-2">
          <div className="relative w-full aspect-[12/7] overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOptimizedImageUrl(thumbnailUrl, { width: 600, crop: "limit" })}
              alt="Thumbnail preview"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCropperOpen(true)}
            disabled={isUploading}
            className="w-full h-8 text-xs font-medium gap-1.5 border-zinc-200 text-zinc-900 hover:bg-zinc-100"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Crop className="w-3.5 h-3.5 mr-1" />
            )}
            Cắt ảnh (1200x700)
          </Button>
        </div>
      )}

      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(asset) => {
          if (asset.assetType === "IMAGE") {
            setThumbnailUrl(asset.url)
            setIsMediaPickerOpen(false)
          } else {
            alert("Vui lòng chọn hoặc tải lên một file Ảnh cho ảnh đại diện.")
          }
        }}
        mediaAssets={mediaAssets}
        currentUserId={currentUserId}
      />

      {thumbnailUrl && (
        <ImageCropper
          image={thumbnailUrl}
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={handleCropComplete}
          targetWidth={1200}
          targetHeight={700}
          aspectRatio={1200 / 700}
        />
      )}
    </div>
  )
}
