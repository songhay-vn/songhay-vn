import { describe, expect, test, beforeEach } from "bun:test"
import { memoizeWithTtl, clearDataCache } from "../lib/data-cache"

describe("Unit: Data Cache (memoizeWithTtl)", () => {
  beforeEach(() => {
    clearDataCache()
  })

  test("memoizes a value and returns it from cache on subsequent calls", async () => {
    let callCount = 0
    const loader = async () => {
      callCount++
      return "data-" + callCount
    }

    const first = await memoizeWithTtl("key-1", 60, loader)
    expect(first).toBe("data-1")
    expect(callCount).toBe(1)

    const second = await memoizeWithTtl("key-1", 60, loader)
    expect(second).toBe("data-1")
    expect(callCount).toBe(1)
  })

  test("expires cache after TTL", async () => {
    let callCount = 0
    const loader = async () => {
      callCount++
      return "data-" + callCount
    }

    // Use a very short TTL or manually manipulate the cache if possible
    // But since we can't easily manipulate Date.now() in bun:test without a mock
    // we'll just test the logic with TTL=0
    await memoizeWithTtl("key-2", 0, loader)
    expect(callCount).toBe(1)

    // Wait a tiny bit to ensure it expires (it should be expired immediately with TTL=0)
    await new Promise(resolve => setTimeout(resolve, 10))

    await memoizeWithTtl("key-2", 60, loader)
    expect(callCount).toBe(2)
  })

  test("deduplicates in-flight requests", async () => {
    let callCount = 0
    const loader = async () => {
      callCount++
      await new Promise(resolve => setTimeout(resolve, 50))
      return "data-" + callCount
    }

    const [first, second] = await Promise.all([
      memoizeWithTtl("key-3", 60, loader),
      memoizeWithTtl("key-3", 60, loader)
    ])

    expect(first).toBe("data-1")
    expect(second).toBe("data-1")
    expect(callCount).toBe(1)
  })

  test("handles loader errors correctly", async () => {
    const loader = async () => {
      throw new Error("loading failed")
    }

    await expect(memoizeWithTtl("key-4", 60, loader)).rejects.toThrow("loading failed")
    
    // In-flight entry should be deleted on error
    let callCount = 0
    const nextLoader = async () => {
      callCount++
      return "recovered"
    }
    
    const result = await memoizeWithTtl("key-4", 60, nextLoader)
    expect(result).toBe("recovered")
    expect(callCount).toBe(1)
  })

  test("clears cache by prefix", async () => {
    await memoizeWithTtl("user-1", 60, async () => "u1")
    await memoizeWithTtl("user-2", 60, async () => "u2")
    await memoizeWithTtl("post-1", 60, async () => "p1")

    clearDataCache("user-")

    let callCount = 0
    const u1result = await memoizeWithTtl("user-1", 60, async () => {
      callCount++
      return "u1-new"
    })
    expect(u1result).toBe("u1-new")
    expect(callCount).toBe(1)

    const p1result = await memoizeWithTtl("post-1", 60, async () => {
      return "p1-broken"
    })
    expect(p1result).toBe("p1") // Still from cache
  })
})
