import { describe, expect, test } from "bun:test"
import {
  buildPgConnectionString,
  getDatabaseSslConfig,
  parseRejectUnauthorized,
} from "@/lib/prisma"

describe("Unit: Prisma SSL & Connection Configuration", () => {
  test("parseRejectUnauthorized parses boolean string inputs correctly", () => {
    expect(parseRejectUnauthorized(undefined)).toBeUndefined()
    expect(parseRejectUnauthorized("")).toBeUndefined()
    expect(parseRejectUnauthorized("false")).toBe(false)
    expect(parseRejectUnauthorized("FALSE")).toBe(false)
    expect(parseRejectUnauthorized("true")).toBe(true)
  })

  test("buildPgConnectionString returns unmodified connectionString when ssl is undefined", () => {
    const connStr = "postgresql://user:pass@localhost:5432/db"
    expect(buildPgConnectionString(connStr, undefined)).toBe(connStr)
  })

  test("buildPgConnectionString strips conflicting SSL params when ssl options exist", () => {
    const connStr = "postgresql://user:pass@localhost:5432/db?sslmode=require&sslcert=invalid&other=1"
    const cleaned = buildPgConnectionString(connStr, { rejectUnauthorized: false })
    expect(cleaned).toContain("other=1")
    expect(cleaned).not.toContain("sslmode=")
    expect(cleaned).not.toContain("sslcert=")
  })

  test("getDatabaseSslConfig resolves SSL config from env variables", () => {
    const origSsl = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = "false"

    const config = getDatabaseSslConfig()
    expect(config?.rejectUnauthorized).toBe(false)

    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED = origSsl
  })
})
