import { connection } from "next/server"
import { getTrendingPosts } from "@/lib/queries"
import { MostRead } from "./most-read"

/**
 * Dynamic sidebar — no "use cache".
 * Lives inside <Suspense> in NewsLayout (cacheComponents: true).
 * Runs a fresh DB query on every request so MostRead always reflects
 * the current view counts without any ISR rebuilds.
 *
 * `await connection()` opts this component into request-time rendering,
 * preventing Next.js from attempting to prerender it at build time
 * (which would fail because publishedPostWhere() calls new Date()).
 */
export async function TrendingSidebar() {
  await connection()
  const posts = await getTrendingPosts()

  if (!posts || posts.length === 0) return null

  return (
    <MostRead
      posts={posts.map((post) => ({
        id: post.id,
        title: post.title,
        thumbnailUrl: post.thumbnailUrl,
        views: post.views,
        slug: post.slug,
        categorySlug: post.category.slug,
      }))}
    />
  )
}
