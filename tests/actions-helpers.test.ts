import { describe, expect, test } from "bun:test"
import { ensurePermission, resolveEditorialFromSubmitAction } from "@/app/admin/actions-helpers"
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
