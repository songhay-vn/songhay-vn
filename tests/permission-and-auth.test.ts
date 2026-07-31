import { describe, expect, test } from "bun:test"
import { decodeSession, encodeSession } from "../lib/session"

// ── Session crypto round-trip ────────────────────────────────────────────────

describe("session encoding / decoding", () => {
  test("encodes and decodes a valid session round-trip", () => {
    const token = encodeSession({ userId: "user-abc", role: "CONTRIBUTOR" })
    const decoded = decodeSession(token)

    expect(decoded).not.toBeNull()
    expect(decoded?.userId).toBe("user-abc")
    expect(decoded?.role).toBe("CONTRIBUTOR")
  })

  test("decodes EDITOR_IN_CHIEF role correctly", () => {
    const token = encodeSession({
      userId: "chief-xyz",
      role: "EDITOR_IN_CHIEF",
    })
    const decoded = decodeSession(token)

    expect(decoded?.role).toBe("EDITOR_IN_CHIEF")
    expect(decoded?.userId).toBe("chief-xyz")
  })

  test("returns null for a tampered token (signature mismatch)", () => {
    const token = encodeSession({ userId: "user-abc", role: "CONTRIBUTOR" })
    const [data] = token.split(".")
    const tampered = `${data}.invalidsig`

    expect(decodeSession(tampered)).toBeNull()
  })

  test("returns null for an expired session", () => {
    // TTL of -1 second → already expired
    const token = encodeSession({ userId: "user-abc", role: "CONTRIBUTOR" }, -1)
    expect(decodeSession(token)).toBeNull()
  })

  test("returns null for an empty / undefined token", () => {
    expect(decodeSession(undefined)).toBeNull()
    expect(decodeSession(null)).toBeNull()
    expect(decodeSession("")).toBeNull()
  })

  test("returns null for a token without period separator", () => {
    expect(decodeSession("nodottoken")).toBeNull()
  })

  test("returns null for a token with valid structure but garbage payload", () => {
    // base64url-encode some non-JSON garbage
    const garbage = Buffer.from("not-json!!!").toString("base64url")
    const result = decodeSession(`${garbage}.whatever`)
    expect(result).toBeNull()
  })

  test("throws error in production if AUTH_SECRET and NEXTAUTH_SECRET are missing", () => {
    const origEnv = process.env.NODE_ENV
    const origAuthSecret = process.env.AUTH_SECRET
    const origNextAuthSecret = process.env.NEXTAUTH_SECRET
    const envObj = process.env as Record<string, string | undefined>

    try {
      envObj.NODE_ENV = "production"
      delete process.env.AUTH_SECRET
      delete process.env.NEXTAUTH_SECRET

      expect(() => encodeSession({ userId: "u1", role: "ADMIN" })).toThrow(
        "AUTH_SECRET or NEXTAUTH_SECRET environment variable is missing in production"
      )
    } finally {
      envObj.NODE_ENV = origEnv
      if (origAuthSecret !== undefined) process.env.AUTH_SECRET = origAuthSecret
      else delete process.env.AUTH_SECRET
      if (origNextAuthSecret !== undefined) process.env.NEXTAUTH_SECRET = origNextAuthSecret
      else delete process.env.NEXTAUTH_SECRET
    }
  })
})
