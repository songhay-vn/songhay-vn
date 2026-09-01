import { describe, expect, test, mock, beforeEach } from "bun:test"

// Mock Prisma
const mockUpdate = mock(() => Promise.resolve({ id: "prod-1" }))

mock.module("@/lib/prisma", () => ({
  prisma: {
    product: {
      update: mockUpdate,
    },
  },
}))

const { POST } = await import("@/app/api/products/track/route")

describe("Unit: Product & VietGift Tracking API", () => {
  beforeEach(() => {
    mockUpdate.mockClear()
  })

  test("POST /api/products/track increments viewCount for view event", async () => {
    const req = new Request("http://localhost/api/products/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "prod-1",
        eventType: "view",
      }),
    })

    const response = await POST(req as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json).toEqual({ success: true })

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { viewCount: { increment: 1 } },
      select: { id: true },
    })
  })

  test("POST /api/products/track increments zaloClickCount for zalo_click event", async () => {
    const req = new Request("http://localhost/api/products/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "prod-1",
        eventType: "zalo_click",
      }),
    })

    const response = await POST(req as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json).toEqual({ success: true })

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { zaloClickCount: { increment: 1 } },
      select: { id: true },
    })
  })

  test("POST /api/products/track returns 400 for invalid payload", async () => {
    const req = new Request("http://localhost/api/products/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: "",
        eventType: "unknown_event",
      }),
    })

    const response = await POST(req as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json).toEqual({ error: "invalid_payload" })
    expect(mockUpdate).toHaveBeenCalledTimes(0)
  })
})
