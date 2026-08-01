import { expect, test, describe, mock, beforeEach, afterAll } from "bun:test"

mock.module("server-only", () => ({}))
process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64 = "test"

// Mocks
const mockRequireCmsUser = mock(() => Promise.resolve({ id: "user-1", role: "ADMIN" }))
const mockRedirect = mock()
const mockRevalidatePost = mock()

mock.module("@/lib/auth", () => ({
  requireCmsUser: mockRequireCmsUser,
  authCookieName: "songhay_session",
  decodeSession: () => ({ userId: "user-1", role: "ADMIN" }),
  encodeSession: () => "token",
}))

mock.module("next/navigation", () => ({
  redirect: mockRedirect,
}))

mock.module("@/app/admin/actions-helpers", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ensurePermission: (cond: boolean, path: string) => {
    if (!cond) throw new Error("forbidden")
  },
  revalidatePost: mockRevalidatePost,
}))

const mockUpsert = mock()
const mockFindFirst = mock()
const mockUpdate = mock()
const mockFindUnique = mock()
const mockJobUpsert = mock(() => Promise.resolve({}))

mock.module("@/lib/prisma", () => ({
  prisma: {
    redirect: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
    },
    post: {
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
    searchConsoleJob: {
      upsert: mockJobUpsert,
      aggregate: mock(() => Promise.resolve({ _sum: { attempts: 0 } })),
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
    },
  },
}))

// Import the module AFTER mock setup
const { createRedirect, deleteRedirect, toggleRedirect } = await import("@/app/admin/actions/redirects")

