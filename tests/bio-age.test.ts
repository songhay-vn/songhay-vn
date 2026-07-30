import { describe, expect, test } from "bun:test"

import {
  calculateEstimatedBioAge,
  getAgeGroup,
  getBioAgeResult,
} from "../lib/bio-age"

describe("Unit: Biological age helper", () => {
  test("turns a younger result delta into a concrete age range", () => {
    const result = getBioAgeResult(4)
    const estimated = calculateEstimatedBioAge(50, result)

    expect(result.key).toBe("YOUNGER")
    expect(estimated).toEqual({
      min: 45,
      max: 48,
      label: "45-48 tuổi",
    })
  })

  test("handles open-ended fast-aging results", () => {
    const result = getBioAgeResult(30)
    const estimated = calculateEstimatedBioAge(50, result)

    expect(result.key).toBe("FAST_AGING")
    expect(estimated).toEqual({
      min: 57,
      max: null,
      label: "từ 57 tuổi trở lên",
    })
  })

  test("handles BALANCED and RECOVERY score ranges", () => {
    const balanced = getBioAgeResult(15)
    expect(balanced.key).toBe("BALANCED")

    const recovery = getBioAgeResult(22)
    expect(recovery.key).toBe("RECOVERY")
  })

  test("handles single-point age ranges where min === max", () => {
    const estimated = calculateEstimatedBioAge(20, { deltaMin: 5, deltaMax: 5 })
    expect(estimated).toEqual({
      min: 25,
      max: 25,
      label: "25 tuổi",
    })
  })

  test("maps ages into CMS insight buckets", () => {
    expect(getAgeGroup(17)).toBe("1-17")
    expect(getAgeGroup(24)).toBe("18-24")
    expect(getAgeGroup(34)).toBe("25-34")
    expect(getAgeGroup(44)).toBe("35-44")
    expect(getAgeGroup(54)).toBe("45-54")
    expect(getAgeGroup(64)).toBe("55-64")
    expect(getAgeGroup(65)).toBe("65+")
  })
})
