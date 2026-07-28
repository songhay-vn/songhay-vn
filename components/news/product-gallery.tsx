"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

type ProductGalleryProps = {
  name: string
  primaryImageUrl: string
  galleryUrls?: string[]
}

export function ProductGallery({
  name,
  primaryImageUrl,
  galleryUrls = [],
}: ProductGalleryProps) {
  const allImages = [primaryImageUrl, ...galleryUrls.filter(Boolean)]
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isEnlarged, setIsEnlarged] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const currentImageUrl = allImages[activeImageIndex] || primaryImageUrl
  const hasMultipleImages = allImages.length > 1

  const nextImage = useCallback(() => {
    if (!hasMultipleImages) return
    setActiveImageIndex((prev) => (prev + 1) % allImages.length)
  }, [allImages.length, hasMultipleImages])

  const prevImage = useCallback(() => {
    if (!hasMultipleImages) return
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }, [allImages.length, hasMultipleImages])

  // Automatic image switching every 4 seconds (pauses on hover or when modal open)
  useEffect(() => {
    if (!hasMultipleImages || isPaused || isEnlarged) return
    const timer = setInterval(() => {
      nextImage()
    }, 4000)
    return () => clearInterval(timer)
  }, [hasMultipleImages, isPaused, isEnlarged, nextImage])

  // Touch & Mouse Drag handlers for swipe left/right
  const handleTouchStart = (clientX: number) => {
    touchStartX.current = clientX
    touchEndX.current = clientX
  }

  const handleTouchMove = (clientX: number) => {
    touchEndX.current = clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const distance = touchStartX.current - touchEndX.current
    if (distance > 40) {
      nextImage()
    } else if (distance < -40) {
      prevImage()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Bộ sưu tập hình ảnh sản phẩm
      </h2>

      {/* Main Carousel Area */}
      <div
        className="group relative aspect-[4/3] sm:aspect-[16/9] w-full max-w-2xl mx-auto overflow-hidden bg-zinc-100 border border-zinc-200 select-none"
        onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleTouchMove(e.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => handleTouchStart(e.clientX)}
        onMouseMove={(e) => e.buttons === 1 && handleTouchMove(e.clientX)}
        onMouseUp={handleTouchEnd}
      >
        <Image
          src={currentImageUrl}
          alt={`${name} - Ảnh ${activeImageIndex + 1}`}
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-contain p-2 cursor-pointer"
          onClick={() => setIsEnlarged(true)}
        />

        {/* Zoom Button */}
        <button
          type="button"
          onClick={() => setIsEnlarged(true)}
          className="absolute right-2 bottom-2 bg-black/60 text-white p-1.5 opacity-80 group-hover:opacity-100 transition"
          title="Nhấn để xem ảnh phóng to"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Prev / Next Arrows */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 transition opacity-70 group-hover:opacity-100"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 transition opacity-70 group-hover:opacity-100"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Main Page Thumbnail Selector */}
      {hasMultipleImages && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
          {allImages.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`relative w-14 sm:w-20 aspect-square overflow-hidden border-2 transition ${
                activeImageIndex === idx
                  ? "border-rose-600 ring-2 ring-rose-600/20"
                  : "border-zinc-200 opacity-70 hover:opacity-100 hover:border-zinc-400"
              }`}
            >
              <Image
                src={url}
                alt={`${name} thumbnail ${idx + 1}`}
                fill
                loading="lazy"
                sizes="80px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Enlarger Lightbox Modal */}
      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] bg-white border-zinc-200 p-3 sm:p-5 flex flex-col items-center justify-between overflow-hidden shadow-xl">
          <DialogTitle className="sr-only">{name} - Xem ảnh phóng to</DialogTitle>

          {/* Enlarged Image Area with Swipe & Arrows */}
          <div
            className="relative w-full h-[55vh] sm:h-[65vh] flex items-center justify-center select-none"
            onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleTouchMove(e.touches[0].clientX)}
            onTouchEnd={handleTouchEnd}
            onMouseDown={(e) => handleTouchStart(e.clientX)}
            onMouseMove={(e) => e.buttons === 1 && handleTouchMove(e.clientX)}
            onMouseUp={handleTouchEnd}
          >
            <Image
              src={currentImageUrl}
              alt={`${name} - Ảnh phóng to`}
              fill
              loading="lazy"
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-contain"
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 transition"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 transition"
                  aria-label="Ảnh tiếp"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Carousel Selector under Popup */}
          {hasMultipleImages && (
            <div className="w-full pt-3 border-t border-zinc-200 overflow-x-auto flex items-center justify-center gap-2 sm:gap-3">
              {allImages.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-12 sm:w-16 aspect-square shrink-0 overflow-hidden border-2 transition ${
                    activeImageIndex === idx
                      ? "border-rose-600 ring-2 ring-rose-600/20"
                      : "border-zinc-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${name} modal thumbnail ${idx + 1}`}
                    fill
                    loading="lazy"
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
