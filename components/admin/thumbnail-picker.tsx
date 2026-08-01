"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { MediaPicker } from "@/components/admin/media-picker"
import type { MediaAsset } from "@/components/admin/media-picker/types"
import { ImageCropper } from "./image-cropper"
import { Crop, Loader2 } from "lucide-react"
import {
  Attachment,
  AttachmentMedia,
  AttachmentActions,
} from "@/components/ui/attachment"

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
        <Attachment orientation="vertical" className="mt-2 w-full max-w-xs mx-auto p-4 items-center bg-zinc-50">
          <AttachmentMedia variant="image" className="w-full aspect-auto h-auto max-h-48 overflow-visible bg-transparent border-0">
            <Image
              src={thumbnailUrl}
              alt="Thumbnail preview"
              width={400}
              height={225}
              className="h-auto max-h-48 mx-auto object-contain"
            />
          </AttachmentMedia>
          <AttachmentActions className="mt-4 static flex justify-center w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCropperOpen(true)}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Crop className="w-4 h-4 mr-1.5" />
              )}
              Cắt ảnh (1200x700)
            </Button>
          </AttachmentActions>
        </Attachment>
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
