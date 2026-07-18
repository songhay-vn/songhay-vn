import { expect, test, describe, mock, beforeEach, afterAll } from "bun:test"

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
  ensurePermission: (cond: boolean, path: string) => {
    if (!cond) throw new Error("forbidden")
  },
  revalidatePost: mockRevalidatePost,
}))

const mockUpsert = mock()
const mockFindFirst = mock()
const mockUpdate = mock()
const mockFindUnique = mock()
const mockJobCreate = mock(() => Promise.resolve({}))

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
      create: mockJobCreate,
      aggregate: mock(() => Promise.resolve({ _sum: { attempts: 0 } })),
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
    },
  },
}))

// Import the module AFTER mock setup
import { createRedirect, deleteRedirect, toggleRedirect } from "@/app/admin/actions/redirects"

describe("createRedirect action with auto-unpublishing", () => {
  beforeEach(() => {
    mockRequireCmsUser.mockClear()
    mockRedirect.mockClear()
    mockRevalidatePost.mockClear()
    mockUpsert.mockClear()
    mockFindFirst.mockClear()
    mockUpdate.mockClear()
    mockFindUnique.mockClear()
    mockJobCreate.mockClear()
  })

  afterAll(() => {
    mock.restore()
  })

  test("Automatically unpublishes a matched active published post", async () => {
    mockFindUnique.mockResolvedValue(null)

    // Mock that a matching published post is found at the redirected fromPath
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
    } catch (e) {
      // ignore redirect call
    }

    // Verify it upserted the redirect
    expect(mockUpsert).toHaveBeenCalled()

    // Verify it queried the matching post
    expect(mockFindFirst).toHaveBeenCalled()

    // Verify it updated the post to DRAFT
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: false,
        isDraft: true,
        editorialStatus: "DRAFT",
      },
    })

    // Verify it triggered cache revalidation for the post
    expect(mockRevalidatePost).toHaveBeenCalledWith(
      "duplicate-post",
      "xa-hoi",
      { isVisibilityChange: true }
    )
    
    // Verify GSC inspection was enqueued for the redirect activation
    expect(mockJobCreate).toHaveBeenCalled()
    expect(mockJobCreate.mock.calls[0][0].data).toMatchObject({
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
    } catch (e) {
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
    
    // Verify GSC inspection was enqueued by looking at mockJobCreate
    expect(mockJobCreate).toHaveBeenCalled()
    expect(mockJobCreate.mock.calls[0][0].data).toMatchObject({
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
    } catch (e) {
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
    expect(mockJobCreate).toHaveBeenCalled()
    expect(mockJobCreate.mock.calls[0][0].data).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-123",
      url: "https://songhay.vn/xa-hoi/duplicate-post",
    })
  })

  test("toggleRedirect turning ON automatically enqueues GSC inspection for the redirect path", async () => {
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
    } catch (e) {
      // ignore redirect call
    }

    // Verify it updated the post to DRAFT
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "post-123" },
      data: {
        isPublished: false,
        isDraft: true,
        editorialStatus: "DRAFT",
      },
    })
    expect(mockRevalidatePost).toHaveBeenCalledWith(
      "duplicate-post",
      "xa-hoi",
      { isVisibilityChange: true }
    )

    // Verify GSC inspection was enqueued for the redirect path
    expect(mockJobCreate).toHaveBeenCalled()
    expect(mockJobCreate.mock.calls[0][0].data).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-123",
      url: "https://songhay.vn/xa-hoi/duplicate-post",
    })
  })
})
