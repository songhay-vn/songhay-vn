import { describe, expect, test } from "bun:test"
import {
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
} from "../app/admin/actions-helpers"

describe("Admin Actions Helpers", () => {
  describe("getPlainTextFromHtml", () => {
    test("removes HTML tags and normalizes whitespace", () => {
      const html = "<div>  <p>Hello</p>\n\n<p>World</p>  </div>"
      expect(getPlainTextFromHtml(html)).toBe("Hello World")
    })

    test("handles empty or whitespace-only strings", () => {
      expect(getPlainTextFromHtml("")).toBe("")
      expect(getPlainTextFromHtml("   ")).toBe("")
      expect(getPlainTextFromHtml("<p></p>")).toBe("")
    })

    test("preserves text content without tags", () => {
      expect(getPlainTextFromHtml("Just text")).toBe("Just text")
    })
  })

  describe("resolveEditorialFromSubmitAction", () => {
    test("resolves save-draft correctly", () => {
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

    test("resolves publish for ADMIN", () => {
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

    test("resolves submit-review for REPORTER_TRANSLATOR", () => {
      const result = resolveEditorialFromSubmitAction({
        submitAction: "submit-review",
        role: "REPORTER_TRANSLATOR",
      })
      expect(result).toEqual({
        editorialStatus: "PENDING_REVIEW",
        isDraft: false,
        isPublished: false,
      })
    })

    test("falls back to DRAFT for unauthorized publish", () => {
      const result = resolveEditorialFromSubmitAction({
        submitAction: "publish",
        role: "REPORTER_TRANSLATOR",
      })
      expect(result.editorialStatus).toBe("DRAFT")
    })

    test("resolves submit-publish for TEAM_LEAD", () => {
      const result = resolveEditorialFromSubmitAction({
        submitAction: "submit-publish",
        role: "TEAM_LEAD",
      })
      expect(result.editorialStatus).toBe("PENDING_PUBLISH")
    })
  })
})
