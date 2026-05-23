import { describe, expect, test, afterEach } from "bun:test"
import { getSiteUrl, toAbsoluteUrl } from "../lib/seo"
import {
  buildAutoSeoDescription,
  buildAutoSeoTitle,
  resolvePostSeoInput,
} from "../lib/post-seo"

describe("Unit: SEO Utilities", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv
  })

  test("getSiteUrl returns default when env is not set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe("https://songhay.vn")
  })

  test("getSiteUrl returns env value when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
    expect(getSiteUrl()).toBe("https://example.com")
  })

  test("getSiteUrl trims trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/"
    expect(getSiteUrl()).toBe("https://example.com")
  })

  test("toAbsoluteUrl returns same if already absolute", () => {
    expect(toAbsoluteUrl("https://other.com/page")).toBe(
      "https://other.com/page"
    )
    expect(toAbsoluteUrl("http://other.com/page")).toBe("http://other.com/page")
  })

  test("toAbsoluteUrl prepends site URL to paths", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://mysite.com"

    expect(toAbsoluteUrl("/test-path")).toBe("https://mysite.com/test-path")
    expect(toAbsoluteUrl("no-slash-path")).toBe(
      "https://mysite.com/no-slash-path"
    )
  })
})

describe("Unit: Post SEO Autofill", () => {
  test("buildAutoSeoTitle appends brand for concise titles", () => {
    expect(buildAutoSeoTitle({ title: "Gia vang hom nay tang manh" })).toBe(
      "Gia vang hom nay tang manh | Songhay.vn"
    )
  })

  test("buildAutoSeoTitle trims long titles without duplicating brand", () => {
    const result = buildAutoSeoTitle({
      title:
        "Ban tin gia vang hom nay tang manh tren thi truong trong nuoc va quoc te | Songhay.vn",
    })

    expect(result).not.toContain("| Songhay.vn | Songhay.vn")
    expect(result.length).toBeLessThanOrEqual(60)
  })

  test("buildAutoSeoDescription extends short excerpts with article content", () => {
    const result = buildAutoSeoDescription({
      title: "Gia vang hom nay",
      excerpt: "Cap nhat nhanh dien bien gia vang trong nuoc.",
      content:
        "<p>Chuyen gia du bao bien do van lon trong cac phien toi khi thi truong tiep tuc bien dong.</p>",
    })

    expect(result).toContain("Cap nhat nhanh dien bien gia vang trong nuoc")
    expect(result).toContain("Chuyen gia du bao bien do van lon")
    expect(result.length).toBeLessThanOrEqual(155)
  })

  test("resolvePostSeoInput preserves manual values and auto-fills blanks", () => {
    const manual = resolvePostSeoInput({
      title: "Gia vang hom nay",
      excerpt: "Cap nhat gia vang moi nhat trong ngay.",
      content: "<p>Noi dung mo rong.</p>",
      seoTitle: "Tieu de SEO thu cong",
      seoDescription: "Mo ta SEO thu cong",
    })

    expect(manual.seoTitle).toBe("Tieu de SEO thu cong")
    expect(manual.seoDescription).toBe("Mo ta SEO thu cong")

    const auto = resolvePostSeoInput({
      title: "Gia vang hom nay",
      excerpt: "Cap nhat gia vang moi nhat trong ngay.",
      content: "<p>Noi dung mo rong.</p>",
      seoTitle: "",
      seoDescription: "",
    })

    expect(auto.seoTitle).toBe("Gia vang hom nay | Songhay.vn")
    expect(auto.seoDescription).toContain(
      "Cap nhat gia vang moi nhat trong ngay"
    )
  })
})
