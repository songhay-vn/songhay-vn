import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("seo governance and moderation", () => {
  test("comment API only queues forbidden content for moderation", () => {
    const source = readWorkspaceFile("app/api/comments/route.ts")

    expect(source).toContain("containsForbiddenKeyword")
    expect(source).toContain("isApproved: !hasForbiddenKeyword")
    expect(source).toContain("containsBlockedKeyword: hasForbiddenKeyword")
    expect(source).toContain("requiresModeration: hasForbiddenKeyword")
  })

  test("admin page exposes moderation settings tab", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")
    const helperSource = readWorkspaceFile("app/admin/page-helpers.ts")

    expect(helperSource).toContain('key: "settings-moderation"')
    expect(source).toContain('activeTab === "settings-moderation"')
    expect(source).toContain("SettingsModerationTab")
  })

  test("overview dashboard includes range filter and new SEO metrics", () => {
    const source = readWorkspaceFile("components/admin/overview-tab.tsx")

    expect(source).toContain("overviewRange=7d")
    expect(source).toContain("overviewRange=30d")
    expect(source).toContain("Từ khóa SEO hot")
    expect(source).toContain("Thời gian ở lại trung bình")
  })

  test("preview flow does not upsert new seo keywords before submit", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toContain("resolveSeoKeywordSelectionForPreview")
  })
})

describe("ads and indexing", () => {
  test("article and homepage render real Google Adsense slots", () => {
    const articleSource = readWorkspaceFile("app/[category]/[slug]/page.tsx")
    const htmlHelperSource = readWorkspaceFile("lib/html.ts")

    expect(articleSource).toContain("ArticlePageShell")
    expect(htmlHelperSource).toContain("adsbygoogle block w-full")
  })

  test("disclaimer page is noindexed", () => {
    const source = readWorkspaceFile("app/mien-tru-trach-nhiem/page.tsx")

    expect(source).toContain("robots")
    expect(source).toContain("index: false")
    expect(source).toContain("follow: false")
  })

  test("view tracker sends dwell-time engagement", () => {
    const source = readWorkspaceFile("components/news/view-tracker.tsx")

    expect(source).toContain("/engagement")
    expect(source).toContain("sendBeacon")
    expect(source).toContain("dwellSeconds")
  })

  test("media library supports click-to-expand preview", () => {
    const source = readWorkspaceFile("components/admin/media-library-tab.tsx")

    expect(source).toContain("previewAsset")
    expect(source).toContain("setPreviewAsset(asset)")
    expect(source).toContain("<Dialog")
  })
})
