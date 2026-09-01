import { describe, expect, test, mock, beforeEach } from "bun:test"

// Mock Next.js and server modules
mock.module("server-only", () => ({}))

mock.module("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`Redirected to ${url}`)
  },
}))

mock.module("next/cache", () => ({
  revalidateTag: () => {},
  updateTag: () => {},
  revalidatePath: () => {},
  cacheTag: () => {},
  cacheLife: () => {},
}))

mock.module("next/server", () => ({
  after: () => {},
}))

mock.module("@/app/admin/actions-helpers", () => ({
  requireActionPermission: async () => true,
}))

mock.module("@/lib/search-console", () => ({
  getSearchConsoleSitemapUrl: () => "https://songhay.vn/sitemap.xml",
  isSearchConsoleConfigured: () => false,
}))

mock.module("@/lib/cloudinary", () => ({
  deleteCloudinaryAsset: async () => {},
  extractCloudinaryPublicId: () => null,
}))

// Prisma Mocks
const mockCreate = mock(() => Promise.resolve({ id: "new-prod", slug: "tra-shan-tuyet" } as any))
const mockUpdate = mock(() => Promise.resolve({ id: "prod-1", slug: "tra-shan-tuyet" } as any))
const mockDelete = mock(() => Promise.resolve({ id: "prod-1" } as any))
const mockFindUnique = mock(() =>
  Promise.resolve({
    id: "prod-1",
    name: "Existing Product",
    slug: "existing-product",
    imageUrl: "https://res.cloudinary.com/test.jpg",
    galleryUrls: [],
    isIndexed: true,
  } as any)
)
const mockAggregate = mock(() => Promise.resolve({ _max: { sortOrder: 3 } } as any))
const mockFindMany = mock(() => Promise.resolve([] as any))
const mockFindFirst = mock(() => Promise.resolve(null as any))
const mockCount = mock(() => Promise.resolve(0))
const mockTransaction = mock((promises) => Promise.all(promises as any))
const mockJobUpsert = mock(() => Promise.resolve({} as any))

mock.module("@/lib/prisma", () => ({
  prisma: {
    product: {
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      findUnique: mockFindUnique,
      aggregate: mockAggregate,
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      count: mockCount,
    },
    post: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({})),
    },
    redirect: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      upsert: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    category: {
      findMany: mock(() => Promise.resolve([])),
    },
    searchConsoleQueueJob: {
      upsert: mockJobUpsert,
    },
    $transaction: mockTransaction,
  },
}))

const {
  createProduct,
  updateProduct,
  deleteProduct: deleteProductAction,
  toggleProductIndex,
  updateBulkSidebarSettings,
} = await import("@/app/admin/actions/products")

const {
  getAllIndexedVietGifts,
  getVietGiftBySlug,
  getFeaturedVietGiftsForSidebar,
  getProductsForSidebar,
  getAllIndexedProducts,
  getProductBySlug,
} = await import("@/lib/queries")

