import { getFeaturedPosts } from "@/lib/queries"
import { MostRead } from "./most-read"

export async function FeaturedSidebar() {
  const posts = await getFeaturedPosts()

  if (!posts || posts.length === 0) return null

  return (
    <MostRead
      title="Tin tiêu điểm"
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
