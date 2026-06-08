import { Suspense } from "react"
import { RecommendedForYou } from "./recommended-for-you"
import { VienHanLamProducts } from "./vien-han-lam-products"
import { SectionHeading } from "./section-heading"
import { PostCardList } from "./post-card-list"
import { getRecommendedPosts, getHomepageData } from "@/lib/queries"

export async function SiteEngagement() {
  const [recommended, { latestRest }] = await Promise.all([
    getRecommendedPosts(undefined, undefined, 12),
    getHomepageData(),
  ])

  return (
    <div className="mt-8 flex flex-col gap-8 border-t border-zinc-200 pt-8">
      <section className="space-y-4">
        <SectionHeading title="Tin mới nhất" />
        <PostCardList posts={latestRest.slice(0, 10)} />
      </section>

      <VienHanLamProducts />

      <Suspense
        fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}
      >
        <RecommendedForYou posts={recommended} />
      </Suspense>
    </div>
  )
}
