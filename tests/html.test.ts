import { describe, it, expect } from "bun:test"
import { normalizeArticleHtml } from "../lib/html"

describe("normalizeArticleHtml", () => {
  it("should preserve hyperlinks with href and target attributes", () => {
    const input = `<a href="https://example.com" style="text-decoration:none;" target="_blank">test</a>`
    const output = normalizeArticleHtml(input)

    // We expect href and target to be preserved, and inline style might change depending on whitelist
    expect(output).toContain('href="https://example.com"')
    expect(output).toContain('target="_blank"')
  })

  it("should not break a inside span", () => {
    const input = `<span style="color:#000;"><a href="/test">link</a></span>`
    const output = normalizeArticleHtml(input)
    expect(output).toContain('href="/test"')
    expect(output).toContain('<a')
    expect(output).toContain('</a>')
  })

  it("should not break span inside a", () => {
    const input = `<a href="/test"><span style="color:#000;">link</span></a>`
    const output = normalizeArticleHtml(input)
    expect(output).toContain('href="/test"')
    expect(output).toContain('<a')
    expect(output).toContain('</a>')
  })

  it("should handle anchor with random attributes", () => {
    const input = `<a data-something="1" href="/test" aria-label="test">link</a>`
    const output = normalizeArticleHtml(input)
    expect(output).toContain('href="/test"')
    expect(output).toContain('data-something="1"')
  })

  it("should not strip spaces between inline tags like links", () => {
    const input = `<p>This is <strong>bold</strong> <a href="/test">link</a>.</p>`
    const output = normalizeArticleHtml(input)
    expect(output).toBe(`<p>This is <strong>bold</strong> <a href="/test">link</a>.</p>`)
  })
})

describe("normalizeArticleHtml – HTML nesting repair (hydration safety)", () => {
  it("should move figure out of p (React insertBefore crash case)", () => {
    // CKEditor output: <p><figure>...</figure></p> → browser splits it
    const input = `<p>Before<figure class="image"><img src="test.jpg" /></figure>After</p>`
    const output = normalizeArticleHtml(input)
    // figure must NOT be inside p
    expect(output).not.toMatch(/<p[^>]*>[^<]*<figure/)
    // both figure and the surrounding text should still exist
    expect(output).toContain("<figure")
    expect(output).toContain("Before")
    expect(output).toContain("After")
  })

  it("should move table out of p", () => {
    const input = `<p>Intro<table><tr><td>cell</td></tr></table>Outro</p>`
    const output = normalizeArticleHtml(input)
    expect(output).not.toMatch(/<p[^>]*>[^<]*<table/)
    expect(output).toContain("<table")
    expect(output).toContain("cell")
  })

  it("should move ul/ol out of p", () => {
    const inputUl = `<p>List:<ul><li>item</li></ul></p>`
    const outputUl = normalizeArticleHtml(inputUl)
    expect(outputUl).not.toMatch(/<p[^>]*>[^<]*<ul/)
    expect(outputUl).toContain("<ul")
    expect(outputUl).toContain("item")

    const inputOl = `<p>Numbered:<ol><li>one</li></ol></p>`
    const outputOl = normalizeArticleHtml(inputOl)
    expect(outputOl).not.toMatch(/<p[^>]*>[^<]*<ol/)
    expect(outputOl).toContain("<ol")
    expect(outputOl).toContain("one")
  })

  it("should move div out of p", () => {
    const input = `<p>Text<div class="box">content</div>More</p>`
    const output = normalizeArticleHtml(input)
    expect(output).not.toMatch(/<p[^>]*>[^<]*<div/)
    expect(output).toContain("<div")
    expect(output).toContain("content")
  })

  it("should leave valid nesting intact", () => {
    // strong, em, a, span, u, s are all valid inline children of p
    const input = `<p>This is <strong>bold</strong> and <em>italic</em> with a <a href="/test">link</a>.</p>`
    const output = normalizeArticleHtml(input)
    expect(output).toContain("<strong>bold</strong>")
    expect(output).toContain("<em>italic</em>")
    expect(output).toContain('href="/test"')
  })
})
