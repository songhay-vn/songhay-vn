import { NextResponse } from "next/server"

import { memoizeWithTtl } from "@/lib/data-cache"
import { getMostReadPosts } from "@/lib/queries"

const MOST_READ_API_CACHE_SECONDS = 30 * 60

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

async function getMostReadData(limit: number, categorySlug: string) {
  return memoizeWithTtl(
    `api:posts:most-read:${limit}:${categorySlug || "all"}`,
    MOST_READ_API_CACHE_SECONDS,
    () =>
      getMostReadPosts({
        limit,
        categorySlug,
      })
  )
}

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const url = new URL(incomingRequest.url)

  const limit = Math.min(toPositiveInt(url.searchParams.get("limit"), 5), 20)
  const categorySlug = String(url.searchParams.get("category") || "").trim()

  const posts = await getMostReadData(limit, categorySlug)

  return NextResponse.json(
    {
      items: posts,
      pagination: {
        totalCount: posts.length,
        page: 1,
        pageSize: limit,
        totalPages: 1,
      },
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  )
}
