import { getLatestPublishedPosts } from "@/lib/queries"
import { cn } from "@/lib/utils"

import { PostCardList } from "./post-card-list"
import { SectionHeading } from "./section-heading"

type LatestArticleSectionProps = {
  limit?: number
  className?: string
}

export async function LatestArticleSection({
  limit = 4,
  className,
}: LatestArticleSectionProps) {
  const posts = await getLatestPublishedPosts(limit)

  if (posts.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Tin mới nhất"
      className={cn("space-y-4 border-t border-zinc-200 pt-6", className)}
    >
      <SectionHeading title="Tin mới nhất" />
      <PostCardList posts={posts} />
    </section>
  )
}
