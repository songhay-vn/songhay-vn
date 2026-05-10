import { NextResponse } from "next/server"
import { cacheTag, cacheLife } from "next/cache"
import { prisma } from "@/lib/prisma"

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

async function getLatestByCategoryData(perCategory: number, categoriesLimit: number) {
  "use cache"
  cacheTag("latest-by-category", "homepage")
  cacheLife({ revalidate: 600 })  // 10 min — matches queries.ts

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: categoriesLimit,
  })

  const sections = await Promise.all(
    categories.map(async (category) => {
      const posts = await prisma.post.findMany({
        where: { isPublished: true, isDeleted: false, isDraft: false, categoryId: category.id },
        select: {
          id: true, title: true, slug: true,
          excerpt: true, thumbnailUrl: true, publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: perCategory,
      })
      return { category, posts }
    })
  )
  return sections.filter((s) => s.posts.length > 0)
}

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const url = new URL(incomingRequest.url)

  const perCategory = Math.min(toPositiveInt(url.searchParams.get("perCategory"), 4), 12)
  const categoriesLimit = Math.min(toPositiveInt(url.searchParams.get("categories"), 6), 20)

  const items = await getLatestByCategoryData(perCategory, categoriesLimit)

  return NextResponse.json({ items })
}
