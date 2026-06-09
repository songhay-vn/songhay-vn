import { beforeEach, describe, expect, mock, test } from "bun:test"

// Mock next/server and other modules
mock.module("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => {
      const response = new Response(JSON.stringify(data), init)
      Object.defineProperty(response, "json", {
        value: async () => data
      })
      return response
    }
  }
}))

mock.module("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
}))

const mockUpdate = mock()
const mockCreateEngagement = mock()
const mockFindManyPosts = mock()

mock.module("@/lib/prisma", () => ({
  prisma: {
    post: {
      update: mockUpdate,
      findMany: mockFindManyPosts,
    },
    postEngagementEvent: {
      create: mockCreateEngagement,
    },
  },
}))

// Import after mocking
const viewRoute = await import("../app/api/posts/[id]/view/route")
const engagementRoute = await import("../app/api/posts/[id]/engagement/route")
const queries = await import("../lib/queries")

describe("Optimizations & Rate Limiting Tests", () => {
  beforeEach(() => {
    mockUpdate.mockReset()
    mockCreateEngagement.mockReset()
    mockFindManyPosts.mockReset()
  })

  test("Post views API handles rate limiting correctly", async () => {
    mockUpdate.mockResolvedValue({ id: "post-1", slug: "test-slug" })

    // First request - should update database
    const req1 = new Request("http://localhost/api/posts/post-1/view", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" }
    })
    const res1 = await viewRoute.POST(req1 as any, { params: Promise.resolve({ id: "post-1" }) })
    expect(res1.status).toBe(200)
    const body1 = await res1.json()
    expect(body1).toEqual({ ok: true })
    expect(mockUpdate.mock.calls.length).toBe(1)

    // Second request from same IP within window - should bypass database write
    const req2 = new Request("http://localhost/api/posts/post-1/view", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" }
    })
    const res2 = await viewRoute.POST(req2 as any, { params: Promise.resolve({ id: "post-1" }) })
    expect(res2.status).toBe(200)
    const body2 = await res2.json()
    expect(body2).toEqual({ ok: true, throttled: true })
    expect(mockUpdate.mock.calls.length).toBe(1) // Still 1

    // Request from different IP - should update database
    const req3 = new Request("http://localhost/api/posts/post-1/view", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.5" }
    })
    const res3 = await viewRoute.POST(req3 as any, { params: Promise.resolve({ id: "post-1" }) })
    expect(res3.status).toBe(200)
    const body3 = await res3.json()
    expect(body3).toEqual({ ok: true })
    expect(mockUpdate.mock.calls.length).toBe(2)
  })

  test("Engagement API rate limits and removes redundant read", async () => {
    mockCreateEngagement.mockResolvedValue({ id: "event-1" })

    // First request - should write to DB
    const req1 = new Request("http://localhost/api/posts/post-1/engagement", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4", "Content-Type": "application/json" },
      body: JSON.stringify({ dwellSeconds: 15 })
    })
    const res1 = await engagementRoute.POST(req1 as any, { params: Promise.resolve({ id: "post-1" }) })
    expect(res1.status).toBe(200)
    const body1 = await res1.json()
    expect(body1).toEqual({ ok: true })
    expect(mockCreateEngagement.mock.calls.length).toBe(1)

    // Second request from same IP within window - should bypass database write
    const req2 = new Request("http://localhost/api/posts/post-1/engagement", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4", "Content-Type": "application/json" },
      body: JSON.stringify({ dwellSeconds: 20 })
    })
    const res2 = await engagementRoute.POST(req2 as any, { params: Promise.resolve({ id: "post-1" }) })
    expect(res2.status).toBe(200)
    const body2 = await res2.json()
    expect(body2).toEqual({ ok: true, throttled: true })
    expect(mockCreateEngagement.mock.calls.length).toBe(1) // Still 1
  })

  test("getRecommendedPosts filters out current post in memory", async () => {
    mockFindManyPosts.mockResolvedValue([
      { id: "post-1", title: "Post 1" },
      { id: "post-2", title: "Post 2" },
      { id: "post-3", title: "Post 3" }
    ])

    const posts = await queries.getRecommendedPosts("post-1", "cat-1", 2)
    
    // It should filter out "post-1" in memory
    expect(posts.length).toBe(2)
    expect(posts.some((p) => p.id === "post-1")).toBe(false)
    expect(posts[0].id).toBe("post-2")
    expect(posts[1].id).toBe("post-3")
  })
})
