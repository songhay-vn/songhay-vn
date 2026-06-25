import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("featured news verification", () => {
  test("lib/queries.ts contains getFeaturedPosts with cache configuration", () => {
    const source = readWorkspaceFile("lib/queries.ts")
    expect(source).toContain("export async function getFeaturedPosts()")
    expect(source).toContain('cacheTag("featured-posts")')
    expect(source).toContain('cacheLife("days")')
    expect(source).toContain("isFeatured: true")
    expect(source).toContain("take: 5")
  })

  test("app/admin/actions/posts.ts contains togglePostFeatured and replaceFeaturedPost actions", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")
    expect(source).toContain("export async function togglePostFeatured(formData: FormData)")
    expect(source).toContain("export async function replaceFeaturedPost(formData: FormData)")
    expect(source).toContain("isFeatured: featured")
    expect(source).toContain('toast: "featured_limit_exceeded"')
    expect(source).toContain("isFeaturedChange: true")
  })

  test("components/admin/posts-tab/posts-table.tsx and post-actions-cell.tsx manage featured post interactions", () => {
    const tableSource = readWorkspaceFile("components/admin/posts-tab/posts-table.tsx")
    const cellSource = readWorkspaceFile("components/admin/posts-tab/post-actions-cell.tsx")

    expect(tableSource).toContain("featuredPosts")
    expect(tableSource).toContain("postToAddFeatured")
    expect(tableSource).toContain("selectedOldPostId")
    expect(tableSource).toContain("handleConfirmReplacement")
    expect(tableSource).toContain("replaceFeaturedPost")
    expect(tableSource).toContain("togglePostFeatured")

    expect(cellSource).toContain("post.isFeatured ? (")
    expect(cellSource).toContain("Bỏ tiêu điểm")
    expect(cellSource).toContain("Tiêu điểm")
    expect(cellSource).toContain("onSetFeatured")
    expect(cellSource).toContain("onRemoveFeatured")
  })

  test("components/news/news-layout.tsx places FeaturedSidebar on both mobile and desktop views", () => {
    const source = readWorkspaceFile("components/news/news-layout.tsx")
    expect(source).toContain('import { FeaturedSidebar } from "./featured-sidebar"')
    expect(source).toContain('className="lg:hidden"')
    expect(source).toContain('className="hidden lg:block"')
    expect(source).toContain("<FeaturedSidebar />")
  })

  test("components/news/most-read.tsx accepts an optional title prop", () => {
    const source = readWorkspaceFile("components/news/most-read.tsx")
    expect(source).toContain("title?: string")
    expect(source).toContain('title = "Đọc nhiều nhất"')
    expect(source).toContain("{title}")
  })
})
