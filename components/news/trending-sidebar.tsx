import { getTrendingPosts } from "@/lib/queries"
import { MostRead } from "./most-read"

/**
 * Cached sidebar. getTrendingPosts() uses a tagged Cache Components entry
 * so public page views do not hit Neon on every request.
 */
export async function TrendingSidebar() {
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
        category: {
          name: post.category.name,
          slug: post.category.slug,
        },
      }))}
    />
  )
}
