import { describe, expect, test } from "bun:test"
import { formatDateVi, formatDateTimeVi } from "../lib/date-utils"
import * as Queries from "../lib/queries"
import * as Bmi from "../lib/bmi"
import * as Auth from "../lib/session"
import * as SeoStore from "../lib/seo-keyword-store"

describe("Types: Distribution & Re-exports", () => {
  test("lib/queries exports queries module", () => {
    expect(typeof Queries.getHomepageData).toBe("function")
  })

  test("lib/bmi exports BMI calculator functions", () => {
    expect(typeof Bmi.calculateBmi).toBe("function")
  })

  test("lib/session exports session utilities", () => {
    expect(typeof Auth.decodeSession).toBe("function")
  })

  test("lib/seo-keyword-store exports keyword store functions", () => {
    expect(typeof SeoStore.resolveSeoKeywordSelection).toBe("function")
  })
})

describe("Regression: Date Formatting Utilities", () => {
  test("formatDateVi and formatDateTimeVi handle ISO string dates (from cache)", () => {
    const isoString = "2024-04-11T09:37:05.000Z"
    expect(formatDateVi(isoString)).toBe("11/04/2024")
    expect(formatDateTimeVi(isoString)).toContain("11/04/2024")
  })

  test("formatDateVi and formatDateTimeVi handle real Date objects", () => {
    const date = new Date("2024-04-11T09:37:05.000Z")
    expect(formatDateVi(date)).toBe("11/04/2024")
    expect(formatDateTimeVi(date)).toContain("11/04/2024")
  })

  test("formatDateVi and formatDateTimeVi handle null and invalid dates safely", () => {
    expect(formatDateVi(null)).toBe("")
    expect(formatDateTimeVi(undefined)).toBe("")
    expect(formatDateVi("invalid-date")).toBe("")
  })
})
