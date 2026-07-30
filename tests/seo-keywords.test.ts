import { describe, expect, test } from "bun:test"
import {
  normalizeKeyword,
  parseSeoKeywordInput,
  splitLegacySeoKeywords,
  toKeywordLabel,
} from "@/lib/seo-keywords"

describe("Unit: SEO Keywords Utilities", () => {
  test("normalizeKeyword normalizes whitespace and lowercases string", () => {
    expect(normalizeKeyword("  Tin   Tức   Tốt  ")).toBe("tin tức tốt")
    expect(normalizeKeyword("ABC  DEF")).toBe("abc def")
  })

  test("toKeywordLabel trims and collapses internal spaces", () => {
    expect(toKeywordLabel("   Từ   Khóa   ")).toBe("Từ Khóa")
  })

  test("parseSeoKeywordInput splits by commas, semicolons, pipes, and newlines and dedupes", () => {
    const input = "tin tức, Sức Khỏe; tin tức | Sức Khỏe\nCông Nghệ"
    const parsed = parseSeoKeywordInput(input)
    expect(parsed).toEqual(["tin tức", "Sức Khỏe", "Công Nghệ"])
  })

  test("splitLegacySeoKeywords handles null, undefined, and valid inputs safely", () => {
    expect(splitLegacySeoKeywords(null)).toEqual([])
    expect(splitLegacySeoKeywords(undefined)).toEqual([])
    expect(splitLegacySeoKeywords("  Kenh14, Kenh14  ")).toEqual(["Kenh14"])
  })
})
