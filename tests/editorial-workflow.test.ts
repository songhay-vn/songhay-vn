import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("editorial workflow", () => {
  test("post creation supports draft and pending review flow", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toContain("resolveEditorialFromSubmitAction")
    expect(source).toContain('editorialStatus === "DRAFT"')
    expect(source).toContain(
      "/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish"
    )
    expect(source).toMatch(
      /redirect\(\s*"\/admin\?tab=posts&postsStatus=pending-review&toast=post_submitted_review"\s*\)/
    )
    expect(source).toMatch(
      /redirect\(\s*"\/admin\?tab=personal-archive&toast=post_saved_draft"\s*\)/
    )
    expect(source).toContain('redirect("/admin?tab=write&toast=missing_fields")')
    expect(source).toContain('const penNameId = String(formData.get("penNameId") || "").trim()')
    expect(source).toContain("const selectedPenName = penNameId")
    expect(source).toContain("const penName = selectedPenName?.name || \"\"")
    expect(source).toContain("if (!title || !selectedPenName)")
    expect(source).toContain('if (submitAction !== "save-draft" && (!excerpt || !plainContent || !categoryId))')
    expect(source).toContain("authorId: currentUser.id")
  })

  test("admin actions include approval metadata updates", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toContain("export async function approvePendingPost")
    expect(source).toContain("const shouldPublishNow = canPublishNow(currentUser.role)")
    expect(source).toContain(
      'editorialStatus: shouldPublishNow ? "PUBLISHED" : "PENDING_PUBLISH"'
    )
    expect(source).toContain("approverId: currentUser.id")
    expect(source).toContain("approvedAt: new Date()")
    expect(source).toContain("export async function rejectPendingPost")
    expect(source).toContain('editorialStatus: "REJECTED"')
    expect(source).toContain("export async function returnPostToPendingReview")
    expect(source).toContain('editorialStatus: "PENDING_REVIEW"')
    expect(source).toContain("export async function returnPostToPendingPublish")
    expect(source).toContain('editorialStatus: "PENDING_PUBLISH"')
  })

  test("posts and personal archive UI components are wired", () => {
    const pageSource = readWorkspaceFile("app/admin/page.tsx")
    const postsTabSource = readWorkspaceFile(
      "components/admin/posts-tab/index.tsx"
    )
    const postActionsSource = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )
    const personalSource = readWorkspaceFile(
      "components/admin/personal-archive-tab.tsx"
    )

    expect(pageSource).toContain("<PostsTab")
    expect(pageSource).toContain("<PersonalArchiveTab")
    expect(postsTabSource).toContain("returnPostToPendingPublish")
    expect(postActionsSource).toContain("Lên đăng")
    expect(postActionsSource).toContain("Lên duyệt")
    expect(postActionsSource).toContain("Về kho")
    expect(postActionsSource).toContain("Bỏ đăng")
    expect(personalSource).toContain("<PostsTable")
  })
})
