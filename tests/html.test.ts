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
