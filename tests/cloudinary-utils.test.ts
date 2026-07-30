import { describe, expect, test } from "bun:test"
import { extractCloudinaryPublicId } from "@/lib/cloudinary"

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
})
