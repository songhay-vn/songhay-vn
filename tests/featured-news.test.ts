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
    expect(source).toContain("featuredPosition: { not: null }")
    expect(source).toContain("take: FEATURED_HOMEPAGE_SLOT_COUNT")
  })

  test("app/admin/actions/posts.ts contains featured slot assign and clear actions", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")
    expect(source).toContain("const FEATURED_SLOT_COUNT = 6")
    expect(source).toContain("export async function assignFeaturedSlot(formData: FormData)")
    expect(source).toContain("export async function clearFeaturedSlot(formData: FormData)")
    expect(source).toContain("formData.get(\"featuredPosition\")")
    expect(source).toContain("featuredPosition > FEATURED_SLOT_COUNT")
    expect(source).toContain("featuredPosition: null")
    expect(source).toContain("isFeaturedChange: true")
  })

  test("components/admin/posts-tab/posts-table.tsx and post-actions-cell.tsx manage featured post interactions", () => {
    const tableSource = readWorkspaceFile("components/admin/posts-tab/posts-table.tsx")
    const cellSource = readWorkspaceFile("components/admin/posts-tab/post-actions-cell.tsx")

    expect(tableSource).toContain("featuredPosts")
    expect(tableSource).toContain("featuredSlotFillers")
    expect(tableSource).toContain("postToAssignFeatured")
    expect(tableSource).toContain("selectedFeaturedPosition")
    expect(tableSource).toContain("handleConfirmFeaturedSlot")
    expect(tableSource).toContain("assignFeaturedSlot")
    expect(tableSource).toContain("clearFeaturedSlot")
    expect(tableSource).toContain("RadioGroup")
    expect(tableSource).toContain('loading="lazy"')
    expect(tableSource).toContain('sizes="112px"')
    expect(tableSource).toContain("Slot {position}")

    expect(cellSource).toContain("post.isFeatured ? (")
    expect(cellSource).toContain("Bỏ tiêu điểm")
    expect(cellSource).toContain("Ghim tin")
    expect(cellSource).toContain("onSetFeatured")
    expect(cellSource).toContain("onRemoveFeatured")
  })

  test("components/news/news-layout.tsx removes FeaturedSidebar from mobile and desktop sidebars", () => {
    const source = readWorkspaceFile("components/news/news-layout.tsx")
    expect(source).not.toContain('import { FeaturedSidebar } from "./featured-sidebar"')
    expect(source).not.toContain("<FeaturedSidebar />")
    expect(source).toContain("latestPosts?: PostListItem[]")
    expect(source).toContain("<LatestArticleSection posts={latestPosts} />")
  })

  test("components/news/most-read.tsx accepts an optional title prop", () => {
    const source = readWorkspaceFile("components/news/most-read.tsx")
    expect(source).toContain("title?: string")
    expect(source).toContain('title = "Đọc nhiều nhất"')
    expect(source).toContain("{title}")
  })
})
