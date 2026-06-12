import { NextResponse } from "next/server"
import { getMostReadPosts } from "@/lib/queries"

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

async function getMostReadData(limit: number, categorySlug: string) {
  return getMostReadPosts({
    limit,
    categorySlug,
  })
}

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const url = new URL(incomingRequest.url)

  const limit = Math.min(toPositiveInt(url.searchParams.get("limit"), 5), 20)
  const categorySlug = String(url.searchParams.get("category") || "").trim()

  const posts = await getMostReadData(limit, categorySlug)

  return NextResponse.json({
    items: posts,
    pagination: { totalCount: posts.length, page: 1, pageSize: limit, totalPages: 1 },
  })
}
