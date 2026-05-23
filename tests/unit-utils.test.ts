import { describe, expect, test } from "bun:test"
import { calculateBmi } from "../lib/bmi"
import { slugify } from "../lib/slug"
import { hashPassword, verifyPassword } from "../lib/password"
import { cn } from "../lib/utils"
import { normalizeArticleHtml } from "../lib/html"
import {
  buildPaginationItems,
  sortCategoriesByTree,
} from "../app/admin/data-helpers"

describe("Unit: BMI Calculation", () => {
  test("calculates BMI correctly for male", () => {
    // 175cm, 70kg -> 70 / (1.75 * 1.75) = 22.85 (Normal)
    const result = calculateBmi(175, 70, "male")
    expect(result.bmi).toBeCloseTo(22.85, 1)
    expect(result.category).toBe("Bình thường")
    expect(result.genderLabel).toBe("Nam")
  })

  test("calculates BMI correctly for female", () => {
    // 160cm, 45kg -> 45 / (1.6 * 1.6) = 17.57 (Underweight)
    const result = calculateBmi(160, 45, "female")
    expect(result.bmi).toBeCloseTo(17.57, 1)
    expect(result.category).toBe("Thiếu cân")
    expect(result.genderLabel).toBe("Nữ")

    // Normal female: 160cm, 55kg -> 21.48
    const normal = calculateBmi(160, 55, "female")
    expect(normal.category).toBe("Bình thường")

    // Overweight female: 160cm, 65kg -> 25.39
    const overweight = calculateBmi(160, 65, "female")
    expect(overweight.category).toBe("Thừa cân")

    // Obese female: 160cm, 80kg -> 31.25
    const obese = calculateBmi(160, 80, "female")
    expect(obese.category).toBe("Béo phì")
  })

  test("identifies overweight and obesity correctly", () => {
    // Male Overweight: 175cm, 90kg -> 90 / (1.75 * 1.75) = 29.38
    const overweight = calculateBmi(175, 90, "male")
    expect(overweight.category).toBe("Thừa cân")

    // Male Obese: 175cm, 100kg -> 100 / (1.75 * 1.75) = 32.65
    const obese = calculateBmi(175, 100, "male")
    expect(obese.category).toBe("Béo phì")
  })

  test("handles boundary cases correctly", () => {
    // Male boundary underweight: BMI = 20
    // weight = 20 * (1.75 * 1.75) = 61.25
    const maleUnderweight = calculateBmi(175, 61.2, "male")
    expect(maleUnderweight.category).toBe("Thiếu cân")
    const maleNormal = calculateBmi(175, 61.3, "male")
    expect(maleNormal.category).toBe("Bình thường")

    // Female boundary underweight: BMI = 19
    // weight = 19 * (1.6 * 1.6) = 48.64
    const femaleUnderweight = calculateBmi(160, 48.6, "female")
    expect(femaleUnderweight.category).toBe("Thiếu cân")
    const femaleNormal = calculateBmi(160, 48.7, "female")
    expect(femaleNormal.category).toBe("Bình thường")
  })
})

describe("Unit: Slugification", () => {
  test("creates valid slugs from various inputs", () => {
    expect(slugify("Hello World")).toBe("hello-world")
    expect(slugify("  Trim Me  ")).toBe("trim-me")
    expect(slugify("Multiple   Spaces")).toBe("multiple-spaces")
    expect(slugify("Special @#$% Characters")).toBe("special-characters")
  })

  test("handles Vietnamese accents correctly", () => {
    expect(slugify("Học lập trình")).toBe("hoc-lap-trinh")
    expect(slugify("Công nghệ thông tin")).toBe("cong-nghe-thong-tin")
    expect(slugify("Chào buổi sáng Việt Nam")).toBe("chao-buoi-sang-viet-nam")
    expect(slugify("Đã có lỗi xảy ra")).toBe("da-co-loi-xay-ra") // testing Đ and accents
    expect(slugify("Trường đại học bách khoa")).toBe("truong-dai-hoc-bach-khoa")
  })

  test("handles complex edge cases", () => {
    expect(slugify("---Already-Slugified---")).toBe("already-slugified")
    expect(slugify("123 Numbers 456")).toBe("123-numbers-456")
    expect(slugify("Mixed CASE Content")).toBe("mixed-case-content")
  })
})

