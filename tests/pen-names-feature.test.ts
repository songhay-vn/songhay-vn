import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("pen names feature", () => {
  test("schema and migration add PenName with legacy backfill", () => {
    const schema = readWorkspaceFile("prisma/schema.prisma")
    const migration = readWorkspaceFile(
      "prisma/migrations/20260625000000_add_pen_names/migration.sql"
    )

    expect(schema).toContain("model PenName")
    expect(schema).toContain("normalizedName String   @unique")
    expect(schema).toContain("avatarPublicId String?")
    expect(schema).toContain("penNameId             String?")
    expect(schema).toContain("penNameProfile        PenName?")
    expect(schema).toContain("@@index([penNameId])")

    expect(migration).toContain('CREATE TABLE "PenName"')
    expect(migration).toContain("Backfill PenName rows from legacy Post.penName")
    expect(migration).toContain('UPDATE "Post" AS p')
    expect(migration).toContain("'edit-pen-name'")
  })

  test("permissions expose edit-pen-name with admin defaults", () => {
    const permissions = readWorkspaceFile("lib/permissions.ts")
    const permissionsUi = readWorkspaceFile(
      "components/admin/settings-permissions-tab.tsx"
    )

    expect(permissions).toContain('| "edit-pen-name"')
    expect(permissions).toContain('"edit-pen-name": "Chỉnh sửa bút danh"')
    expect(permissions).toContain("export function canEditPenNames")
    expect(permissionsUi).toContain('"edit-pen-name"')
  })

  test("admin settings has pen name tab and actions", () => {
    const pageSource = readWorkspaceFile("app/admin/page.tsx")
    const navSource = readWorkspaceFile("app/admin/page-helpers.ts")
    const componentSource = readWorkspaceFile(
      "components/admin/settings-pen-names-tab.tsx"
    )
    const actionsSource = readWorkspaceFile("app/admin/actions/pen-names.ts")

    expect(navSource).toContain('tabKey: "settings-pen-names"')
    expect(navSource).toContain("canEditPenNames")
    expect(pageSource).toContain("<SettingsPenNamesTab")
    expect(pageSource).toContain("createPenName={createPenName}")
    expect(componentSource).toContain('name="avatarUpload"')
    expect(componentSource).toContain("không lưu vào kho media")
    expect(actionsSource).toContain("uploadPenNameAvatar")
    expect(actionsSource).toContain("deleteCloudinaryAsset")
    expect(actionsSource).toContain("prisma.post.updateMany")
    expect(actionsSource).not.toContain("mediaAsset.create")
  })

  test("post forms submit penNameId and resolve display snapshot", () => {
    const writeSource = readWorkspaceFile("components/admin/write-tab.tsx")
    const editSource = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    const postActions = readWorkspaceFile("app/admin/actions/posts.ts")
    const previewButton = readWorkspaceFile("components/admin/preview-button.tsx")

    expect(writeSource).toContain("postPenNameId")
    expect(writeSource).toContain("PenNameSelect")
    expect(editSource).toContain("PenNameSelect")
    expect(editSource).toContain("post.penNameId")
    expect(postActions).toContain("where: { id: penNameId }")
    expect(postActions).toContain("penNameId,")
    expect(postActions).toContain("penName,")
    expect(previewButton).toContain("postPenNameId")
  })

  test("public article renders byline under title with avatar fallback", () => {
    const shellSource = readWorkspaceFile("components/news/article-page-shell.tsx")
    const querySource = readWorkspaceFile("lib/queries.ts")
    const previewSource = readWorkspaceFile("app/admin/preview/[id]/page.tsx")

    expect(shellSource).toContain("ArticleAuthorByline")
    expect(shellSource).toContain("article.penNameProfile?.name || article.penName")
    expect(shellSource).toContain("rounded-full")
    expect(shellSource).toContain("getPenNameInitials")
    expect(shellSource).not.toContain("mt-4 text-right text-zinc-900")
    expect(querySource).toContain("penNameProfile: { select: { name: true, avatarUrl: true } }")
    expect(previewSource).toContain("penNameProfile: { select: { name: true, avatarUrl: true } }")
  })
})
