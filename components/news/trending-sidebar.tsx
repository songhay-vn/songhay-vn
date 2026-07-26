import { getTrendingPosts } from "@/lib/queries"
import { MostRead, toMostReadItem } from "./most-read"

/**
 * Cached sidebar. getTrendingPosts() uses GA4-backed Cache Components data.
 */
export async function TrendingSidebar() {
  const posts = await getTrendingPosts()

  if (!posts || posts.length === 0) return null

  return <MostRead posts={posts.map(toMostReadItem)} />
}
