import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin preview route and config", () => {
  test("next config sets serverActions size limit under experimental", () => {
    const source = readWorkspaceFile("next.config.mjs")

    expect(source).toContain("experimental")
    expect(source).toContain("serverActions")
    expect(source).toContain('bodySizeLimit: "250mb"')
  })

  test("next config marks _next assets as noindex", () => {
    const source = readWorkspaceFile("next.config.mjs")

    expect(source).toContain("async headers()")
    expect(source).toContain('source: "/_next/:path*"')
    expect(source).toContain('key: "X-Robots-Tag"')
    expect(source).toContain('value: "noindex, nofollow"')
  })

  test("admin preview route renders full website layout with preview banner", () => {
    const source = readWorkspaceFile("app/admin/preview/[id]/page.tsx")
    const shellSource = readWorkspaceFile("components/news/article-page-shell.tsx")

    // Must still be noindexed
    expect(source).toContain("index: false")
    expect(source).toContain("follow: false")

    // Must require CMS auth
    expect(source).toContain("requireCmsUser")

    // Renders real site layout via shared shell
    expect(source).toContain("ArticlePageShell")
    expect(shellSource).toContain("NewsLayout")

    // Shows a preview banner
    expect(source).toContain("Chế độ xem trước")
  })
})
