"use client"

import { useState } from "react"
import Image from "next/image"

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

  const currentImageUrl = allImages[activeImageIndex] || primaryImageUrl

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Bộ sưu tập hình ảnh sản phẩm
      </h2>

      {/* Main Active Image */}
      <div className="relative aspect-[16/9] w-full max-w-2xl mx-auto rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
        <Image
          src={currentImageUrl}
          alt={`${name} - Ảnh ${activeImageIndex + 1}`}
          fill
          priority
          className="object-contain"
        />
      </div>

      {/* Thumbnail Selector (if more than 1 image) */}
      {allImages.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {allImages.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`relative w-20 aspect-[16/9] rounded-lg overflow-hidden border-2 transition ${
                activeImageIndex === idx
                  ? "border-rose-600 ring-2 ring-rose-600/20 scale-105"
                  : "border-zinc-200 opacity-70 hover:opacity-100 hover:border-zinc-400"
              }`}
            >
              <Image
                src={url}
                alt={`${name} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