describe("createRedirect action with auto-unpublishing", () => {
  beforeEach(() => {
    mockRequireCmsUser.mockClear()
    mockRedirect.mockClear()
    mockRevalidatePost.mockClear()
    mockUpsert.mockClear()
    mockFindFirst.mockClear()
    mockUpdate.mockClear()
    mockFindUnique.mockClear()
    mockJobUpsert.mockClear()
  })

  afterAll(() => {
    mock.restore()
  })

  test("REDIRECT_ON: hides matched post from public frontend (isPublished: false) while keeping it in Published tab", async () => {
    mockFindUnique.mockResolvedValue(null)

    // Mock that a matching post is found at the redirected fromPath
    mockFindFirst.mockResolvedValue({
      id: "post-123",
      slug: "duplicate-post",
      category: { slug: "xa-hoi" },
    })

    const formData = new FormData()
    formData.append("fromPath", "/xa-hoi/duplicate-post")
    formData.append("toPath", "/xa-hoi/pillar-post")
    formData.append("note", "Redirect duplicate")

    try {
      await createRedirect(formData)
    } catch {
      // ignore redirect call
    }

    // Verify it upserted the redirect
    expect(mockUpsert).toHaveBeenCalled()

    // Verify it queried the matching post
    expect(mockFindFirst).toHaveBeenCalled()

    // Verify post is hidden from public but stays in Published tab
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: false,
        isDraft: false,
        editorialStatus: "PUBLISHED",
      },
    })

    // Verify it triggered cache revalidation for the post
    expect(mockRevalidatePost).toHaveBeenCalledWith(
      "duplicate-post",
      "xa-hoi",
      { isVisibilityChange: true }
    )
    
    // Verify GSC inspection was enqueued for the redirect activation
    expect(mockJobUpsert).toHaveBeenCalled()
    expect((mockJobUpsert.mock.calls as unknown as Array<Array<{ create: Record<string, unknown> }>>)[0][0].create).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-123",
      url: "https://songhay.vn/xa-hoi/duplicate-post",
    })
  })

  test("deleteRedirect with republish=true republishes the matched post", async () => {
    mockFindUnique.mockResolvedValue({
      id: "redirect-123",
      fromPath: "/xa-hoi/duplicate-post",
    })
    mockFindFirst.mockResolvedValue({
      id: "post-123",
      slug: "duplicate-post",
      category: { slug: "xa-hoi" },
    })

    const formData = new FormData()
    formData.append("redirectId", "redirect-123")
    formData.append("republish", "true")

    try {
      await deleteRedirect(formData)
    } catch {
      // ignore redirect call
    }

    // Verify it updated the post to PUBLISHED
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
      },
    })
    expect(mockRevalidatePost).toHaveBeenCalledWith(
      "duplicate-post",
      "xa-hoi",
      { isVisibilityChange: true }
    )
    
    expect(mockJobUpsert).toHaveBeenCalled()
    expect((mockJobUpsert.mock.calls as unknown as Array<Array<{ create: Record<string, unknown> }>>)[0][0].create).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-123",
      url: "https://songhay.vn/xa-hoi/duplicate-post",
    })
  })

  test("toggleRedirect turning OFF with republish=true republishes the matched post", async () => {
    mockFindUnique.mockResolvedValue({
      id: "redirect-123",
      fromPath: "/xa-hoi/duplicate-post",
    })
    mockFindFirst.mockResolvedValue({
      id: "post-123",
      slug: "duplicate-post",
      category: { slug: "xa-hoi" },
    })

    const formData = new FormData()
    formData.append("redirectId", "redirect-123")
    formData.append("isActive", "true") // Currently active (turning it OFF)
    formData.append("republish", "true")

    try {
      await toggleRedirect(formData)
    } catch {
      // ignore redirect call
    }

    // Verify it updated the post to PUBLISHED
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: true,
        isDraft: false,
        editorialStatus: "PUBLISHED",
      },
    })
    expect(mockRevalidatePost).toHaveBeenCalledWith(
      "duplicate-post",
      "xa-hoi",
      { isVisibilityChange: true }
    )
    
    // Verify GSC inspection was enqueued
    expect(mockJobUpsert).toHaveBeenCalled()
    expect((mockJobUpsert.mock.calls as unknown as Array<Array<{ create: Record<string, unknown> }>>)[0][0].create).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-123",
      url: "https://songhay.vn/xa-hoi/duplicate-post",
    })
  })

  test("toggleRedirect turning ON: hides matched post from public frontend (isPublished: false) while keeping it in Published tab", async () => {
    mockFindUnique.mockResolvedValue({
      id: "redirect-123",
      fromPath: "/xa-hoi/duplicate-post",
    })
    mockFindFirst.mockResolvedValue({
      id: "post-123",
      slug: "duplicate-post",
      category: { slug: "xa-hoi" },
    })

    const formData = new FormData()
    formData.append("redirectId", "redirect-123")
    formData.append("isActive", "false") // Currently inactive (turning it ON)

    try {
      await toggleRedirect(formData)
    } catch {
      // ignore redirect call
    }

    // Verify post is hidden from public but stays in Published tab
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: false,
        isDraft: false,
        editorialStatus: "PUBLISHED",
      },
    })
    expect(mockRevalidatePost).toHaveBeenCalledWith(
      "duplicate-post",
      "xa-hoi",
      { isVisibilityChange: true }
    )

    // Verify GSC inspection was enqueued for the redirect path
    expect(mockJobUpsert).toHaveBeenCalled()
    expect((mockJobUpsert.mock.calls as unknown as Array<Array<{ create: Record<string, unknown> }>>)[0][0].create).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-123",
      url: "https://songhay.vn/xa-hoi/duplicate-post",
    })
  })

  test("deleteRedirect with republish=false demotes the matched post to PENDING_PUBLISH", async () => {
    mockFindUnique.mockResolvedValue({
      id: "redirect-123",
      fromPath: "/xa-hoi/duplicate-post",
    })
    mockFindFirst.mockResolvedValue({
      id: "post-123",
      slug: "duplicate-post",
      category: { slug: "xa-hoi" },
    })

    const formData = new FormData()
    formData.append("redirectId", "redirect-123")
    formData.append("republish", "false")

    try {
      await deleteRedirect(formData)
    } catch {
      // ignore redirect call
    }

    // Verify it updated the post to PENDING_PUBLISH
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: false,
        isDraft: false,
        editorialStatus: "PENDING_PUBLISH",
      },
    })
  })

  test("toggleRedirect turning OFF with republish=false demotes the matched post to PENDING_PUBLISH", async () => {
    mockFindUnique.mockResolvedValue({
      id: "redirect-123",
      fromPath: "/xa-hoi/duplicate-post",
    })
    mockFindFirst.mockResolvedValue({
      id: "post-123",
      slug: "duplicate-post",
      category: { slug: "xa-hoi" },
    })

    const formData = new FormData()
    formData.append("redirectId", "redirect-123")
    formData.append("isActive", "true") // Currently active (turning it OFF)
    formData.append("republish", "false")

    try {
      await toggleRedirect(formData)
    } catch {
      // ignore redirect call
    }

    // Verify it updated the post to PENDING_PUBLISH
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: false,
        isDraft: false,
        editorialStatus: "PENDING_PUBLISH",
      },
    })
  })
})
