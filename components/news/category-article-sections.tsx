import { connection } from "next/server"
import { getLatestByCategory } from "@/lib/queries"
import { cn } from "@/lib/utils"

import { ExpandableCategoryArticleSection } from "./expandable-category-article-section"
import { PostCardList } from "./post-card-list"
import { SectionHeading } from "./section-heading"

type CategoryArticleSectionsProps = {
  perCategory?: number
  revealCount?: number
  categoriesLimit?: number
  className?: string
}

export async function CategoryArticleSections({
  perCategory = 4,
  revealCount = 4,
  categoriesLimit = 50,
  className,
}: CategoryArticleSectionsProps) {
  await connection()
  const previewLimit = perCategory + revealCount
  const latestByCategory = await getLatestByCategory(
    previewLimit,
    categoriesLimit
  )

  if (latestByCategory.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Bài viết theo chuyên mục"
      className={cn("space-y-8 border-t border-zinc-200 pt-6", className)}
    >
      {latestByCategory.map((category) => {
        const initialPosts = category.posts.slice(0, perCategory)
        const additionalPosts = category.posts.slice(perCategory, previewLimit)
        const canRevealMore = additionalPosts.length >= revealCount

        return (
          <div key={category.slug} className="flex flex-col gap-4">
            <SectionHeading title={category.name} />
            <ExpandableCategoryArticleSection
              categorySlug={category.slug}
              canRevealMore={canRevealMore}
              initialPosts={<PostCardList posts={initialPosts} />}
              additionalPosts={<PostCardList posts={additionalPosts} />}
            />
          </div>
        )
      })}
    </section>
  )
}
