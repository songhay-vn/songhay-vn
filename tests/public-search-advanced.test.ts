import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("public search advanced flow", () => {
  test("search API route supports suggest and paginated results modes", () => {
    const source = readWorkspaceFile("app/api/posts/search/route.ts")

    expect(source).toContain('searchParams.get("mode")')
    expect(source).toContain('mode === "results"')
    expect(source).toContain("getPublishedSearchResults")
    expect(source).toContain("searchPublishedPostSuggestions")
  })

  test("search query helpers include content search and pagination helper", () => {
    const source = readWorkspaceFile("lib/queries.ts")

    expect(source).toContain("content: { contains: normalizedQuery, mode: \"insensitive\" }")
    expect(source).toContain("export async function getPublishedSearchResults")
    expect(source).toContain("totalCount = await prisma.post.count")
    expect(source).toContain("export async function searchPublishedPostSuggestions")
  })

  test("search form supports debounced suggestion fetch", () => {
    const source = readWorkspaceFile("components/news/search/news-search-form.tsx")

    expect(source).toContain("enableSuggestions = false")
    expect(source).toContain("fetch(`/api/posts/search?")
    expect(source).toContain("window.setTimeout")
    expect(source).toContain("Xem tất cả kết quả")
  })

  test("search page supports page query param and pagination controls", () => {
    const source = readWorkspaceFile("app/search/page.tsx")

    expect(source).toContain("page?: string")
    expect(source).toContain("getPublishedSearchResults(query, page, 12)")
    expect(source).toContain("Trang {result.page}/{result.totalPages}")
    expect(source).toContain("buildSearchHref")
  })
})
