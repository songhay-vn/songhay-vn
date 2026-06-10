import { beforeEach, describe, expect, mock, test } from "bun:test"

// Mock next/server and other modules
mock.module("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const response = new Response(JSON.stringify(data), init)
      Object.defineProperty(response, "json", {
        value: async () => data,
      })
      return response
    },
  },
}))

mock.module("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
}))

const mockUpdate = mock()
const mockFindManyPosts = mock()

mock.module("@/lib/prisma", () => ({
  prisma: {
    post: {
      update: mockUpdate,
      findMany: mockFindManyPosts,
    },
  },
}))

// Import after mocking
const viewRoute = await import("../app/api/posts/[id]/view/route")
const queries = await import("../lib/queries")

type ViewPostRequest = Parameters<typeof viewRoute.POST>[0]
type ViewPostContext = Parameters<typeof viewRoute.POST>[1]

function createViewRequest(ip: string) {
  return new Request("http://localhost/api/posts/post-1/view", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  }) as ViewPostRequest
}

function createViewContext() {
  return {
    params: Promise.resolve({ id: "post-1" }),
  } satisfies ViewPostContext
}

describe("Optimizations & Rate Limiting Tests", () => {
  beforeEach(() => {
    mockUpdate.mockReset()
    mockFindManyPosts.mockReset()
  })

  test("Post views API handles rate limiting correctly", async () => {
    mockUpdate.mockResolvedValue({ id: "post-1", slug: "test-slug" })

    // First request - should update database
    const res1 = await viewRoute.POST(
      createViewRequest("1.2.3.4"),
      createViewContext()
    )
    expect(res1.status).toBe(200)
    const body1 = await res1.json()
    expect(body1).toEqual({ ok: true })
    expect(mockUpdate.mock.calls.length).toBe(1)

    // Second request from same IP within window - should bypass database write
    const res2 = await viewRoute.POST(
      createViewRequest("1.2.3.4"),
      createViewContext()
    )
    expect(res2.status).toBe(200)
    const body2 = await res2.json()
    expect(body2).toEqual({ ok: true, throttled: true })
    expect(mockUpdate.mock.calls.length).toBe(1) // Still 1

    // Request from different IP - should update database
    const res3 = await viewRoute.POST(
      createViewRequest("1.2.3.5"),
      createViewContext()
    )
    expect(res3.status).toBe(200)
    const body3 = await res3.json()
    expect(body3).toEqual({ ok: true })
    expect(mockUpdate.mock.calls.length).toBe(2)
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
