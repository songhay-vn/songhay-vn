import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("workflow edge cases coverage", () => {
  test("server actions exist for all required transitions", () => {
    const workflowSource = readWorkspaceFile("app/admin/actions/workflow.ts")
    const postsSource = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(workflowSource).toContain(
      "export async function submitPostToPendingReview"
    )
    expect(workflowSource).toContain(
      "export async function promotePostToPendingPublish"
    )
    expect(workflowSource).toContain("export async function approvePendingPost")
    expect(workflowSource).toContain("export async function returnPostToDraft")
    expect(workflowSource).toContain(
      "export async function returnPostToPendingReview"
    )
    expect(workflowSource).toContain(
      "export async function returnPostToPendingPublish"
    )
    expect(postsSource).toContain("export async function movePostToTrash")
  })

  test("submit-to-review edge cases: permission, ownership, and redirect are enforced", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toContain(
      'if (!can(currentUser.role, "submit-pending-review"))'
    )
    expect(source).toContain(
      'return { toast: "post_not_found" }'
    )
    expect(source).toContain(
      "!canViewAllPosts(currentUser.role) && existingPost.authorId !== currentUser.id"
    )
    expect(source).toContain(
      'return { toast: "post_submitted_review" }'
    )
  })

  test("promote-to-pending-publish edge cases: review permission and metadata are enforced", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toContain(
      "if (!(canApprovePendingReview(currentUser.role) || canSubmitPendingPublish(currentUser.role)))"
    )
    expect(source).toContain('editorialStatus: "PENDING_PUBLISH"')
    expect(source).toContain("approverId: currentUser.id")
    expect(source).toContain("approvedAt: new Date()")
  })

  test("return-to-draft edge cases: forbidden ownership and destination status are enforced", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toContain(
      "const canManageWorkflow = canApprovePendingReview(currentUser.role) || canPublishNow(currentUser.role)"
    )
    expect(source).toContain(
      "if (!canManageWorkflow && existingPost.authorId !== currentUser.id)"
    )
    expect(source).toContain('editorialStatus: "DRAFT"')
    expect(source).toContain("isDraft: true")
    expect(source).toContain(
      'return { toast: "post_returned_draft" }'
    )
  })
})

describe("role-action button visibility coverage", () => {
  test("posts tab includes all requested action labels", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )

    expect(source).toContain("Lên đăng")
    expect(source).toContain("Lên duyệt")
    expect(source).toContain("Sửa bài")
    expect(source).toContain("Xóa")
    expect(source).toContain("Về kho")
    expect(source).toContain("Bỏ đăng")
  })

  test("posts tab keeps capability gates for sensitive actions", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )

    expect(source).toContain("canSubmitPendingReview")
    expect(source).toContain("canReviewPending")
    expect(source).toContain("canPublishNow")
    expect(source).toContain("canEditPost(post")
  })

  test("admin page wires all new post workflow actions", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")

    expect(source).toContain("const postActions: PostActions = {")
    expect(source).toContain("submitPostToPendingReview,")
    expect(source).toContain("promotePostToPendingPublish,")
    expect(source).toContain("returnPostToDraft,")
    expect(source).toContain("returnPostToPendingReview,")
    expect(source).toContain("returnPostToPendingPublish,")
    expect(source).toContain("{...postActions}")
  })
})
