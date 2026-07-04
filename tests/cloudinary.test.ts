import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import { deleteCloudinaryAsset } from "../lib/cloudinary"

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
})
