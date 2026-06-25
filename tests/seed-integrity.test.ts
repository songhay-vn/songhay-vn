import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

// ── Schema default awareness ─────────────────────────────────────────────────

describe("schema default field awareness", () => {
  test("schema defaults isDraft to true", () => {
    const schema = readWorkspaceFile("prisma/schema.prisma")

    // This is the trap: isDraft defaults true, so published posts must explicitly set false
    expect(schema).toMatch(/isDraft\s+Boolean\s+@default\(true\)/)
  })

  test("schema defaults editorialStatus to DRAFT", () => {
    const schema = readWorkspaceFile("prisma/schema.prisma")

    expect(schema).toMatch(
      /editorialStatus\s+EditorialStatus\s+@default\(DRAFT\)/
    )
    // The EditorialStatus enum includes PENDING_REVIEW
    expect(schema).toContain("PENDING_REVIEW")
    expect(schema).toContain("PENDING_PUBLISH")
    expect(schema).toContain("REJECTED")
  })

  test("kho-bai (posts tab) query is unified by editorial status and scopes non-deleted posts", () => {
    const source = readWorkspaceFile("app/admin/data-loaders/posts.ts")

    expect(source).toContain("isDeleted: false")
    expect(source).toContain('postsFilters.status === "published"')
    expect(source).toContain('postsFilters.status === "pending-review"')
    expect(source).toContain('postsFilters.status === "pending-publish"')
  })

  test("public-facing API routes also filter isDraft: false to prevent draft leaks", () => {
    const mostRead = readWorkspaceFile("app/api/posts/most-read/route.ts")
    const latestByCatQueries = readWorkspaceFile("lib/queries.ts")

    expect(mostRead).toContain("getMostReadPosts")
    expect(latestByCatQueries).toContain("isDraft: false")
  })
})
