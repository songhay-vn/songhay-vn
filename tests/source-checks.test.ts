import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("Source Verification: Type Centralization", () => {
  test("lib/queries.ts uses centralized types", () => {
    const source = readWorkspaceFile("lib/queries.ts")
    expect(source).toContain('from "@/types/post"')
    expect(source).toContain("PostListItem")
    expect(source).toContain("PostFull")
    expect(source).toContain("PostWithCategoryAndComments")
    expect(source).toContain(
      'import type { SearchResultItem } from "@/types/search"'
    )
    expect(source).toContain(
      'import type { CategoryWithChildren } from "@/types/category"'
    )
    expect(source).toContain("export type")
  })

  test("lib/session.ts uses centralized auth types", () => {
    const source = readWorkspaceFile("lib/session.ts")
    expect(source).toContain(
      'import type { SessionPayload } from "@/types/auth"'
    )
  })

  test("lib/bmi.ts uses centralized health types", () => {
    const source = readWorkspaceFile("lib/bmi.ts")
    expect(source).toContain(
      'import type { BmiGender, BmiResult } from "@/types/health"'
    )
    expect(source).toContain("export type { BmiGender, BmiResult }")
  })

  test("app/admin/data-types.ts re-exports from types/admin", () => {
    const source = readWorkspaceFile("app/admin/data-types.ts")
    expect(source).toContain('export * from "@/types/admin"')
  })
})

describe("Source Verification: Date Fixes", () => {
  test("app/[category]/[slug]/page.tsx wraps dates in new Date()", () => {
    const source = readWorkspaceFile("app/[category]/[slug]/page.tsx")
    expect(source).toContain("new Date(post.publishedAt).toISOString()")
    expect(source).toContain("new Date(post.updatedAt).toISOString()")
    expect(source).toContain("new Date(article.publishedAt).toISOString()")
    expect(source).toContain("new Date(article.updatedAt).toISOString()")
  })

  test("app/admin/edit/[id]/page.tsx wraps dates in new Date()", () => {
    const source = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    expect(source).toContain("new Date(currentPost.updatedAt).toISOString()")
    expect(source).toContain("new Date(post.updatedAt).toISOString()")
  })
})

describe("Source Verification: Public article analytics", () => {
  test("public article pages keep a cached GA4-backed view count", () => {
    const pageSource = readWorkspaceFile("app/[category]/[slug]/page.tsx")
    const shellSource = readWorkspaceFile("components/news/article-page-shell.tsx")
    const queriesSource = readWorkspaceFile("lib/queries.ts")
    const signalsSource = readWorkspaceFile("lib/google-seo-signals.ts")

    expect(pageSource).toContain("getPostViewCountFromAnalytics")
    expect(pageSource).toContain("viewCount={articleViewCount}")
    expect(shellSource).toContain("lượt xem")
    expect(queriesSource).toContain("fetchAnalyticsPageViewCount")
    expect(queriesSource).toContain("POST_VIEW_COUNT_ANALYTICS_DAYS = 30")
    expect(queriesSource).toContain('cacheTag("ga4-post-views"')
    expect(queriesSource).toContain("cacheLife({ stale:")
    expect(signalsSource).toContain("fetchAnalyticsPageViewCount")
    expect(signalsSource).toContain(
      "GOOGLE_ANALYTICS_PAGE_VIEW_REVALIDATE_SECONDS"
    )
  })
})

describe("Source Verification: Admin Actions revalidation", () => {
  test("posts actions call revalidateTag", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")
    expect(source).toContain("revalidatePost")
  })

  test("workflow actions call revalidateTag", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")
    expect(source).toContain("revalidatePost")
  })

  test("post publish invalidation does not flush most-read sidebars", () => {
    const helpersSource = readWorkspaceFile("app/admin/actions-helpers.ts")
    const queriesSource = readWorkspaceFile("lib/queries.ts")

    expect(helpersSource).toContain("options.isTrendingChange")
    expect(helpersSource).not.toContain(
      "options.isVisibilityChange || options.isTrendingChange"
    )
    expect(queriesSource).toContain('cacheTag("homepage-most-read")')
    expect(queriesSource).toContain(
      'cacheTag("trending-posts", "homepage-most-read")'
    )
    expect(queriesSource).not.toContain(
      'cacheTag("homepage", "homepage-most-read")'
    )
  })
})

