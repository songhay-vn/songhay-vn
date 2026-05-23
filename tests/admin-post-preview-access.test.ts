import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin unpublished preview access", () => {
  test("posts action cell keeps preview for unpublished posts and only shows live view when published", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )

    expect(source).toContain("!post.isPublished ? (")
    expect(source).toContain("href={`/admin/preview/${post.id}`}")
    expect(source).toContain("post.isPublished ? (")
    expect(source).toContain("Xem bài")
  })

  test("admin preview route enforces ownership rules and avoids draft related links", () => {
    const source = readWorkspaceFile("app/admin/preview/[id]/page.tsx")

    expect(source).toContain("canViewAllPosts")
    expect(source).toContain("post.authorId !== currentUser.id")
    expect(source).toContain("post_action_forbidden")
    expect(source).toContain("post.isDeleted")
    expect(source).not.toContain("relatedPosts")
    expect(source).not.toContain("recommendedPosts")
  })
})
