"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type PostThumbnailProps = {
  src?: string | null
  alt?: string
  width?: number
  height?: number
  className?: string
}

export function PostThumbnail({
  src,
  alt = "Thumbnail",
  width = 84,
  height = 60,
  className,
}: PostThumbnailProps) {
  const containerStyle = { width, height }

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn("shrink-0 rounded-md border border-zinc-200 object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-400",
        className
      )}
      style={containerStyle}
    >
      No img
    </div>
  )
}
