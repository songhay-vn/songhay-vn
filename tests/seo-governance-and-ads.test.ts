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

    expect(source).toContain('const rangeLabel = "30 ngày"')
    expect(source).toContain("Tổng quan")
    expect(source).toContain("Traffic")
    expect(source).toContain("Dwell-time")
    expect(source).toContain(">SEO<")
    expect(source).toContain("Trends")
    expect(source).toContain("Search Console")
    expect(source).toContain("Organic landing page")
    expect(source).not.toContain("Search indexing")
  })

  test("root layout installs Google Analytics measurement tag", () => {
    const source = readWorkspaceFile("app/layout.tsx")

    expect(source).toContain("NEXT_PUBLIC_GA_MEASUREMENT_ID")
    expect(source).toContain("G-C1ZX5NG9PC")
    expect(source).toContain("https://www.googletagmanager.com/gtag/js")
    expect(source).toContain("gtag('config'")
  })

  test("preview flow does not upsert new seo keywords before submit", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toContain("resolveSeoKeywordSelectionForPreview")
  })
})

describe("ads and indexing", () => {
  test("article rendering does not inject inline ad slots", () => {
    const articleSource = readWorkspaceFile("app/[category]/[slug]/page.tsx")
    const htmlHelperSource = readWorkspaceFile("lib/html.ts")
    const cssSource = readWorkspaceFile("app/globals.css")

    expect(articleSource).toContain("ArticlePageShell")
    expect(articleSource).toContain("normalizeArticleHtml(article.content)")
    expect(articleSource).not.toContain("injectInlineAdAfterSecondParagraph")
    expect(htmlHelperSource).not.toContain("injectInlineAdAfterSecondParagraph")
    expect(htmlHelperSource).not.toContain("ad-slot-wrapper")
    expect(cssSource).not.toContain("ad-slot-wrapper")
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
