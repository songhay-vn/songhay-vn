import { NextResponse } from "next/server"
import { getLatestByCategory } from "@/lib/queries"

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const url = new URL(incomingRequest.url)

  const perCategory = Math.min(
    toPositiveInt(url.searchParams.get("perCategory"), 4),
    12
  )
  const categoriesLimit = Math.min(
    toPositiveInt(url.searchParams.get("categories"), 6),
    20
  )

  const latestByCategory = await getLatestByCategory(
    perCategory,
    categoriesLimit
  )
  const items = latestByCategory.map(({ id, name, slug, posts }) => ({
    category: { id, name, slug },
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      thumbnailUrl: post.thumbnailUrl,
      publishedAt: post.publishedAt,
    })),
  }))

  return NextResponse.json({ items })
}
