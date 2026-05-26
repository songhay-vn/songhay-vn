import { describe, expect, test } from "bun:test"
import { uniqueSlug } from "../app/admin/actions-helpers"

describe("Unit: uniqueSlug", () => {
  test("returns base if not taken", async () => {
    const result = await uniqueSlug("Hello World", async () => false)
    expect(result).toBe("hello-world")
  })

  test("appends -2 suffix if base is taken", async () => {
    let calls = 0
    const result = await uniqueSlug("Hello World", async (slug) => {
      calls++
      if (slug === "hello-world") return true
      return false
    })
    expect(result).toBe("hello-world-2")
    expect(calls).toBe(2)
  })

  test("increments suffix until unique", async () => {
    const taken = ["hello-world", "hello-world-2", "hello-world-3"]
    const result = await uniqueSlug("Hello World", async (slug) => taken.includes(slug))
    expect(result).toBe("hello-world-4")
  })

  test("handles already slugified input", async () => {
    const result = await uniqueSlug("already-slugified", async () => false)
    expect(result).toBe("already-slugified")
  })
})
