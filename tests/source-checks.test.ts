import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("Source Verification: Type Centralization", () => {
  test("lib/queries.ts uses centralized types", () => {
    const source = readWorkspaceFile("lib/queries.ts")
    expect(source).toContain('from "@/types/post"')
    expect(source).toContain("PostListItem")
    expect(source).toContain("PostFull")
    expect(source).toContain("PostWithCategoryAndComments")
    expect(source).toContain(
      'import type { SearchResultItem } from "@/types/search"'
    )
    expect(source).toContain(
      'import type { CategoryWithChildren } from "@/types/category"'
    )
    expect(source).toContain("export type")
  })

  test("lib/session.ts uses centralized auth types", () => {
    const source = readWorkspaceFile("lib/session.ts")
    expect(source).toContain(
      'import type { SessionPayload } from "@/types/auth"'
    )
  })

  test("lib/bmi.ts uses centralized health types", () => {
    const source = readWorkspaceFile("lib/bmi.ts")
    expect(source).toContain(
      'import type { BmiGender, BmiResult } from "@/types/health"'
    )
    expect(source).toContain("export type { BmiGender, BmiResult }")
  })

  test("app/admin/data-types.ts re-exports from types/admin", () => {
    const source = readWorkspaceFile("app/admin/data-types.ts")
    expect(source).toContain('export * from "@/types/admin"')
  })
})

describe("Source Verification: Date Fixes", () => {
  test("app/[category]/[slug]/page.tsx wraps dates in new Date()", () => {
    const source = readWorkspaceFile("app/[category]/[slug]/page.tsx")
    expect(source).toContain("new Date(post.publishedAt).toISOString()")
    expect(source).toContain("new Date(post.updatedAt).toISOString()")
    expect(source).toContain("new Date(article.publishedAt).toISOString()")
    expect(source).toContain("new Date(article.updatedAt).toISOString()")
  })

  test("app/admin/edit/[id]/page.tsx wraps dates in new Date()", () => {
    const source = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    expect(source).toContain("new Date(currentPost.updatedAt).toISOString()")
    expect(source).toContain("new Date(post.updatedAt).toISOString()")
  })
})

describe("Source Verification: Admin Actions revalidation", () => {
  test("posts actions call revalidateTag", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")
    expect(source).toContain("revalidatePost")
  })

  test("workflow actions call revalidateTag", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")
    expect(source).toContain("revalidatePost")
  })
})

describe("Source Verification: Shared public bottom sections", () => {
  test("homepage data exposes non-overlapping hero and latest sets", () => {
    const source = readWorkspaceFile("lib/queries.ts")
    const notFoundSource = readWorkspaceFile("app/not-found.tsx")

    expect(source).toContain("const heroSlots = latest.slice(0, 7)")
    expect(source).toContain("const latestRest = latest.slice(7)")
    expect(source).toContain("return { heroSlots, latestRest, mostRead }")
    expect(source).not.toContain("return { heroSlots, mostRead, latest }")
    expect(notFoundSource).toContain("latestRest.slice(0, 4)")
  })

  test("NewsLayout owns the shared category article bottom section", () => {
    const source = readWorkspaceFile("components/news/news-layout.tsx")

    expect(source).toContain(
      'import { CategoryArticleSections } from "./category-article-sections"'
    )
    expect(source).toContain("showBottomCategorySections")
    expect(source).toContain("<CategoryArticleSections />")
  })

  test("category article bottom section fetches enough posts to reveal four more", () => {
    const source = readWorkspaceFile(
      "components/news/category-article-sections.tsx"
    )
    const buttonSource = readWorkspaceFile(
      "components/news/expandable-category-article-section.tsx"
    )

    expect(source).toContain("perCategory = 4")
    expect(source).toContain("revealCount = 4")
    expect(source).toContain("const previewLimit = perCategory + revealCount")
    expect(source).toContain("categoriesLimit = 6")
    expect(source).toContain("getLatestByCategory(")
    expect(source).toContain("previewLimit,")
    expect(source).toContain("categoriesLimit")
    expect(source).toContain("canRevealMore")
    expect(source).toContain("<ExpandableCategoryArticleSection")
    expect(buttonSource).toContain("router.push(`/${categorySlug}`)")
    expect(buttonSource).toContain("setExpanded(true)")
  })

  test("engagement component has been removed", () => {
    expect(
      existsSync(join(process.cwd(), "components/news/site-engagement.tsx"))
    ).toBe(false)
  })
})
