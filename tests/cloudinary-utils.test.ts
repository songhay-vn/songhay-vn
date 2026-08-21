import { describe, expect, test } from "bun:test"
import { extractCloudinaryPublicId, getOptimizedImageUrl } from "@/lib/cloudinary"

describe("Unit: Cloudinary Utilities", () => {
  test("extractCloudinaryPublicId extracts public ID from versioned Cloudinary URLs", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1623456789/songhay/posts/sample.jpg"
    expect(extractCloudinaryPublicId(url)).toBe("songhay/posts/sample")
  })

  test("extractCloudinaryPublicId extracts public ID from transformed Cloudinary URLs", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/c_fill,w_320,h_320/v1/songhay/avatars/user.png"
    expect(extractCloudinaryPublicId(url)).toBe("songhay/avatars/user")
  })

  test("extractCloudinaryPublicId returns null for non-Cloudinary or invalid URLs", () => {
    expect(extractCloudinaryPublicId("https://example.com/images/photo.jpg")).toBeNull()
    expect(extractCloudinaryPublicId("")).toBeNull()
    // @ts-expect-error test non-string invalid input
    expect(extractCloudinaryPublicId(null)).toBeNull()
  })

  describe("getOptimizedImageUrl", () => {
    test("optimizes standard Cloudinary URL with specified width and default options", () => {
      const original = "https://res.cloudinary.com/demo/image/upload/v12345/songhay/editor/photo.jpg"
      const optimized = getOptimizedImageUrl(original, { width: 360, crop: "limit" })
      expect(optimized).toBe("https://res.cloudinary.com/demo/image/upload/c_limit,w_360,q_auto,f_auto/v12345/songhay/editor/photo.jpg")
    })

    test("optimizes with custom width, height, and fill crop", () => {
      const original = "https://res.cloudinary.com/demo/image/upload/v12345/songhay/thumbnails/post.jpg"
      const optimized = getOptimizedImageUrl(original, { width: 72, height: 72, crop: "fill" })
      expect(optimized).toBe("https://res.cloudinary.com/demo/image/upload/c_fill,w_72,h_72,q_auto,f_auto/v12345/songhay/thumbnails/post.jpg")
    })

    test("returns non-Cloudinary URLs untouched", () => {
      expect(getOptimizedImageUrl("https://images.unsplash.com/photo-123", { width: 360 })).toBe("https://images.unsplash.com/photo-123")
      expect(getOptimizedImageUrl("blob:http://localhost:3000/1234-5678", { width: 360 })).toBe("blob:http://localhost:3000/1234-5678")
      expect(getOptimizedImageUrl("/local/image.png", { width: 360 })).toBe("/local/image.png")
    })

    test("handles null, undefined, and empty string gracefully", () => {
      expect(getOptimizedImageUrl(null)).toBe("")
      expect(getOptimizedImageUrl(undefined)).toBe("")
      expect(getOptimizedImageUrl("")).toBe("")
    })
  })
})

