import { getFeaturedPosts } from "@/lib/queries"
import { MostRead, toMostReadItem } from "./most-read"

export async function FeaturedSidebar() {
  const posts = await getFeaturedPosts()

  if (!posts || posts.length === 0) return null

  return <MostRead title="Tin tiêu điểm" posts={posts.map(toMostReadItem)} />
}
