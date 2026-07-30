import { describe, expect, test } from "bun:test"
import { resolveSeoKeywordSelectionForPreview } from "@/lib/seo-keyword-store"

describe("Unit: SEO Keyword Store", () => {
  test("resolveSeoKeywordSelectionForPreview extracts manual keywords from FormData without DB query", async () => {
    const formData = new FormData()
    formData.append("seoKeywords", "Thời sự, Sức khỏe")

    const result = await resolveSeoKeywordSelectionForPreview(formData)
    expect(result).toEqual({
      keywordIds: [],
      seoKeywordsText: "Thời sự, Sức khỏe",
    })
  })

  test("resolveSeoKeywordSelectionForPreview handles empty form data", async () => {
    const formData = new FormData()
    const result = await resolveSeoKeywordSelectionForPreview(formData)
    expect(result).toEqual({
      keywordIds: [],
      seoKeywordsText: null,
    })
  })
})