describe("Source Verification: Shared public bottom sections", () => {
  test("dont miss widget promotes biological age test only", () => {
    const source = readWorkspaceFile("components/news/dont-miss-widget.tsx")

    expect(source).toContain("Cách tính tuổi sinh học")
    expect(source).toContain('"/tinh-tuoi-sinh-hoc"')
    expect(source).toContain("Tuổi của bạn")
    expect(source).toContain("parseBannerAge")
    expect(source).toContain("14 câu hỏi")
    expect(source).toContain("Làm trắc nghiệm")
    expect(source).not.toContain("GoodDayByAgeTool")
    expect(source).not.toContain("Tính BMI")
    expect(source).not.toContain("Đặt tên cho con")
  })

  test("biological age page has SEO content, CMS storage, and FAQ structured data", () => {
    const pageSource = readWorkspaceFile("app/tinh-tuoi-sinh-hoc/page.tsx")
    const widgetSource = readWorkspaceFile("components/news/bio-age-widget.tsx")
    const sitemapSource = readWorkspaceFile("app/sitemap.ts")
    const nextConfigSource = readWorkspaceFile("next.config.mjs")
    const schemaSource = readWorkspaceFile("prisma/schema.prisma")
    const apiSource = readWorkspaceFile("app/api/bio-age-submissions/route.ts")
    const overviewSource = readWorkspaceFile(
      "components/admin/overview-tab.tsx"
    )
    const loaderSource = readWorkspaceFile("app/admin/data-loaders/shared.ts")

    expect(pageSource).toContain("Cách tính tuổi sinh học")
    expect(pageSource).toContain('const canonicalPath = "/tinh-tuoi-sinh-hoc"')
    expect(pageSource).toContain("openGraph")
    expect(pageSource).toContain('"@type": "FAQPage"')
    expect(pageSource).toContain("<JsonLd data={[webPageJsonLd, faqJsonLd]}")
    expect(widgetSource).toContain("const QUESTIONS")
    expect(widgetSource).toContain('id: "sitting"')
    expect(widgetSource).toContain('id: "daylight"')
    expect(widgetSource).toContain("bioAgeSessionId")
    expect(widgetSource).toContain("Tuổi sinh học của bạn khoảng")
    expect(widgetSource).toContain('"/api/bio-age-submissions"')
    expect(widgetSource).toContain("Kết quả chỉ dùng để tự quan sát lối sống")
    expect(sitemapSource).toContain("${siteUrl}/tinh-tuoi-sinh-hoc")
    expect(nextConfigSource).toContain('source: "/tuoi-sinh-hoc"')
    expect(nextConfigSource).toContain("tinh-tuoi-sinh-hoc-:age")
    expect(schemaSource).toContain("model BioAgeSubmission")
    expect(schemaSource).toContain("enum BioAgeGender")
    expect(apiSource).toContain("prisma.bioAgeSubmission.upsert")
    expect(apiSource).toContain("skipped")
    expect(loaderSource).toContain("getBioAgeInsights")
    expect(overviewSource).toContain("Độc giả tuổi sinh học")
  })

  test("homepage data exposes non-overlapping hero and latest sets", () => {
    const source = readWorkspaceFile("lib/queries.ts")
    const notFoundSource = readWorkspaceFile("app/not-found.tsx")

    expect(source).toContain("const heroSlots = latest.slice(0, 7)")
    expect(source).toContain("const latestRest = latest.slice(7)")
    expect(source).toContain("return { heroSlots, latestRest, mostRead }")
    expect(source).not.toContain("return { heroSlots, mostRead, latest }")
    expect(notFoundSource).toContain("latestRest.slice(0, 4)")
  })

  test("NewsLayout owns the shared category article bottom section", () => {
    const source = readWorkspaceFile("components/news/news-layout.tsx")
    const latestSectionSource = readWorkspaceFile(
      "components/news/latest-article-section.tsx"
    )

    expect(source).toContain(
      'import { CategoryArticleSections } from "./category-article-sections"'
    )
    expect(source).toContain(
      'import { LatestArticleSection } from "./latest-article-section"'
    )
    expect(source).toContain("showBottomCategorySections")
    expect(source.indexOf("<LatestArticleSection />")).toBeLessThan(
      source.indexOf("<CategoryArticleSections />")
    )
    expect(latestSectionSource).toContain("getLatestPublishedPosts")
    expect(latestSectionSource).toContain('title="Bài viết mới nhất"')
    expect(source).toContain("<CategoryArticleSections />")
  })

  test("category article bottom section fetches enough posts to reveal four more", () => {
    const source = readWorkspaceFile(
      "components/news/category-article-sections.tsx"
    )
    const buttonSource = readWorkspaceFile(
      "components/news/expandable-category-article-section.tsx"
    )

    expect(source).toContain("perCategory = 4")
    expect(source).toContain("revealCount = 4")
    expect(source).toContain("const previewLimit = perCategory + revealCount")
    expect(source).toContain("categoriesLimit = 6")
    expect(source).toContain("getLatestByCategory(")
    expect(source).toContain("previewLimit,")
    expect(source).toContain("categoriesLimit")
    expect(source).toContain("canRevealMore")
    expect(source).toContain("<ExpandableCategoryArticleSection")
    expect(buttonSource).toContain("router.push(`/${categorySlug}`)")
    expect(buttonSource).toContain("setExpanded(true)")
  })

  test("engagement component has been removed", () => {
    expect(
      existsSync(join(process.cwd(), "components/news/site-engagement.tsx"))
    ).toBe(false)
  })
})
