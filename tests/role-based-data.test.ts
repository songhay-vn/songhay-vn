import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

// ── Role scoping in data queries ─────────────────────────────────────────────

describe("role-based data scoping", () => {
  test("posts data loader supports unified editorial status filtering", () => {
    const source = readWorkspaceFile("app/admin/data-loaders/posts.ts")

    expect(source).toContain('postsFilters.status === "pending-review"')
    expect(source).toContain('postsFilters.status === "pending-publish"')
    expect(source).toContain('postsFilters.status === "published"')
    expect(source).toContain(
      "canViewAllPosts(currentUser.role) ? {} : { authorId: currentUser.id }"
    )
  })

  test("personal archive is always scoped to current user", () => {
    const source = readWorkspaceFile("app/admin/data-loaders/personal.ts")

    expect(source).toContain("authorId: currentUser.id")
    expect(source).not.toContain("canViewAllPosts(currentUser.role)")
  })

  test("published admin post rows attach cached GA4 views", () => {
    const postsSource = readWorkspaceFile("app/admin/data-loaders/posts.ts")
    const personalSource = readWorkspaceFile("app/admin/data-loaders/personal.ts")
    const analyticsSource = readWorkspaceFile(
      "app/admin/data-loaders/post-analytics.ts"
    )

    expect(postsSource).toContain("attachAnalyticsViewsToPostRows(posts)")
    expect(personalSource).toContain("attachAnalyticsViewsToPostRows(rows)")
    expect(analyticsSource).toContain("fetchAnalyticsPageViewCounts")
    expect(analyticsSource).toContain("memoizeWithTtl")
    expect(analyticsSource).toContain("ADMIN_POST_VIEW_ANALYTICS_DAYS = 30")
    expect(analyticsSource).toContain('editorialStatus === "PUBLISHED"')
  })

  test("trash query scopes by canViewAllPosts capability", () => {
    const source = readWorkspaceFile("app/admin/data-loaders/trash.ts")

    expect(source).toContain("isDeleted: true")
    expect(source).toContain(
      "canViewAllPosts(currentUser.role) ? {} : { authorId: currentUser.id }"
    )
  })

  test("media library now exposes shared assets for all CMS users", () => {
    const source = readWorkspaceFile("app/admin/data-loaders/shared.ts")

    expect(source).toContain("visibility: true")
    expect(source).toContain("displayName: true")
    expect(source).toContain("attachMediaUsage")
  })

  test("media upload DELETE endpoint enforces ownership or elevated role", () => {
    const source = readWorkspaceFile("app/api/media/[id]/route.ts")

    expect(source).toContain(
      "!canDeleteAnyMedia(session.role) && asset.uploaderId !== session.userId"
    )
  })

  test("image upload GET endpoint lists shared assets for all CMS users", () => {
    const source = readWorkspaceFile("app/api/uploads/image/route.ts")

    expect(source).toContain("uploaderId")
    expect(source).toContain("uploaderIdFilter")
    expect(source).toContain(
      'const uploaderIdFilter = uploaderIdParam.length > 0 ? uploaderIdParam : ""'
    )
    expect(source).not.toContain("canViewAllPosts(session.role)")
  })

  test("video upload GET endpoint lists shared assets for all CMS users", () => {
    const source = readWorkspaceFile("app/api/uploads/video/route.ts")

    expect(source).toContain("uploaderIdFilter")
    expect(source).not.toContain(
      "...(isAdmin ? {} : { uploaderId: session.userId })"
    )
  })
})

// ── Role-based UI gate assertions ────────────────────────────────────────────

describe("role-based UI gates", () => {
  test("write tab hides publish button for non-admin users", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    expect(source).toContain("canPublishNow ? (")
    expect(source).toContain("canSubmitPendingPublish ? (")
    expect(source).not.toContain("Xuất bản (chỉ admin)")
  })

  test("admin-only tabs are gated with adminOnly flag", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")

    expect(source).toContain("canManageSettings")
    expect(source).toContain("canApprovePendingReview(currentUser.role)")
  })

  test("posts tab shows review controls based on role capabilities", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )

    expect(source).toContain("canReviewPending")
    expect(source).toContain("canPublishNow")
  })

  test("posts tab exposes move-to-trash to all authenticated users", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )

    expect(source).toContain("movePostToTrash")
  })

  test("trash tab restore and permanent delete actions are present", () => {
    const source = readWorkspaceFile("components/admin/trash-tab.tsx")

    expect(source).toContain("restorePostFromTrash")
    expect(source).toContain("deletePostPermanently")
  })
})

// ── Server-side ownership checks in actions ───────────────────────────────────

describe("server-side ownership enforcement in actions", () => {
  test("movePostToTrash checks ownership for roles without view-all capability", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toMatch(/!canTrashOrDeletePost/)
    expect(source).toContain("post_action_forbidden")
  })

  test("restorePostFromTrash checks ownership before restoring for non-admin", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toMatch(
      /export async function restorePostFromTrash[\s\S]*?!canTrashOrDeletePost/
    )
  })

  test("deletePostPermanently checks ownership for non-admin", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toMatch(
      /export async function deletePostPermanently[\s\S]*?!canTrashOrDeletePost/
    )
  })

  test("approvePendingPost sets isDraft false and promotes to publish or pending publish", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toMatch(/approvePendingPost[\s\S]*?isDraft: false/)
    expect(source).toMatch(
      /approvePendingPost[\s\S]*?const shouldPublishNow = canPublishNow\(currentUser\.role\)/
    )
    expect(source).toMatch(
      /approvePendingPost[\s\S]*?editorialStatus: shouldPublishNow \? "PUBLISHED" : "PENDING_PUBLISH"/
    )
  })

  test("rejectPendingPost sets isPublished false and clears approver", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toMatch(/rejectPendingPost[\s\S]*?isPublished: false/)
    expect(source).toMatch(/rejectPendingPost[\s\S]*?approverId: null/)
  })

  test("createPost derives editorial state via resolveEditorialFromSubmitAction", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toContain("resolveEditorialFromSubmitAction")
    expect(source).toContain('editorialStatus === "DRAFT"')
  })
})
