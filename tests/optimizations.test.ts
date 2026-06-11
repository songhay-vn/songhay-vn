import { beforeEach, describe, expect, mock, test } from "bun:test"

mock.module("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
}))

const mockFindManyPosts = mock()

mock.module("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: mockFindManyPosts,
    },
  },
}))

// Import after mocking
const queries = await import("../lib/queries")

describe("Query optimization tests", () => {
  beforeEach(() => {
    mockFindManyPosts.mockReset()
  })

  test("getRecommendedPosts filters out current post in memory", async () => {
    mockFindManyPosts.mockResolvedValue([
      { id: "post-1", title: "Post 1" },
      { id: "post-2", title: "Post 2" },
      { id: "post-3", title: "Post 3" },
    ])

    const posts = await queries.getRecommendedPosts("post-1", "cat-1", 2)

    // It should filter out "post-1" in memory
    expect(posts.length).toBe(2)
    expect(posts.some((p) => p.id === "post-1")).toBe(false)
    expect(posts[0].id).toBe("post-2")
    expect(posts[1].id).toBe("post-3")
  })
})
