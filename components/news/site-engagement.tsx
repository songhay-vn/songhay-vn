import { Suspense } from "react"
import { RecommendedForYou } from "./recommended-for-you"
import { VienHanLamProducts } from "./vien-han-lam-products"
import { SectionHeading } from "./section-heading"
import { PostCardList } from "./post-card-list"
import { getLatestByCategory, getRecommendedPosts, getHomepageData } from "@/lib/queries"

export async function SiteEngagement() {
  const [recommended, latestByCategory, { latest }] = await Promise.all([
    getRecommendedPosts(undefined, undefined, 12),
    getLatestByCategory(4, 50),
    getHomepageData()
  ])

  return (
    <div className="flex flex-col gap-8 pt-8 border-t border-zinc-200 mt-8">
      <section className="space-y-4">
        <SectionHeading title="Tin mới nhất" />
        <PostCardList posts={latest.slice(0, 10)} />
      </section>

      <VienHanLamProducts />

      <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
        <RecommendedForYou posts={recommended} />
      </Suspense>

      <section className="space-y-8 pt-6 border-t border-zinc-200">
        {latestByCategory.map((category) => (
          <div key={category.slug} className="flex flex-col gap-4">
            <SectionHeading title={category.name} />
            <PostCardList posts={category.posts} />
          </div>
        ))}
      </section>
    </div>
  )
}