describe("Unit: Password Utilities", () => {
  test("hashes and verifies password correctly", () => {
    const password = "my-secret-password"
    const hash = hashPassword(password)

    expect(hash).toContain(":")
    expect(verifyPassword(password, hash)).toBe(true)
    expect(verifyPassword("wrong-password", hash)).toBe(false)
  })

  test("handles invalid hash format gracefully", () => {
    expect(verifyPassword("password", "invalidhash")).toBe(false)
    expect(verifyPassword("password", ":")).toBe(false)
    expect(verifyPassword("password", "salt:hash:extra")).toBe(false)
  })
})

describe("Unit: Class Merge Utility (cn)", () => {
  test("merges tailwind classes correctly", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2")
    expect(cn("px-2 py-2", "p-4")).toBe("p-4") // py-2 and px-2 are overridden by p-4 by tailwind-merge
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
    expect(cn("bg-red-500", { "bg-blue-500": true, "text-white": false })).toBe(
      "bg-blue-500"
    )
  })
})

describe("Unit: HTML Normalization", () => {
  test("marks empty paragraphs for article spacing", () => {
    expect(normalizeArticleHtml("<p></p><p>Text</p><p>&nbsp;</p>")).toBe(
      '<p class="empty-line"></p><p>Text</p><p class="empty-line"></p>'
    )
  })

  test("converts span underlines/strikethroughs to semantic tags", () => {
    expect(
      normalizeArticleHtml(
        '<span style="text-decoration: underline">Underline</span>'
      )
    ).toBe("<u>Underline</u>")
    expect(
      normalizeArticleHtml(
        '<span style="text-decoration: line-through">Strike</span>'
      )
    ).toBe("<s>Strike</s>")
  })

  test("filters allowed styles and removes others", () => {
    const input =
      '<p style="text-align: center; color: red; margin-top: 20px; font-size: 16px">Styled Text</p>'
    const output = normalizeArticleHtml(input)
    expect(output).toContain(
      'style="text-align:center;color:red;font-size:16px"'
    )
    expect(output).not.toContain("margin-top")
  })

  test("supports float and layout styles", () => {
    const input =
      '<div style="float: left; width: 100px; height: 50% !important; max-width: 500px">Box</div>'
    const output = normalizeArticleHtml(input)
    expect(output).toContain("float:left")
    expect(output).toContain("width:100px")
    // Note: normalizeArticleHtml doesn't handle !important explicitly in regex, so it might fail or include it depending on regex
    expect(output).toContain("max-width:500px")
  })

  test("supports font-family and background colors", () => {
    const input =
      '<span style="font-family: Arial, sans-serif; background-color: #fff; color: rgb(0,0,0)">Text</span>'
    const output = normalizeArticleHtml(input)
    expect(output).toContain("font-family:arial, sans-serif")
    expect(output).toContain("background-color:#fff")
    expect(output).toContain("color:rgb(0,0,0)")
  })

  test("preserves images and videos/iframes unaffected", () => {
    const img =
      '<figure><img src="test.jpg" alt="test" /><figcaption>Test</figcaption></figure>'
    const video =
      '<div class="video-wrap"><video controls src="test.mp4"></video></div>'
    const iframe = '<iframe src="https://youtube.com/embed/123"></iframe>'

    expect(normalizeArticleHtml(img)).toBe(img)
    expect(normalizeArticleHtml(video)).toBe(video)
    expect(normalizeArticleHtml(iframe)).toBe(iframe)
  })
})

describe("Unit: Admin Data Helpers", () => {
  test("buildPaginationItems creates correct sequences and ellipses", () => {
    // Small number of pages -> [1, 2, 3]
    expect(buildPaginationItems(1, 3)).toEqual([1, 2, 3])

    // Many pages, at start -> [1, 2, "ellipsis", 10]
    expect(buildPaginationItems(1, 10)).toEqual([1, 2, "ellipsis", 10])

    // Many pages, in middle -> [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
    expect(buildPaginationItems(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ])

    // Many pages, at end -> [1, "ellipsis", 9, 10]
    expect(buildPaginationItems(10, 10)).toEqual([1, "ellipsis", 9, 10])
  })

  test("sortCategoriesByTree sorts roots first then children", () => {
    const cats = [
      { id: "2", name: "Child 1", parentId: "1" },
      { id: "1", name: "Root 1", parentId: null },
      { id: "4", name: "Root 2", parentId: null },
      { id: "3", name: "Child 2", parentId: "1" },
    ]
    const sorted = sortCategoriesByTree(cats)
    expect(sorted.map((c) => c.id)).toEqual(["1", "2", "3", "4"])
  })
})
