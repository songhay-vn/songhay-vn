import { describe, expect, test } from "bun:test"
import { rateLimit, getIP, createRateLimitResponse } from "../lib/rate-limit"

describe("Unit: Rate Limiter", () => {
  test("getIP extracts IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1"
      }
    })
    expect(getIP(req as unknown as Request)).toBe("192.168.1.1")
  })

  test("getIP defaults to 127.0.0.1 when header is missing", () => {
    const req = new Request("http://localhost/api/test")
    expect(getIP(req as unknown as Request)).toBe("127.0.0.1")
  })

  test("rateLimit allows requests within limit", () => {
    const ip = "10.0.0.1"
    const config = { limit: 2, windowMs: 1000 }
    
    const req1 = rateLimit(ip, config)
    expect(req1.success).toBe(true)
    expect(req1.remaining).toBe(1)

    const req2 = rateLimit(ip, config)
    expect(req2.success).toBe(true)
    expect(req2.remaining).toBe(0)
  })

  test("rateLimit blocks requests exceeding limit", () => {
    const ip = "10.0.0.2"
    const config = { limit: 1, windowMs: 1000 }
    
    const req1 = rateLimit(ip, config)
    expect(req1.success).toBe(true)

    const req2 = rateLimit(ip, config)
    expect(req2.success).toBe(false)
    expect(req2.remaining).toBe(0)
  })

  test("createRateLimitResponse generates correct 429 response", async () => {
    const resetTime = Date.now() + 5000 // 5 seconds from now
    const response = createRateLimitResponse(resetTime)
    
    expect(response.status).toBe(429)
    expect(response.headers.get("Content-Type")).toBe("application/json")
    expect(response.headers.get("Retry-After")).toBe("5")

    const body = await response.json()
    expect(body).toEqual({ error: "Too many requests" })
  })
})
