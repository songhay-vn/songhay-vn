import { describe, expect, test } from "bun:test"
import {
  buildPaginationItems,
  endOfDay,
  parseDateInput,
  sortCategoriesByTree,
  startOfDay,
  toDayKey,
  toDayLabel,
} from "@/app/admin/data-helpers"

describe("Unit: Data Helpers", () => {
  test("buildPaginationItems creates numeric arrays for small totalPages <= 7", () => {
    expect(buildPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPaginationItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test("buildPaginationItems inserts ellipsis for large totalPages with gaps", () => {
    expect(buildPaginationItems(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10])
    expect(buildPaginationItems(1, 10)).toEqual([1, 2, "ellipsis", 10])
    expect(buildPaginationItems(10, 10)).toEqual([1, "ellipsis", 9, 10])
  })

  test("startOfDay sets hours to 00:00:00.000", () => {
    const d = new Date("2026-06-15T15:30:45.123Z")
    const start = startOfDay(d)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  test("endOfDay sets hours to 23:59:59.999", () => {
    const d = new Date("2026-06-15T08:10:20.000Z")
    const end = endOfDay(d)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })

  test("parseDateInput handles valid ISO strings and returns null for invalid inputs", () => {
    expect(parseDateInput(null)).toBeNull()
    expect(parseDateInput("  ")).toBeNull()
    expect(parseDateInput("invalid-date-str")).toBeNull()
    const valid = parseDateInput("2026-07-30")
    expect(valid).toBeInstanceOf(Date)
    expect(valid?.getFullYear()).toBe(2026)
  })

  test("toDayKey formats date as YYYY-MM-DD", () => {
    const d = new Date(2026, 6, 5) // July 5, 2026
    expect(toDayKey(d)).toBe("2026-07-05")
  })

  test("toDayLabel returns localized Vietnamese date string", () => {
    const d = new Date(2026, 6, 5)
    expect(toDayLabel(d)).toBeTruthy()
    expect(typeof toDayLabel(d)).toBe("string")
  })

  test("sortCategoriesByTree places root categories first followed by their child categories", () => {
    const categories = [
      { id: "child-1", parentId: "root-1" },
      { id: "root-2", parentId: null },
      { id: "root-1", parentId: null },
      { id: "child-2", parentId: "root-2" },
    ]
    const sorted = sortCategoriesByTree(categories)
    expect(sorted.map((c) => c.id)).toEqual(["root-2", "child-2", "root-1", "child-1"])
  })
})
