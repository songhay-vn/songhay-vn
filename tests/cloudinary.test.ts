import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import { deleteCloudinaryAsset, extractCloudinaryPublicId } from "../lib/cloudinary"

describe("Unit: Cloudinary Utilities", () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud"
    process.env.CLOUDINARY_API_KEY = "test-key"
    process.env.CLOUDINARY_API_SECRET = "test-secret"
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test("deleteCloudinaryAsset does not throw on success", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation((() =>
      Promise.resolve(new Response(JSON.stringify({ result: "ok" }), { status: 200 }))
    ) as unknown as typeof fetch)
    const consoleSpy = spyOn(console, "error")

    await deleteCloudinaryAsset("test-public-id")

    expect(fetchSpy).toHaveBeenCalled()
    const callUrl = fetchSpy.mock.calls[0][0]
    expect(callUrl).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/destroy")

    expect(consoleSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test("deleteCloudinaryAsset logs error on failed response", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation((() =>
      Promise.resolve(new Response(JSON.stringify({ error: { message: "Not found" } }), { status: 404 }))
    ) as unknown as typeof fetch)
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {})

    await deleteCloudinaryAsset("test-public-id")

    expect(fetchSpy).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith("Cloudinary deletion failed for test-public-id:", "Not found")
    
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test("deleteCloudinaryAsset returns early if missing credentials", async () => {
    process.env.CLOUDINARY_API_KEY = ""
    process.env.CLOUDINARY_UPLOAD_PRESET = "test-preset"
    
    const fetchSpy = spyOn(globalThis, "fetch")
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {})

    await deleteCloudinaryAsset("test-public-id")

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith("Missing Cloudinary API Key/Secret for deletion")
    
    fetchSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  test("extractCloudinaryPublicId extracts publicId correctly from Cloudinary URLs", () => {
    const url1 = "https://res.cloudinary.com/demo/image/upload/c_limit,w_1920/v12345/songhay/editor/sample1.jpg"
    const url2 = "https://res.cloudinary.com/demo/image/upload/v9999/songhay/editor/sample2.png"
    const url3 = "https://res.cloudinary.com/demo/image/upload/songhay/products/gallery1.webp"

    expect(extractCloudinaryPublicId(url1)).toBe("songhay/editor/sample1")
    expect(extractCloudinaryPublicId(url2)).toBe("songhay/editor/sample2")
    expect(extractCloudinaryPublicId(url3)).toBe("songhay/products/gallery1")
    expect(extractCloudinaryPublicId("https://example.com/other.jpg")).toBeNull()
  })
})
