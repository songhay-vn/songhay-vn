import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("public search flow", () => {
  test("header uses reusable news search popup via HeaderUserStatus", () => {
    const source = readWorkspaceFile("components/news/header-user-status.tsx")
    const popupSource = readWorkspaceFile(
      "components/news/search-icon-popup.tsx"
    )

    expect(source).toContain(
      'import { SearchIconPopup } from "./search-icon-popup"'
    )
    expect(source).toContain("<SearchIconPopup")
    expect(popupSource).toContain('import { NewsSearchForm } from "./search"')
    expect(popupSource).toContain("<NewsSearchForm")
    expect(popupSource).toContain('placeholder="Tìm bài viết..."')
  })

  test("mobile nav reuses shared search form", () => {
    const source = readWorkspaceFile("components/news/mobile-nav.tsx")

    expect(source).toContain('import { NewsSearchForm } from "./search"')
    expect(source).toContain("<NewsSearchForm")
    expect(source).not.toContain('<form action="/search"')
  })

  test("public query helper filters published non-draft posts with keyword matching", () => {
    const source = readWorkspaceFile("lib/queries.ts")

    expect(source).toContain("export async function searchPublishedPosts")
    expect(source).toContain(
      "where: createPublishedSearchWhere(normalizedQuery)"
    )
    expect(source).toContain(
      'content: { contains: normalizedQuery, mode: "insensitive" }'
    )
    const utilsSource = readWorkspaceFile("lib/query-utils.ts")
    expect(utilsSource).toContain("isPublished: true")
    expect(utilsSource).toContain("isDeleted: false")
    expect(source).toContain("isDraft: false")
    expect(source).toContain(
      'title: { contains: normalizedQuery, mode: "insensitive" }'
    )
    expect(source).toContain(
      'excerpt: { contains: normalizedQuery, mode: "insensitive" }'
    )
    expect(source).toContain(
      'category: { name: { contains: normalizedQuery, mode: "insensitive" } }'
    )
  })

  test("search page reads q and uses search helper", () => {
    const source = readWorkspaceFile("app/search/page.tsx")

    expect(source).toContain("searchParams?: Promise")
    expect(source).toContain(
      "const query = normalizeQuery(resolvedSearchParams?.q)"
    )
    expect(source).toContain("getPublishedSearchResults(query, page, 12)")
  })

  test("layout SearchAction points to dedicated search route", () => {
    const source = readWorkspaceFile("app/layout.tsx")

    expect(source).toContain("/search?q={search_term_string}")
  })
})
