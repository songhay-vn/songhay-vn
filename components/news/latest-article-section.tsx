import { getLatestPublishedPosts } from "@/lib/queries"
import { cn } from "@/lib/utils"
import type { PostListItem } from "@/types/post"

import { PostCardList } from "./post-card-list"
import { SectionHeading } from "./section-heading"

type LatestArticleSectionProps = {
  limit?: number
  posts?: PostListItem[]
  className?: string
}

export async function LatestArticleSection({
  limit = 4,
  posts,
  className,
}: LatestArticleSectionProps) {
  const resolvedPosts = posts ?? (await getLatestPublishedPosts(limit))

  if (resolvedPosts.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Bài viết mới nhất"
      className={cn("space-y-4 border-t border-zinc-200 pt-6", className)}
    >
      <SectionHeading title="Bài viết mới nhất" />
      <PostCardList posts={resolvedPosts.slice(0, limit)} />
    </section>
  )
}