describe("Integration & Unit: Quà Việt & Products Suite", () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockUpdate.mockClear()
    mockDelete.mockClear()
    mockFindUnique.mockClear()
    mockAggregate.mockClear()
    mockFindMany.mockClear()
    mockFindFirst.mockClear()
    mockCount.mockClear()
    mockTransaction.mockClear()
    mockJobUpsert.mockClear()
  })

  describe("Admin Actions", () => {
    test("createProduct creates a VIET_GIFT with custom zaloUrl", async () => {
      const formData = new FormData()
      formData.append("name", "Trà Shan Tuyết Tà Xùa")
      formData.append("type", "VIET_GIFT")
      formData.append("zaloUrl", "https://zalo.me/0988123456")
      formData.append("imageUrl", "https://res.cloudinary.com/tra.jpg")
      formData.append("galleryUrls", JSON.stringify(["https://res.cloudinary.com/gallery1.jpg"]))
      formData.append("description", "<p>Mô tả trà</p>")

      mockFindUnique.mockImplementationOnce(() => Promise.resolve(null as any))

      try {
        await createProduct(formData)
      } catch (e) {
        expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_created")
      }

      expect(mockCreate).toHaveBeenCalledTimes(1)
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          type: "VIET_GIFT",
          name: "Trà Shan Tuyết Tà Xùa",
          slug: "tra-shan-tuyet-ta-xua",
          imageUrl: "https://res.cloudinary.com/tra.jpg",
          imagePublicId: null,
          galleryUrls: ["https://res.cloudinary.com/gallery1.jpg"],
          description: "<p>Mô tả trà</p>",
          zaloUrl: "https://zalo.me/0988123456",
          sortOrder: 4,
          isIndexed: true,
        },
      })
    })

    test("createProduct defaults to SCIENCE_PRODUCT when type is empty", async () => {
      const formData = new FormData()
      formData.append("name", "Nano Curcumin Viện Hàn Lâm")
      formData.append("imageUrl", "https://res.cloudinary.com/nano.jpg")

      mockFindUnique.mockImplementationOnce(() => Promise.resolve(null as any))

      try {
        await createProduct(formData)
      } catch (e) {
        expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_created")
      }

      expect(mockCreate).toHaveBeenCalledTimes(1)
      const callArg = (mockCreate.mock.calls[0] as any)?.[0]
      expect(callArg.data.type).toBe("SCIENCE_PRODUCT")
      expect(callArg.data.zaloUrl).toBeNull()
    })

    test("updateProduct updates VIET_GIFT fields properly", async () => {
      const formData = new FormData()
      formData.append("productId", "prod-1")
      formData.append("name", "Yến Sào Khánh Hòa")
      formData.append("type", "VIET_GIFT")
      formData.append("zaloUrl", "https://zalo.me/0912345678")
      formData.append("imageUrl", "https://res.cloudinary.com/yen.jpg")
      formData.append("galleryUrls", JSON.stringify([]))

      mockFindUnique.mockImplementationOnce(() =>
        Promise.resolve({
          id: "prod-1",
          name: "Old Product",
          slug: "old-slug",
          imageUrl: "https://res.cloudinary.com/yen.jpg",
          galleryUrls: [],
          isIndexed: true,
        } as any)
      )
      mockFindUnique.mockImplementationOnce(() => Promise.resolve(null as any))

      try {
        await updateProduct(formData)
      } catch (e) {
        expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_updated")
      }

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: {
          type: "VIET_GIFT",
          name: "Yến Sào Khánh Hòa",
          slug: "yen-sao-khanh-hoa",
          imageUrl: "https://res.cloudinary.com/yen.jpg",
          imagePublicId: null,
          galleryUrls: [],
          description: null,
          zaloUrl: "https://zalo.me/0912345678",
        },
      })
    })

    test("toggleProductIndex flips isIndexed status", async () => {
      const formData = new FormData()
      formData.append("productId", "prod-1")

      mockFindUnique.mockImplementationOnce(() =>
        Promise.resolve({
          id: "prod-1",
          slug: "tra-shan-tuyet",
          isIndexed: true,
        } as any)
      )

      try {
        await toggleProductIndex(formData)
      } catch (e) {
        expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_updated")
      }

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { isIndexed: false },
      })
    })

    test("deleteProductAction removes product and redirects", async () => {
      const formData = new FormData()
      formData.append("productId", "prod-1")

      mockFindUnique.mockImplementationOnce(() =>
        Promise.resolve({
          id: "prod-1",
          slug: "tra-shan-tuyet",
          imageUrl: "https://res.cloudinary.com/tra.jpg",
          imagePublicId: null,
          galleryUrls: [],
        } as any)
      )

      try {
        await deleteProductAction(formData)
      } catch (e) {
        expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_deleted")
      }

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: "prod-1" },
      })
    })

    test("updateBulkSidebarSettings processes formData and updates products in transaction", async () => {
      const formData = new FormData()
      formData.append("productIds", "prod-1")
      formData.append("productIds", "prod-2")
      formData.append("visibility_prod-1", "true")
      formData.append("order_prod-1", "1")
      formData.append("order_prod-2", "2")

      try {
        await updateBulkSidebarSettings(formData)
      } catch (e) {
        expect((e as Error).message).toBe("Redirected to /admin?tab=products&toast=product_updated")
      }

      expect(mockTransaction).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalledTimes(2)

      expect(mockUpdate).toHaveBeenNthCalledWith(1, {
        where: { id: "prod-1" },
        data: { showOnSidebar: true, sortOrder: 1 },
      })

      expect(mockUpdate).toHaveBeenNthCalledWith(2, {
        where: { id: "prod-2" },
        data: { showOnSidebar: false, sortOrder: 2 },
      })
    })
  })

  describe("Public Queries", () => {
    test("getAllIndexedVietGifts queries with type VIET_GIFT", async () => {
      const mockData = [
        { id: "vg-1", name: "Trà Shan Tuyết", slug: "tra-shan-tuyet", imageUrl: "img.jpg" },
      ]
      mockFindMany.mockImplementationOnce(() => Promise.resolve(mockData as any))

      const result = await getAllIndexedVietGifts()
      expect(result).toEqual(mockData as any)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { type: "VIET_GIFT" },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      })
    })

    test("getVietGiftBySlug queries single VIET_GIFT product by slug", async () => {
      const mockProduct = {
        id: "vg-1",
        name: "Trà Shan Tuyết",
        slug: "tra-shan-tuyet",
        type: "VIET_GIFT",
      }
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(mockProduct as any))

      const result = await getVietGiftBySlug("tra-shan-tuyet")
      expect(result).toEqual(mockProduct as any)

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { slug: "tra-shan-tuyet", type: "VIET_GIFT" },
      })
    })

    test("getFeaturedVietGiftsForSidebar excludes current viewing slug when specified", async () => {
      const mockData = [
        { id: "vg-2", name: "Yến Sào", slug: "yen-sao", imageUrl: "yen.jpg" },
      ]
      mockFindMany.mockImplementationOnce(() => Promise.resolve(mockData as any))

      const result = await getFeaturedVietGiftsForSidebar(4, "tra-shan-tuyet")
      expect(result).toEqual(mockData as any)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          type: "VIET_GIFT",
          isIndexed: true,
          slug: { not: "tra-shan-tuyet" },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 4,
      })
    })

    test("getProductsForSidebar queries only SCIENCE_PRODUCT with showOnSidebar true", async () => {
      const mockProducts = [
        { id: "sp-1", name: "Nano Curcumin", slug: "nano-curcumin", imageUrl: "nano.jpg" },
      ]
      mockFindMany.mockImplementationOnce(() => Promise.resolve(mockProducts as any))
      mockCount.mockImplementationOnce(() => Promise.resolve(1))

      const result = await getProductsForSidebar()
      expect(result.products).toEqual(mockProducts as any)
      expect(result.totalCount).toBe(1)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { showOnSidebar: true, type: "SCIENCE_PRODUCT" },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 5,
      })
    })

    test("getAllIndexedProducts queries only SCIENCE_PRODUCT", async () => {
      const mockData = [
        { id: "sp-1", name: "Nano Curcumin", slug: "nano-curcumin", imageUrl: "nano.jpg" },
      ]
      mockFindMany.mockImplementationOnce(() => Promise.resolve(mockData as any))

      const result = await getAllIndexedProducts()
      expect(result).toEqual(mockData as any)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { type: "SCIENCE_PRODUCT" },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      })
    })

    test("getProductBySlug queries single SCIENCE_PRODUCT by slug", async () => {
      const mockProduct = {
        id: "sp-1",
        name: "Nano Curcumin",
        slug: "nano-curcumin",
        type: "SCIENCE_PRODUCT",
      }
      mockFindFirst.mockImplementationOnce(() => Promise.resolve(mockProduct as any))

      const result = await getProductBySlug("nano-curcumin")
      expect(result).toEqual(mockProduct as any)

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: { slug: "nano-curcumin", type: "SCIENCE_PRODUCT" },
      })
    })
  })
})
