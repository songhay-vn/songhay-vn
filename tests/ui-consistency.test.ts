import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("UI Consistency: Unified Select Component", () => {
  test("settings-users-tab.tsx uses unified Select component instead of native select", () => {
    const source = readWorkspaceFile("components/admin/settings-users-tab.tsx")
    expect(source).toContain('import { Select } from "@/components/ui/select"')
    expect(source).not.toContain("<select")
  })

  test("settings-password-tab.tsx uses unified Select component instead of native select", () => {
    const source = readWorkspaceFile("components/admin/settings-password-tab.tsx")
    expect(source).toContain('import { Select } from "@/components/ui/select"')
    expect(source).not.toContain("<select")
  })

  test("posts-table.tsx uses unified Select component for bulk actions instead of native select", () => {
    const source = readWorkspaceFile("components/admin/posts-tab/posts-table.tsx")
    expect(source).toContain('import { Select } from "@/components/ui/select"')
    expect(source).not.toContain("<select")
  })
})

describe("UI Consistency: Unified Checkbox Component", () => {
  test("settings-permissions-tab.tsx uses unified Checkbox component instead of native input", () => {
    const source = readWorkspaceFile("components/admin/settings-permissions-tab.tsx")
    expect(source).toContain('import { Checkbox } from "@/components/ui/checkbox"')
    expect(source).not.toContain('type="checkbox"')
  })

  test("edit post page.tsx uses unified Checkbox component instead of native input", () => {
    const source = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    expect(source).toContain('import { Checkbox } from "@/components/ui/checkbox"')
    expect(source).not.toContain('type="checkbox"')
  })
})

describe("UI Consistency: Unified Card Component", () => {
  test("comments-tab.tsx uses unified Card and CardContent components", () => {
    const source = readWorkspaceFile("components/admin/comments-tab.tsx")
    expect(source).toContain('import { Card, CardContent } from "@/components/ui/card"')
    expect(source).not.toContain('rounded-lg border p-3')
  })

  test("trash-tab.tsx uses unified Card and CardContent components", () => {
    const source = readWorkspaceFile("components/admin/trash-tab.tsx")
    expect(source).toContain('import { Card, CardContent } from "@/components/ui/card"')
    expect(source).not.toContain('rounded-lg border p-3')
  })
})

describe("Accessibility: Low Contrast Text Removal", () => {
  test("site-footer.tsx uses high contrast text-zinc-950/text-zinc-900 for descriptions and disclaimers", () => {
    const source = readWorkspaceFile("components/news/site-footer.tsx")
    expect(source).not.toContain("text-zinc-600")
    expect(source).not.toContain("text-zinc-700")
    expect(source).toContain("text-zinc-950")
  })

  test("dont-miss-widget.tsx uses high contrast text for body copy", () => {
    const source = readWorkspaceFile("components/news/dont-miss-widget.tsx")
    expect(source).not.toContain("text-zinc-600")
    expect(source).toContain("text-zinc-900")
  })

  test("bio-age-widget.tsx uses high contrast text for descriptions", () => {
    const source = readWorkspaceFile("components/news/bio-age-widget.tsx")
    expect(source).not.toContain("text-zinc-600")
    expect(source).toContain("text-zinc-900")
  })
})
