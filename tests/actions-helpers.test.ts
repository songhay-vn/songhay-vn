import { describe, expect, test, mock } from "bun:test"

mock.module("next/cache", () => ({
  revalidateTag: () => {},
  revalidatePath: () => {},
  updateTag: () => {},
}))

mock.module("next/server", () => ({
  after: (task: () => void) => {
    task()
  },
}))

import {
  ensurePermission,
  getPlainTextFromHtml,

  revalidatePost,
  revalidatePostTagsOnly,
  resolveEditorialFromSubmitAction,
  uniqueCategorySlug,
  uniquePostSlug,
  uniqueSlug,
} from "@/app/admin/actions-helpers"
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors"

describe("Unit: Action Helpers & Prisma Error Utilities", () => {
  test("ensurePermission does not throw when condition is true", () => {
    expect(() => ensurePermission(true, "/admin")).not.toThrow()
  })

  test("ensurePermission throws Next.js redirect when condition is false", () => {
    expect(() => ensurePermission(false, "/login")).toThrow()
  })

  test("resolveEditorialFromSubmitAction resolves DRAFT status for save-draft action", () => {
    const result = resolveEditorialFromSubmitAction({
      submitAction: "save-draft",
      role: "REPORTER_TRANSLATOR",
    })
    expect(result).toEqual({
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
    })
  })

  test("resolveEditorialFromSubmitAction resolves PUBLISHED for publish action when user has permission", () => {
    const result = resolveEditorialFromSubmitAction({
      submitAction: "publish",
      role: "ADMIN",
    })
    expect(result).toEqual({
      editorialStatus: "PUBLISHED",
      isDraft: false,
      isPublished: true,
    })
  })

  test("getPlainTextFromHtml strips HTML tags and normalizes whitespace", () => {
    const html = "<p>Bài viết <strong>tin tức</strong> hàng ngày.</p>"
    expect(getPlainTextFromHtml(html)).toBe("Bài viết tin tức hàng ngày.")
  })

  test("uniqueSlug generates collision-free slug using lookup callback", async () => {
    const takenSlugs = new Set(["tin-tuc", "tin-tuc-2"])
    const slug = await uniqueSlug("Tin Tức", async (candidate) => takenSlugs.has(candidate))
    expect(slug).toBe("tin-tuc-3")
  })

  test("uniqueCategorySlug and uniquePostSlug generate unique slugs", async () => {
    const categorySlug = await uniqueCategorySlug("Danh Mục Mới 123")
    expect(categorySlug).toBe("danh-muc-moi-123")

    const postSlug = await uniquePostSlug("Bài Viết Mới 123")
    expect(postSlug).toBe("bai-viet-moi-123")
  })


  test("revalidatePostTagsOnly executes tag invalidations safely", () => {
    expect(() => revalidatePostTagsOnly("bai-viet-test")).not.toThrow()
    expect(() => revalidatePostTagsOnly()).not.toThrow()
  })

  test("revalidatePost executes cache invalidation options safely", async () => {
    await expect(
      revalidatePost("bai-viet-test", undefined, {
        isVisibilityChange: true,
        isTrendingChange: true,
        isFeaturedChange: true,
        isVideoChange: true,
      })
    ).resolves.toBeUndefined()
  })

  test("isPrismaSchemaMismatchError identifies P2021 and P2022 error codes", () => {
    expect(isPrismaSchemaMismatchError({ code: "P2021" })).toBe(true)
    expect(isPrismaSchemaMismatchError({ code: "P2022" })).toBe(true)
    expect(isPrismaSchemaMismatchError({ code: "P2002" })).toBe(false)
  })

  test("isPrismaSchemaMismatchError identifies error messages containing missing table/relation text", () => {
    const err1 = new Error("table `public.BioAgeSubmission` does not exist")
    const err2 = new Error('relation "BioAgeSubmission" does not exist')
    expect(isPrismaSchemaMismatchError(err1)).toBe(true)
    expect(isPrismaSchemaMismatchError(err2)).toBe(true)
    expect(isPrismaSchemaMismatchError(new Error("Connection timeout"))).toBe(false)
    expect(isPrismaSchemaMismatchError(null)).toBe(false)
  })
})
