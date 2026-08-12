import Image from "next/image"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import { resolveAspectRatio } from "@/lib/media-utils"

type PostCardProps = {
  href: string
  title: string
  excerpt?: string | null
  imageUrl?: string | null
  date?: Date | null
  categoryName?: string
  compact?: boolean
  variant?: "default" | "overlay" | "horizontal"
  aspectRatio?: "video" | "square" | "portrait" | "3/2" | "12/7"
  className?: string
  showExcerpt?: boolean
  commentCount?: number
  prefetch?: boolean
}

export function PostCard({
  href,
  title,
  excerpt,
  imageUrl,
  date,
  categoryName,
  compact = false,
  variant = "default",
  aspectRatio = "12/7",
  className,
  showExcerpt = true,
  commentCount = 0,
  prefetch = false,
}: PostCardProps) {
  const isOverlay = variant === "overlay"
  const isHorizontal = variant === "horizontal"
  const hasComments = commentCount > 0

  return (
    <article
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        isOverlay ? "h-full min-h-[400px]" : "flex flex-col",
        isHorizontal && "flex-row items-start gap-4 md:gap-6",
        className
      )}
    >
      <Link 
        href={href} 
        prefetch={prefetch}
        className={cn(
          "flex h-full w-full", 
          isHorizontal ? "flex-row items-start gap-4 md:gap-6" : "flex-col",
          // If the article is forced to flex-col on MD or LG via className, the Link must follow
          className?.includes("md:flex-col") && "md:flex-col md:gap-3",
          className?.includes("lg:flex-col") && "lg:flex-col lg:gap-3"
        )}
      >
        {/* Thumbnail Area */}
        <div
          className={cn(
            "relative overflow-hidden bg-zinc-100 flex-shrink-0",
            !isOverlay && resolveAspectRatio(aspectRatio),
            isOverlay && "absolute inset-0 h-full w-full",
            isHorizontal && "w-32 sm:w-48 lg:w-64",
            // If the article is forced to flex-col on MD/LG, the thumbnail should be full width
            className?.includes("md:flex-col") && "md:w-full",
            className?.includes("lg:flex-col") && "lg:w-full"
          )}
        >
          <Image
            src={imageUrl || "/placeholder-news.svg"}
            alt={title}
            fill
            className={cn(
              "object-cover",
              isOverlay && "brightness-90 transition-all duration-500 group-hover:brightness-100"
            )}
            loading="lazy"
            sizes={isOverlay ? "(max-width: 1024px) 100vw, 66vw" : "33vw"}
          />
          {isOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          )}
        </div>

        {/* Content Area */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            isOverlay
              ? "relative z-10 justify-end p-6 text-white"
              : isHorizontal ? "py-0 justify-start" : "py-3",
            // Responsive py-3 for vertical state
            className?.includes("md:flex-col") && "md:py-3",
            className?.includes("lg:flex-col") && "lg:py-3"
          )}
        >
          {isOverlay && <div className="flex-1" />}
          
          {/* Metadata for layout other than horizontal (Category on top) */}
          {/* Show on top if vertical or overlay, hide if horizontal list */}
          {(categoryName && !isOverlay && (!isHorizontal || className?.includes("lg:flex-col") || className?.includes("md:flex-col"))) && (
            <span className={cn(
              "mb-1 text-[10px] font-bold uppercase tracking-wider text-rose-600",
              isHorizontal && "lg:block",
              !className?.includes("lg:flex-col") && !className?.includes("md:flex-col") && isHorizontal && "hidden",
              className?.includes("md:flex-col") && isHorizontal && "max-md:hidden md:block",
              className?.includes("lg:flex-col") && !className?.includes("md:flex-col") && isHorizontal && "max-lg:hidden lg:block"
            )}>
              {categoryName}
            </span>
          )}

          <h3
            className={cn(
              "font-bold leading-tight tracking-tight group-hover:text-rose-600 transition-colors",
              isOverlay ? "text-2xl md:text-3xl text-white group-hover:text-white lg:text-4xl" : 
              isHorizontal ? "text-lg md:text-xl lg:text-2xl text-zinc-900" : "text-base md:text-lg text-zinc-900",
              // Responsive text size for vertical state
              className?.includes("md:flex-col") && "md:text-lg",
              className?.includes("lg:flex-col") && "lg:text-lg"
            )}
          >
            {title}
          </h3>

          {/* Metadata for horizontal layout (Category - Time below title) */}
          {isHorizontal && (
            <div className={cn(
              "mt-2 flex items-center gap-2 text-xs font-semibold",
              className?.includes("md:flex-col") && "md:hidden",
              className?.includes("lg:flex-col") && "lg:hidden"
            )}>
              <span className="text-primary font-bold">{categoryName}</span>
              <span className="text-black">—</span>
              <span className="text-black">
                {date ? new Date(date).toLocaleDateString("vi-VN") : "Vừa xong"}
              </span>
              {hasComments && (
                <>
                  <span className="text-black">—</span>
                  <div className="flex items-center gap-1 text-black">
                    <MessageSquare className="size-3" />
                    <span>{commentCount}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {!compact && showExcerpt && excerpt && (
            <p
              className={cn(
                "mt-2 line-clamp-2 text-sm leading-relaxed",
                isOverlay ? "text-zinc-200" : isHorizontal ? "text-black md:text-base lg:line-clamp-3" : "text-black",
                // Hide excerpt on PC if forced to vertical and in a small space
                className?.includes("md:flex-col") && "md:hidden",
                className?.includes("lg:flex-col") && "lg:hidden"
              )}
            >
              {excerpt}
            </p>
          )}

          {!compact && (date || hasComments) && (!isHorizontal || className?.includes("lg:flex-col") || className?.includes("md:flex-col")) && (
            <div className={cn(
              "mt-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider",
              isOverlay ? "text-zinc-300" : "text-black",
              isHorizontal && "hidden lg:flex",
              !className?.includes("lg:flex-col") && !className?.includes("md:flex-col") && isHorizontal && "hidden",
              className?.includes("md:flex-col") && isHorizontal && "max-md:hidden md:flex",
              className?.includes("lg:flex-col") && !className?.includes("md:flex-col") && isHorizontal && "max-lg:hidden lg:flex"
            )}>
              {date && <span>{new Date(date).toLocaleDateString("vi-VN")}</span>}
              {hasComments ? (
                <div className="flex items-center gap-1">
                  <MessageSquare className="size-3" />
                  <span>{commentCount}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
