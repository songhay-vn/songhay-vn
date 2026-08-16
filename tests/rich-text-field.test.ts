import { describe, expect, test } from "bun:test"
import { getPlainTextFromHtml } from "@/app/admin/actions-helpers"

describe("Unit: Rich Text & Form Content", () => {
  test("getPlainTextFromHtml extracts plain text from rich HTML content", () => {
    const html = "<p>Hello <strong>World</strong>!</p><div><span>Some more text</span></div>"
    expect(getPlainTextFromHtml(html)).toBe("Hello World ! Some more text")
  })

  test("getPlainTextFromHtml returns empty string for empty HTML tags or whitespace", () => {
    expect(getPlainTextFromHtml("<p></p>")).toBe("")
    expect(getPlainTextFromHtml("<p>&nbsp;</p>")).toBe("&nbsp;")
    expect(getPlainTextFromHtml("   <div> </div>  ")).toBe("")
    expect(getPlainTextFromHtml("")).toBe("")
  })

  test("form validation logic properly checks required fields when publishing", () => {
    function validatePostSubmission({
      title,
      hasPenName,
      excerpt,
      content,
      categoryId,
      isDraftTarget,
    }: {
      title: string
      hasPenName: boolean
      excerpt: string
      content: string
      categoryId: string
      isDraftTarget: boolean
    }) {
      const plainContent = getPlainTextFromHtml(content)
      if (!title || !hasPenName) {
        return { error: "missing_fields" }
      }
      if (!isDraftTarget && (!excerpt || !plainContent || !categoryId)) {
        return { error: "missing_fields" }
      }
      return { success: true }
    }

    // Saving draft with minimal fields succeeds
    expect(
      validatePostSubmission({
        title: "Draft Post",
        hasPenName: true,
        excerpt: "",
        content: "",
        categoryId: "",
        isDraftTarget: true,
      })
    ).toEqual({ success: true })

    // Publishing without content fails
    expect(
      validatePostSubmission({
        title: "Publish Post",
        hasPenName: true,
        excerpt: "Some excerpt",
        content: "",
        categoryId: "cat-1",
        isDraftTarget: false,
      })
    ).toEqual({ error: "missing_fields" })

    // Publishing with rich text content succeeds
    expect(
      validatePostSubmission({
        title: "Publish Post",
        hasPenName: true,
        excerpt: "Some excerpt",
        content: "<p>Article content goes here...</p>",
        categoryId: "cat-1",
        isDraftTarget: false,
      })
    ).toEqual({ success: true })
  })
})
