"use client"

import { type ReactNode, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

type ExpandableCategoryArticleSectionProps = {
  categorySlug: string
  canRevealMore: boolean
  initialPosts: ReactNode
  additionalPosts: ReactNode
}

export function ExpandableCategoryArticleSection({
  categorySlug,
  canRevealMore,
  initialPosts,
  additionalPosts,
}: ExpandableCategoryArticleSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  function handleMoreClick() {
    if (!expanded && canRevealMore) {
      setExpanded(true)
      return
    }

    router.push(`/${categorySlug}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {initialPosts}
      {expanded ? additionalPosts : null}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleMoreClick}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-200 bg-white px-5 text-sm font-bold text-rose-700 shadow-sm shadow-rose-950/5 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-md hover:shadow-rose-950/10 focus-visible:ring-3 focus-visible:ring-rose-200 focus-visible:outline-none"
        >
          Xem thêm
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
