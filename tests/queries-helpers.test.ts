import { describe, expect, test, mock } from "bun:test"

mock.module("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
}))

import {
  buildStaticNavFallback,
  clampPositiveInt,
  createPublishedSearchWhere,
  getAnalyticsArticlePath,
  getAnalyticsPathname,
  getPopularPostKey,
  normalizeSearchQuery,
  safeDecodePathSegment,
} from "@/lib/queries"

describe("Unit: Query Helpers & Analytics Path Parsing", () => {
  test("clampPositiveInt clamps numbers within fallback and max limits", () => {
    expect(clampPositiveInt(0, 10, 50)).toBe(10)
    expect(clampPositiveInt(-5, 10, 50)).toBe(10)
    expect(clampPositiveInt(NaN, 10, 50)).toBe(10)
    expect(clampPositiveInt(5, 10, 50)).toBe(5)
    expect(clampPositiveInt(100, 10, 50)).toBe(50)
  })

  test("safeDecodePathSegment safely decodes URI components and handles invalid escape sequences", () => {
    expect(safeDecodePathSegment("suc-khoe")).toBe("suc-khoe")
    expect(safeDecodePathSegment("tin%20tuc")).toBe("tin tuc")
    expect(safeDecodePathSegment("%E0%B8%81")).toBe("ก")
    expect(safeDecodePathSegment("%%invalid")).toBe("%%invalid")
  })

  test("getAnalyticsPathname extracts clean pathname from raw analytics URLs", () => {
    expect(getAnalyticsPathname(" https://songhay.vn/suc-khoe/bai-viet-1?ref=ga4#comments ")).toBe("/suc-khoe/bai-viet-1")
    expect(getAnalyticsPathname("/suc-khoe/bai-viet-1/")).toBe("/suc-khoe/bai-viet-1")
    expect(getAnalyticsPathname("(not set)")).toBe("")
  })

  test("getAnalyticsArticlePath parses valid article paths and filters out admin/non-article routes", () => {
    expect(getAnalyticsArticlePath("https://songhay.vn/suc-khoe/bai-viet-1")).toEqual({
      categorySlug: "suc-khoe",
      slug: "bai-viet-1",
      views: 0,
    })
    expect(getAnalyticsArticlePath("/admin/preview/123")).toBeNull()
    expect(getAnalyticsArticlePath("/san-pham")).toBeNull()
    expect(getAnalyticsArticlePath("/")).toBeNull()
  })

  test("getPopularPostKey formats composite category/slug cache key", () => {
    expect(getPopularPostKey("suc-khoe", "bai-viet-1")).toBe("suc-khoe/bai-viet-1")
  })

  test("normalizeSearchQuery trims and collapses multiple spaces", () => {
    expect(normalizeSearchQuery("  tin   tuc   ")).toBe("tin tuc")
  })

  test("createPublishedSearchWhere constructs Prisma search query object with non-draft filters", () => {
    const now = new Date("2026-07-30T00:00:00.000Z")
    const where = createPublishedSearchWhere("thời sự", now)
    expect(where.isDraft).toBe(false)
    expect(where.OR).toBeArray()
    expect(where.OR).toHaveLength(4)
  })

  test("buildStaticNavFallback constructs navigation categories with children tree", () => {
    const nav = buildStaticNavFallback()
    expect(nav.length).toBeGreaterThan(0)
    expect(nav[0].id).toContain("static-")
    expect(nav[0].slug).toBeTruthy()
    expect(nav[0].children).toBeArray()
  })
})
