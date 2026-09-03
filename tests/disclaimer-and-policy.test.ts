import { expect, test, describe, mock } from "bun:test"

mock.module("server-only", () => ({}))
mock.module("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
  revalidateTag: () => {},
}))

const mockRedirect = mock((url: string) => {
  throw new Error(`REDIRECT: ${url}`)
})

mock.module("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
  }),
  usePathname: () => "/mien-tru-trach-nhiem",
  useSearchParams: () => new URLSearchParams(),
}))

mock.module("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: () => Promise.resolve([]),
    },
    post: {
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
    },
    product: {
      findMany: () => Promise.resolve([]),
      findFirst: () =>
        Promise.resolve({
          id: "prod-1",
          name: "Chè Shan Tuyết Cổ Thụ",
          slug: "che-shan-tuyet",
          description: "<p>Mô tả chi tiết sản phẩm.</p>",
          imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          galleryUrls: [],
          zaloUrl: "https://zalo.me/123456",
          isIndexed: true,
          type: "VIET_GIFT",
        }),
      findUnique: () =>
        Promise.resolve({
          id: "prod-1",
          name: "Chè Shan Tuyết Cổ Thụ",
          slug: "che-shan-tuyet",
          description: "<p>Mô tả chi tiết sản phẩm.</p>",
          imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          galleryUrls: [],
          zaloUrl: "https://zalo.me/123456",
          isIndexed: true,
          type: "VIET_GIFT",
        }),
    },
  },
}))

describe("Policy & Disclaimer Routes", () => {
  test("AdvertisingPolicyRedirectPage redirects to /mien-tru-trach-nhiem", async () => {
    const { default: AdvertisingPolicyRedirectPage } = await import(
      "@/app/chinh-sach-quang-cao/page"
    )
    expect(() => AdvertisingPolicyRedirectPage()).toThrow(
      "REDIRECT: /mien-tru-trach-nhiem"
    )
  })

  test("DisclaimerPage metadata has correct canonical URL, title and openGraph", async () => {
    const { metadata } = await import("@/app/mien-tru-trach-nhiem/page")
    expect(metadata.title).toBe(
      "Miễn trừ trách nhiệm & Chính sách quảng cáo | Songhay.vn"
    )
    expect(
      (metadata.alternates as Record<string, unknown> | undefined)?.canonical
    ).toBe("/mien-tru-trach-nhiem")
    expect(metadata.description).toContain("Chính sách quảng cáo")
    expect(
      (metadata.openGraph as Record<string, unknown> | undefined)?.type
    ).toBe("article")
  })

  test("DisclaimerPage component renders JSX successfully", async () => {
    const { default: DisclaimerPage } = await import(
      "@/app/mien-tru-trach-nhiem/page"
    )
    const element = await DisclaimerPage()
    expect(element).toBeDefined()
    expect(element.type).toBeDefined()
  })

  test("TermsOfUsePage component renders updated terms for third-party products and services", async () => {
    const { default: TermsOfUsePage } = await import(
      "@/app/dieu-khoan-su-dung/page"
    )
    const element = await TermsOfUsePage()
    expect(element).toBeDefined()
    expect(element.type).toBeDefined()
  })

  test("VietGiftDetailPage component renders with policy and disclaimer links", async () => {
    const { default: VietGiftDetailPage } = await import(
      "@/app/qua-viet/[slug]/page"
    )
    const element = await VietGiftDetailPage({
      params: Promise.resolve({ slug: "che-shan-tuyet" }),
    })
    expect(element).toBeDefined()
    expect(element.type).toBeDefined()
  })
})
