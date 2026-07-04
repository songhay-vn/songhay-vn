"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2, Crop } from "lucide-react"
import { getCroppedImg } from "@/lib/image-crop"

interface ImageCropperProps {
  image: string
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedImage: Blob) => void
  aspectRatio?: number
  targetWidth?: number
  targetHeight?: number
}

export function ImageCropper({
  image,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio = 12 / 7,
  targetWidth = 1200,
  targetHeight = 700,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropCompleteInternal = useCallback(
    (_croppedArea: { x: number; y: number; width: number; height: number }, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleCrop = async () => {
    try {
      setIsProcessing(true)
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        targetWidth,
        targetHeight
      )
      if (croppedImage) {
        onCropComplete(croppedImage)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl sm:max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Cắt ảnh (Khóa tỉ lệ 1200x700)
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 bg-zinc-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-6 space-y-4 bg-white border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
              <span>Thu phóng</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([v]) => setZoom(v)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Hủy
            </Button>
            <Button onClick={handleCrop} disabled={isProcessing} className="min-w-32">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận cắt"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
