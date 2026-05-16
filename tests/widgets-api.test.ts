import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("widgets API integration", () => {
  test("most-read endpoint sorts by views and published time", () => {
    const source = readWorkspaceFile("app/api/posts/most-read/route.ts")

    expect(source).toContain("orderBy: [{ views: \"desc\" }, { publishedAt: \"desc\" }]")
    expect(source).toContain("isDraft: false")
    expect(source).toContain("return NextResponse.json")
  })

  test("latest-by-category endpoint returns category sections", () => {
    const source = readWorkspaceFile("app/api/posts/latest-by-category/route.ts")

    expect(source).toContain("const sections = await Promise.all")
    expect(source).toContain("orderBy: { publishedAt: \"desc\" }")
    expect(source).toContain("return sections.filter")
  })

  test("latest-by-category endpoint validates query limits and only returns published posts", () => {
    const source = readWorkspaceFile("app/api/posts/latest-by-category/route.ts")

    expect(source).toContain("searchParams.get(\"perCategory\")")
    expect(source).toContain("searchParams.get(\"categories\")")
    expect(source).toContain("Math.min(toPositiveInt")
    expect(source).toContain("isPublished: true")
    expect(source).toContain("isDeleted: false")
    expect(source).toContain("isDraft: false")
  })

  test("most-read widget is a server component and receives posts as props", () => {
    const source = readWorkspaceFile("components/news/most-read.tsx")

    expect(source).not.toContain("\"use client\"")
    expect(source).toContain("{ posts }: MostReadProps")
  })
})
