import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin pending submit patterns", () => {
  test("shared pending submit button has immediate lock and loading indicator", () => {
    const pendingSubmitButton = readWorkspaceFile(
      "components/admin/pending-submit-button.tsx"
    )

    expect(pendingSubmitButton).toContain("LoaderCircle")
    expect(pendingSubmitButton).toContain("SUBMIT_GUARD_WINDOW_MS")
    expect(pendingSubmitButton).toContain("event.preventDefault()")
    expect(pendingSubmitButton).toContain("lastSubmitAtRef.current = now")
    expect(pendingSubmitButton).toContain("form.reportValidity()")
  })

  test("admin mutation tabs use shared pending submit button", () => {
    const writeTab = readWorkspaceFile("components/admin/write-tab.tsx")
    const editPage = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    const pendingPosts = readWorkspaceFile(
      "components/admin/pending-posts-tab.tsx"
    )
    const posts = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )
    const personalArchive = readWorkspaceFile(
      "components/admin/personal-archive-tab.tsx"
    )
    const trash = readWorkspaceFile("components/admin/trash-tab.tsx")
    const categories = readWorkspaceFile(
      "components/admin/categories-tab/index.tsx"
    )

    expect(writeTab).toContain("PendingSubmitButton")
    expect(editPage).toContain("PendingSubmitButton")
    expect(pendingPosts).toContain("PendingSubmitButton")
    expect(posts).toContain("PendingSubmitButton")
    expect(personalArchive).toContain("PostsTable")
    expect(trash).toContain("PendingSubmitButton")
    expect(categories).toContain("PendingSubmitButton")
  })

  test("confirm-action forms no longer rely on window.confirm", () => {
    const confirmActionForm = readWorkspaceFile(
      "components/admin/confirm-action-form.tsx"
    )
    const confirmSubmitButton = readWorkspaceFile(
      "components/admin/confirm-submit-button.tsx"
    )
    const mediaLibrary = readWorkspaceFile(
      "components/admin/media-library-tab.tsx"
    )

    expect(confirmActionForm).toContain("AlertDialog")
    expect(confirmActionForm).not.toContain("window.confirm")

    expect(confirmSubmitButton).toContain("AlertDialog")
    expect(confirmSubmitButton).toContain("requestSubmit")
    expect(confirmSubmitButton).not.toContain("window.confirm")

    expect(mediaLibrary).toContain("AlertDialog")
    expect(mediaLibrary).not.toContain("window.confirm")
  })

  test("edit page confirms before returning an article to draft", () => {
    const editPage = readWorkspaceFile("app/admin/edit/[id]/page.tsx")

    expect(editPage).toContain("ConfirmSubmitButton")
    expect(editPage).toContain('value="save-draft"')
    expect(editPage).toContain("Chuyển bài viết này về nháp?")
  })
})
