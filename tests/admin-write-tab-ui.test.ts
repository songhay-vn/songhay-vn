import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin write tab UI", () => {
  test("write tab wires shared SEO fields and supports sensitive toggle", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")
    const seoFieldsSource = readWorkspaceFile("components/admin/seo-fields.tsx")

    expect(source).toContain("SeoFields")
    expect(source).toContain("SeoKeywordPicker")
    expect(source).toContain("PenNameSelect")
    expect(seoFieldsSource).toContain(
      '<legend className="px-1 text-sm font-semibold">SEO</legend>'
    )
    expect(seoFieldsSource).toContain("Để trống, hệ thống sẽ tự tạo")
    expect(source).toContain('name="isSensitive"')
  })

  test("write tab supports draft and review actions", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    expect(source).toContain('name="submitAction"')
    expect(source).toContain('value="save-draft"')
    expect(source).toContain('value="submit-review"')
    expect(source).toContain('value="publish"')
  })

  test("write tab has preview button and capability-gated publish actions", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    // Preview button opens new tab
    expect(source).toContain("Xem trước")
    expect(source).toContain("createPostForPreview")
    expect(source).toContain("window.open")

    expect(source).toContain("canPublishNow")
    expect(source).toContain("canSubmitPendingPublish")
    expect(source).not.toContain("Xuất bản (chỉ admin)")
  })

  test("write and edit pages use configured pen name selector", () => {
    const writeSource = readWorkspaceFile("components/admin/write-tab.tsx")
    const editSource = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    const selectSource = readWorkspaceFile("components/admin/pen-name-select.tsx")

    expect(writeSource).toContain("penNameOptions")
    expect(writeSource).toContain("<PenNameSelect")
    expect(writeSource).not.toContain('name="penName"')
    expect(editSource).toContain("prisma.penName.findMany")
    expect(editSource).toContain("defaultValue={post.penNameId}")
    expect(editSource).not.toContain('name="penName"')
    expect(selectSource).toContain('name = "penNameId"')
    expect(selectSource).toContain("avatarUrl")
  })

  test("write tab pending review button uses destructive variant", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")
    // The Gửi chờ duyệt button should use destructive (red) variant
    expect(source).toContain('value="submit-review"')
    expect(source).toContain('variant="destructive"')
  })

  test("rich text field media picker has pagination controls", () => {
    const source = readWorkspaceFile(
      "components/admin/media-picker/library-tab.tsx"
    )

    expect(source).toContain("const [page, setPage] = useState(1)")
    expect(source).toContain("Trang {safePage} / {totalPages}")
    expect(source).toContain("setPage((v) => Math.max(1, v - 1))")
  })

  test("seo keyword picker keeps server action field names", () => {
    const source = readWorkspaceFile("components/admin/seo-keyword-picker.tsx")

    expect(source).toContain('name="seoKeywordIds"')
    expect(source).toContain('name="seoKeywords"')
    expect(source).toContain("Thêm mới")
  })

  test("edit page reuses shared SEO autofill fields", () => {
    const source = readWorkspaceFile("app/admin/edit/[id]/page.tsx")

    expect(source).toContain("SeoFields")
    expect(source).toContain("initialTitle={post.title}")
    expect(source).toContain("initialExcerpt={post.excerpt}")
  })
})
