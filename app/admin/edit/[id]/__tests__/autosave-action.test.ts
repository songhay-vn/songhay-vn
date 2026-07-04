import { expect, test, describe, mock, beforeEach } from "bun:test"

// 1. Setup mocks before importing the module we want to test
const mockRequireCmsUser = mock(() => Promise.resolve({ id: "user-1", role: "ADMIN" }))
const mockCanEditByStatus = mock(() => true)
const mockFindUnique = mock()
const mockUpdate = mock()

mock.module("@/lib/auth", () => ({
  requireCmsUser: mockRequireCmsUser,
}))

mock.module("@/lib/permissions", () => ({
  canEditByStatus: mockCanEditByStatus,
}))

mock.module("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}))

// 2. Import the module AFTER setting up mocks
import { autosaveDraftAction } from "@/app/admin/edit/[id]/autosave-action"

describe("autosaveDraftAction", () => {
  beforeEach(() => {
    mockRequireCmsUser.mockClear()
    mockCanEditByStatus.mockClear()
    mockFindUnique.mockClear()
    mockUpdate.mockClear()
  })

  test("returns error if post is not found", async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await autosaveDraftAction("post-1", {
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content",
    })

    expect(result).toEqual({ error: "not_found" })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test("returns error if user lacks permission to edit the post status", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "post-1",
      editorialStatus: "PUBLISHED",
    })
    mockCanEditByStatus.mockReturnValueOnce(false)

    const result = await autosaveDraftAction("post-1", {
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content",
    })

    expect(result).toEqual({ error: "forbidden" })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test("updates a DRAFT post and keeps it as DRAFT", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "post-1",
      title: "Old Title",
      excerpt: "Old Excerpt",
      content: "Old Content",
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
    })
    mockCanEditByStatus.mockReturnValueOnce(true)
    mockUpdate.mockResolvedValueOnce({})

    const result = await autosaveDraftAction("post-1", {
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content",
    })

    expect(result).toHaveProperty("success", true)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    
    // Assert the data passed to prisma.post.update
    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.where).toEqual({ id: "post-1" })
    expect(updateCall.data).toMatchObject({
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content",
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
      lastEditorId: "user-1",
    })
    expect(updateCall.data.updatedAt).toBeInstanceOf(Date)
  })

  test("updates a PUBLISHED post WITHOUT changing its publish status", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "post-1",
      title: "Old Title",
      excerpt: "Old Excerpt",
      content: "Old Content",
      editorialStatus: "PUBLISHED",
      isDraft: false,
      isPublished: true,
    })
    mockCanEditByStatus.mockReturnValueOnce(true)
    mockUpdate.mockResolvedValueOnce({})

    const result = await autosaveDraftAction("post-1", {
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content",
    })

    expect(result).toHaveProperty("success", true)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    
    // Assert it kept the PUBLISHED status!
    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.data).toMatchObject({
      title: "New Title",
      editorialStatus: "PUBLISHED", // SHOULD NOT BE DRAFT
      isDraft: false,               // SHOULD NOT BE TRUE
      isPublished: true,            // SHOULD NOT BE FALSE
    })
  })

  test("updates a PENDING_PUBLISH post WITHOUT changing its status", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "post-1",
      title: "Old Title",
      editorialStatus: "PENDING_PUBLISH",
      isDraft: false,
      isPublished: false,
    })
    mockCanEditByStatus.mockReturnValueOnce(true)
    mockUpdate.mockResolvedValueOnce({})

    const result = await autosaveDraftAction("post-1", {
      title: "New Title",
      excerpt: "",
      content: "",
    })

    expect(result).toHaveProperty("success", true)
    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.data).toMatchObject({
      title: "New Title",
      editorialStatus: "PENDING_PUBLISH", 
      isDraft: false,
      isPublished: false,
    })
  })

  test("falls back to existing post fields if partial data is provided", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "post-1",
      title: "Original Title",
      excerpt: "Original Excerpt",
      content: "Original Content",
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
    })
    mockCanEditByStatus.mockReturnValueOnce(true)
    mockUpdate.mockResolvedValueOnce({})

    const result = await autosaveDraftAction("post-1", {
      title: "",
      excerpt: "Only updating excerpt",
      content: "",
    })

    expect(result).toHaveProperty("success", true)
    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.data).toMatchObject({
      title: "Original Title", // Kept original
      excerpt: "Only updating excerpt", // Updated
      content: "Original Content", // Kept original
    })
  })
  test("preserves canonicalUrl and other non-autosaved fields without modifying them", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "post-1",
      title: "Old Title",
      editorialStatus: "DRAFT",
      isDraft: true,
      isPublished: false,
      canonicalUrl: "https://example.com/original-canonical",
      seoTitle: "My SEO Title",
      categoryId: "cat-1"
    })
    mockCanEditByStatus.mockReturnValueOnce(true)
    mockUpdate.mockResolvedValueOnce({})

    const result = await autosaveDraftAction("post-1", {
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content",
    })

    expect(result).toHaveProperty("success", true)
    
    const updateCall = mockUpdate.mock.calls[0][0]
    // The payload sent to Prisma MUST NOT contain canonicalUrl, seoTitle, or categoryId
    // Because Prisma only updates the fields explicitly provided in the data object.
    // If they are missing from the data object, Prisma leaves them entirely untouched in the DB.
    expect(updateCall.data).not.toHaveProperty("canonicalUrl")
    expect(updateCall.data).not.toHaveProperty("seoTitle")
    expect(updateCall.data).not.toHaveProperty("categoryId")
    
    // Ensure it did update the fields it's supposed to
    expect(updateCall.data).toMatchObject({
      title: "New Title",
      excerpt: "New Excerpt",
      content: "New Content"
    })
  })
})
