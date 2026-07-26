import { NextResponse } from "next/server"

import {
  getPublishedSearchResults,
  searchPublishedPostSuggestions,
} from "@/lib/queries"
import { toPositiveInt } from "@/lib/query-utils"

export async function GET(request: unknown) {
  const incomingRequest = request as Request
  const url = new URL(incomingRequest.url)

  const query = String(url.searchParams.get("q") || "").trim()
  const mode = String(url.searchParams.get("mode") || "suggest").trim().toLowerCase()
  const limit = Math.min(toPositiveInt(url.searchParams.get("limit"), 6), 24)

  if (!query) {
    return NextResponse.json({
      query: "",
      items: [],
      pagination: {
        totalCount: 0,
        page: 1,
        pageSize: limit,
        totalPages: 0,
      },
    })
  }

  if (mode === "results") {
    const page = toPositiveInt(url.searchParams.get("page"), 1)
    const result = await getPublishedSearchResults(query, page, limit)

    return NextResponse.json({
      query: result.query,
      items: result.items,
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
  }

  const items = await searchPublishedPostSuggestions(query, Math.min(limit, 10))

  return NextResponse.json({
    query,
    items,
  })
}