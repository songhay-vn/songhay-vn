import { connection } from "next/server"
import { RecommendedForYou } from "./recommended-for-you"
import { VienHanLamProducts } from "./vien-han-lam-products"
import { SectionHeading } from "./section-heading"
import { PostCardList } from "./post-card-list"
import {
  fetchLatestPostsDynamic,
  fetchRecommendedPostsDynamic,
} from "@/lib/queries"

/**
 * Dynamic footer section — no "use cache".
 * Lives inside <Suspense> in ArticlePageShell (cacheComponents: true).
 * Fetches fresh data on every request so "Tin mới nhất" and "Dành cho bạn"
 * always show the latest published posts without any ISR rebuilds.
 */
export async function SiteEngagement() {
  await connection()
  const [latestPosts, recommended] = await Promise.all([
    fetchLatestPostsDynamic(10),
    fetchRecommendedPostsDynamic(undefined, 12),
  ])

  return (
    <div className="mt-8 flex flex-col gap-8 border-t border-zinc-200 pt-8">
      <section className="space-y-4">
        <SectionHeading title="Tin mới nhất" />
        <PostCardList posts={latestPosts} />
      </section>

      <VienHanLamProducts />

      {recommended.length > 0 && (
        <RecommendedForYou posts={recommended} />
      )}
    </div>
  )
}
