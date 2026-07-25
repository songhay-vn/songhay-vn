import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { decodeSession, encodeSession } from "../lib/session"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

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

// ── Auth guard source assertions ─────────────────────────────────────────────

describe("auth guard source checks", () => {
  test("requireAdminUser keeps elevated guard behavior", () => {
    const source = readWorkspaceFile("lib/auth.ts")

    expect(source).toContain("export async function requireAdminUser")
    expect(source).toContain("requireUser")
    expect(source).toContain("canDeleteAnyMedia(role) || canCreateSubordinateAccount(role)")
    expect(source).toContain('redirect("/")')
  })

  test("requireCmsUser redirects to login when no session", () => {
    const source = readWorkspaceFile("lib/auth.ts")

    // Unauthenticated → redirect to login
    expect(source).toContain('redirect("/login?admin=1")')
    expect(source).toContain("export async function requireCmsUser")
    expect(source).toContain("export async function requireAdminUser")
  })

  test("category and system-sensitive actions still enforce elevated checks", () => {
    const categoriesSource = readWorkspaceFile(
      "app/admin/actions/categories.ts"
    )
    const settingsSource = readWorkspaceFile("app/admin/actions/settings.ts")

    expect(categoriesSource).toMatch(
      /export async function createCategory[\s\S]*?requireAdminUser/
    )
    expect(settingsSource).toMatch(
      /export async function createSubordinateAccount[\s\S]*?requireEditorInChiefUser/
    )
    expect(categoriesSource).toContain(
      'ensurePermission(can(currentUser.role, "edit-category")'
    )
    expect(categoriesSource).toContain(
      'if (!can(currentUser.role, "delete-category"))'
    )
  })

  test("CMS actions use requireCmsUser plus capability checks", () => {
    const postsSource = readWorkspaceFile("app/admin/actions/posts.ts")
    const workflowSource = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(postsSource).toMatch(
      /export async function createPost[\s\S]*?requireCmsUser/
    )
    expect(postsSource).toContain("resolveEditorialFromSubmitAction")
    expect(workflowSource).toContain("canApprovePendingReview")
    expect(postsSource).toMatch(
      /export async function movePostToTrash[\s\S]*?requireCmsUser/
    )
    expect(postsSource).toMatch(
      /export async function restorePostFromTrash[\s\S]*?requireCmsUser/
    )
  })

  test("session cookie is httpOnly and uses lax sameSite", () => {
    const source = readWorkspaceFile("lib/auth.ts")

    expect(source).toContain("httpOnly: true")
    expect(source).toContain('sameSite: "lax"')
    // Only secure in production
    expect(source).toContain('secure: process.env.NODE_ENV === "production"')
  })
})
