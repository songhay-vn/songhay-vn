import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

// ── Seed flag correctness ─────────────────────────────────────────────────────
// These tests guard against regression of the bug where seeded posts had
// isDraft: true (the Prisma default) which caused the "Kho bài" tab to show
// 0 articles because it queries isDraft: false.

describe("seed data integrity", () => {
  test("seed explicitly sets isDraft: false for admin published posts", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    // Must appear in both update and create blocks for admin demo posts
    const count = (source.match(/isDraft: false/g) ?? []).length
    // Editor published (2 posts × 2 blocks) + Admin demo posts (2 blocks) + pending (2 posts × 2 blocks) = at least 6
    expect(count).toBeGreaterThanOrEqual(6)
  })

  test("seed explicitly sets editorialStatus: PUBLISHED for published posts", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    expect(source).toContain('editorialStatus: "PUBLISHED"')
    // Should appear in both admin demo posts AND editor published posts
    const count = (source.match(/editorialStatus: "PUBLISHED"/g) ?? []).length
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test("seed creates five editorial roles", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    expect(source).toContain("editor1@songhay.vn")
    expect(source).toContain("editor2@songhay.vn")
    expect(source).toContain('role: "EDITOR_IN_CHIEF"')
    expect(source).toContain('role: "MANAGING_EDITOR"')
    expect(source).toContain('role: "TEAM_LEAD"')
    expect(source).toContain('role: "REPORTER_TRANSLATOR"')
    expect(source).toContain('role: "CONTRIBUTOR"')
  })

  test("seed creates posts with PENDING_REVIEW status for editor workflow", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    expect(source).toContain('status || "PENDING_REVIEW"')
    // The fallback appears in both update and create blocks.
    const count = (source.match(/status \|\| "PENDING_REVIEW"/g) ?? []).length
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test("seed creates a draft post (isDraft: true) for editor personal archive", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    expect(source).toContain("isDraft: true")
  })

  test("seed creates editor-authored posts linked to editor users via authorId", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    // Editor posts use post.author.id via loop variable (not literal editor1.id)
    expect(source).toContain("authorId: post.author.id")
    // Confirmed by editor user definitions
    expect(source).toContain("editor1@songhay.vn")
    expect(source).toContain("editor2@songhay.vn")
  })

  test("seed creates approved editor posts with approverId set to editor in chief", () => {
    const source = readWorkspaceFile("prisma/seed.ts")

    expect(source).toContain("approverId: editorInChief.id")
    expect(source).toContain("approvedAt: publishedAt")
  })
})

// ── Schema default awareness ─────────────────────────────────────────────────

describe("schema default field awareness", () => {
  test("schema defaults isDraft to true — seed must always override explicitly", () => {
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
